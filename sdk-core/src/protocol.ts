/**
 * AirSign Protocol Message Handling
 * 
 * Provides message envelope validation, presence packet parsing,
 * and protocol-level message processing with security checks.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  type PresencePacket, 
  type MessageEnvelope, 
  type MessageMeta,
  type ValidationConfig,
  MessageType,
  AirSignError,
  ErrorCode
} from './types.js';
import { hashMessageEnvelope, verifySenderSignature } from './crypto.js';

/**
 * In-memory store for replay protection
 */
const seenMessageIds = new Set<string>();

/**
 * Default validation configuration
 */
const DEFAULT_VALIDATION: ValidationConfig = {
  maxMessageAge: 5 * 60 * 1000, // 5 minutes
  enforceExpiry: true,
  replayProtection: true
};

/**
 * Parse and validate a presence packet from JSON string
 * 
 * @param packetJson - JSON string containing presence packet
 * @returns Validated presence packet
 * @throws {AirSignError} If packet is invalid
 * 
 * @example
 * ```typescript
 * const packet = parsePresence('{"proto":"airsign-v1","ephemeral_pub":"...", ...}');
 * console.log(packet.name); // Device name
 * ```
 */
export function parsePresence(packetJson: string): PresencePacket {
  try {
    const packet = JSON.parse(packetJson) as PresencePacket;
    
    // Validate required fields
    if (packet.proto !== 'airsign-v1') {
      throw new AirSignError(
        'Invalid protocol version',
        ErrorCode.INVALID_PRESENCE,
        { proto: packet.proto }
      );
    }
    
    if (!packet.ephemeral_pub || typeof packet.ephemeral_pub !== 'string') {
      throw new AirSignError(
        'Missing or invalid ephemeral_pub',
        ErrorCode.MISSING_FIELD
      );
    }
    
    if (!packet.name || typeof packet.name !== 'string' || packet.name.trim().length === 0) {
      throw new AirSignError(
        'Missing or invalid device name',
        ErrorCode.MISSING_FIELD
      );
    }
    
    if (!Array.isArray(packet.capabilities)) {
      throw new AirSignError(
        'Missing or invalid capabilities array',
        ErrorCode.MISSING_FIELD
      );
    }
    
    if (!packet.timestamp || typeof packet.timestamp !== 'number' || packet.timestamp <= 0) {
      throw new AirSignError(
        'Missing or invalid timestamp',
        ErrorCode.MISSING_FIELD
      );
    }
    
    // Validate timestamp is not too old (within 1 hour)
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour
    if (now - packet.timestamp > maxAge) {
      throw new AirSignError(
        'Presence packet is too old',
        ErrorCode.EXPIRED_MESSAGE,
        { timestamp: packet.timestamp, age: now - packet.timestamp }
      );
    }
    
    // Validate base64 public key format
    if (!isValidBase64(packet.ephemeral_pub)) {
      throw new AirSignError(
        'Invalid base64 format for ephemeral_pub',
        ErrorCode.INVALID_PRESENCE
      );
    }
    
    return packet;
  } catch (error) {
    if (error instanceof AirSignError) {
      throw error;
    }
    
    throw new AirSignError(
      'Failed to parse presence packet',
      ErrorCode.INVALID_PRESENCE,
      { error }
    );
  }
}

/**
 * Create a new message envelope with validation
 * 
 * @param type - Message type
 * @param payload - Message payload as string
 * @param meta - Message metadata
 * @param senderSig - Optional sender signature (hex)
 * @param senderPub - Optional sender public key (hex)
 * @returns Validated message envelope
 * @throws {AirSignError} If parameters are invalid
 * 
 * @example
 * ```typescript
 * const envelope = createMessageEnvelope(
 *   MessageType.PAYMENT_URI,
 *   'ethereum:0x123...?value=1000000000000000000',
 *   { expiry: Date.now() + 300000 }
 * );
 * ```
 */
export function createMessageEnvelope(
  type: MessageType,
  payload: string,
  meta: MessageMeta,
  senderSig?: string,
  senderPub?: string
): MessageEnvelope {
  // Validate required fields
  if (!Object.values(MessageType).includes(type)) {
    throw new AirSignError(
      'Invalid message type',
      ErrorCode.INVALID_MESSAGE,
      { type }
    );
  }
  
  if (!payload || typeof payload !== 'string') {
    throw new AirSignError(
      'Missing or invalid payload',
      ErrorCode.MISSING_FIELD
    );
  }
  
  if (!meta || typeof meta !== 'object') {
    throw new AirSignError(
      'Missing or invalid meta object',
      ErrorCode.MISSING_FIELD
    );
  }
  
  if (!meta.expiry || typeof meta.expiry !== 'number' || meta.expiry <= Date.now()) {
    throw new AirSignError(
      'Missing or invalid expiry timestamp',
      ErrorCode.MISSING_FIELD
    );
  }
  
  // Validate optional signature fields
  if (senderSig && !senderPub) {
    throw new AirSignError(
      'sender_pub required when sender_sig is provided',
      ErrorCode.MISSING_FIELD
    );
  }
  
  if (senderSig && !isValidHex(senderSig)) {
    throw new AirSignError(
      'Invalid hex format for sender_sig',
      ErrorCode.INVALID_MESSAGE
    );
  }
  
  if (senderPub && !isValidHex(senderPub)) {
    throw new AirSignError(
      'Invalid hex format for sender_pub',
      ErrorCode.INVALID_MESSAGE
    );
  }
  
  const envelope: MessageEnvelope = {
    type,
    id: uuidv4(),
    payload,
    meta
  };
  
  // Add optional signature fields only if provided
  if (senderSig && senderPub) {
    envelope.sender_sig = senderSig;
    envelope.sender_pub = senderPub;
  }
  
  return envelope;
}

/**
 * Validate a received message envelope
 * 
 * @param envelope - Message envelope to validate
 * @param config - Validation configuration
 * @returns Promise resolving to true if valid
 * @throws {AirSignError} If message is invalid
 * 
 * @example
 * ```typescript
 * await validateMessageEnvelope(receivedMessage);
 * console.log('Message is valid and safe to process');
 * ```
 */
export async function validateMessageEnvelope(
  envelope: MessageEnvelope,
  config: ValidationConfig = DEFAULT_VALIDATION
): Promise<boolean> {
  // Validate structure
  if (!envelope || typeof envelope !== 'object') {
    throw new AirSignError(
      'Invalid message envelope',
      ErrorCode.INVALID_MESSAGE
    );
  }
  
  // Check required fields
  if (!envelope.id || typeof envelope.id !== 'string') {
    throw new AirSignError(
      'Missing or invalid message id',
      ErrorCode.MISSING_FIELD
    );
  }
  
  if (!Object.values(MessageType).includes(envelope.type)) {
    throw new AirSignError(
      'Invalid message type',
      ErrorCode.INVALID_MESSAGE,
      { type: envelope.type }
    );
  }
  
  if (!envelope.payload || typeof envelope.payload !== 'string') {
    throw new AirSignError(
      'Missing or invalid payload',
      ErrorCode.MISSING_FIELD
    );
  }
  
  if (!envelope.meta || typeof envelope.meta !== 'object') {
    throw new AirSignError(
      'Missing or invalid meta object',
      ErrorCode.MISSING_FIELD
    );
  }
  
  // Validate expiry
  if (config.enforceExpiry && envelope.meta.expiry) {
    if (Date.now() > envelope.meta.expiry) {
      throw new AirSignError(
        'Message has expired',
        ErrorCode.EXPIRED_MESSAGE,
        { expiry: envelope.meta.expiry, now: Date.now() }
      );
    }
  }
  
  // Check for replay attacks
  if (config.replayProtection) {
    if (seenMessageIds.has(envelope.id)) {
      throw new AirSignError(
        'Replay attack detected - message ID already seen',
        ErrorCode.REPLAY_DETECTED,
        { id: envelope.id }
      );
    }
    
    // Add to seen messages (with basic cleanup)
    seenMessageIds.add(envelope.id);
    
    // Clean up old messages periodically (basic implementation)
    if (seenMessageIds.size > 10000) {
      const toDelete = Array.from(seenMessageIds).slice(0, 1000);
      toDelete.forEach(id => seenMessageIds.delete(id));
    }
  }
  
  // Validate signature if present
  if (envelope.sender_sig && envelope.sender_pub) {
    const messageHash = await hashMessageEnvelope(envelope);
    
    // Try secp256k1 first, then ed25519
    let signatureValid = false;
    
    try {
      signatureValid = await verifySenderSignature(
        messageHash,
        envelope.sender_sig,
        envelope.sender_pub,
        'secp256k1'
      );
    } catch {
      try {
        signatureValid = await verifySenderSignature(
          messageHash,
          envelope.sender_sig,
          envelope.sender_pub,
          'ed25519'
        );
      } catch {
        // Both schemes failed
      }
    }
    
    if (!signatureValid) {
      throw new AirSignError(
        'Invalid sender signature',
        ErrorCode.INVALID_SIGNATURE,
        { id: envelope.id }
      );
    }
  }
  
  return true;
}

/**
 * Clean up replay protection storage (call periodically)
 */
export function cleanupReplayProtection(): void {
  // Simple cleanup - in production this would be more sophisticated
  if (seenMessageIds.size > 1000) {
    seenMessageIds.clear();
  }
}

/**
 * Get current replay protection statistics
 * 
 * @returns Object with replay protection stats
 */
export function getReplayProtectionStats(): { seenMessages: number } {
  return {
    seenMessages: seenMessageIds.size
  };
}

// Helper functions

function isValidBase64(str: string): boolean {
  try {
    // Handle both standard base64 and URL-safe base64
    let normalized = str;
    // Convert URL-safe base64 to standard base64
    normalized = normalized.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    while (normalized.length % 4) {
      normalized += '=';
    }
    return Buffer.from(normalized, 'base64').toString('base64') === normalized;
  } catch {
    return false;
  }
}

function isValidHex(str: string): boolean {
  return /^[0-9a-fA-F]+$/.test(str) && str.length % 2 === 0;
}