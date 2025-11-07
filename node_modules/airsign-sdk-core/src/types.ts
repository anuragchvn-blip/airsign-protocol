/**
 * AirSign Protocol Core Types
 * 
 * Type definitions for the AirSign Protocol message format,
 * presence packets, and cryptographic operations.
 */

/**
 * Protocol message types supported by AirSign
 */
export enum MessageType {
  PAYMENT_URI = 'payment_uri',
  WALLET_ADDRESS = 'wallet_address', 
  SIGNED_TX = 'signed_tx',
  FILE = 'file'
}

/**
 * Cryptographic signature schemes supported
 */
export type SignatureScheme = 'secp256k1' | 'ed25519';

/**
 * Presence packet broadcast by devices for discovery
 */
export interface PresencePacket {
  /** Protocol version identifier */
  proto: 'airsign-v1';
  /** Base64-encoded ephemeral public key (X25519) */
  ephemeral_pub: string;
  /** Human-readable device name */
  name: string;
  /** Supported capabilities */
  capabilities: string[];
  /** Unix timestamp when packet was created */
  timestamp: number;
  /** Optional transport method */
  transport?: string;
}

/**
 * Ephemeral keypair for X25519 ECDH
 */
export interface EphemeralKeyPair {
  /** Private key (keep secret) */
  privateKey: Uint8Array;
  /** Base64-encoded public key (share with peers) */
  publicKey: string;
}

/**
 * Metadata attached to messages
 */
export interface MessageMeta {
  /** Unix timestamp when message expires */
  expiry: number;
  /** Optional blockchain chain ID */
  chainId?: number;
  /** Optional nonce hint for replay protection */
  nonceHint?: number;
  /** Optional file metadata */
  fileSize?: number;
  fileName?: string;
  mimeType?: string;
}

/**
 * Message envelope format for encrypted communication
 */
export interface MessageEnvelope {
  /** Message type */
  type: MessageType;
  /** Unique message identifier (UUIDv4) */
  id: string;
  /** Message payload (varies by type) */
  payload: string;
  /** Message metadata */
  meta: MessageMeta;
  /** Optional sender signature (hex-encoded) */
  sender_sig?: string;
  /** Optional sender public key for verification (hex-encoded) */
  sender_pub?: string;
}

/**
 * Encrypted message container for transport
 */
export interface EncryptedMessage {
  /** Base64-encoded ciphertext */
  ciphertext: string;
  /** Base64-encoded nonce */
  nonce: string;
}

/**
 * Custom error class for AirSign protocol errors
 */
export class AirSignError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AirSignError';
  }
}

/**
 * Error codes for different failure scenarios
 */
export enum ErrorCode {
  INVALID_PRESENCE = 'INVALID_PRESENCE',
  INVALID_MESSAGE = 'INVALID_MESSAGE',
  CRYPTO_ERROR = 'CRYPTO_ERROR',
  EXPIRED_MESSAGE = 'EXPIRED_MESSAGE',
  REPLAY_DETECTED = 'REPLAY_DETECTED',
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',
  MISSING_FIELD = 'MISSING_FIELD'
}

/**
 * Configuration for message validation
 */
export interface ValidationConfig {
  /** Maximum message age in milliseconds */
  maxMessageAge?: number;
  /** Whether to enforce expiry validation */
  enforceExpiry?: boolean;
  /** Whether to track message IDs for replay protection */
  replayProtection?: boolean;
}