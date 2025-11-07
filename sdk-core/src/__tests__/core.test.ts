/**
 * AirSign Protocol Core Tests
 * 
 * Tests for cryptographic operations and message handling
 */

import { 
  generateEphemeralKeypair,
  deriveSharedKey,
  encryptString,
  decryptString,
  createMessageEnvelope,
  validateMessageEnvelope,
  parsePresence,
  MessageType,
  type PresencePacket
} from '../index.js';

describe('AirSign Protocol Core', () => {
  describe('ECDH Key Exchange', () => {
    it('should generate valid ephemeral keypairs', async () => {
      const alice = await generateEphemeralKeypair();
      const bob = await generateEphemeralKeypair();
      
      expect(alice.publicKey).toBeDefined();
      expect(alice.privateKey).toBeDefined();
      expect(bob.publicKey).toBeDefined();
      expect(bob.privateKey).toBeDefined();
      
      // Public keys should be base64 strings
      expect(typeof alice.publicKey).toBe('string');
      expect(typeof bob.publicKey).toBe('string');
      
      // Keys should be different
      expect(alice.publicKey).not.toBe(bob.publicKey);
    });

    it('should derive the same shared secret for both parties', async () => {
      const alice = await generateEphemeralKeypair();
      const bob = await generateEphemeralKeypair();
      
      const aliceShared = await deriveSharedKey(alice.privateKey, bob.publicKey);
      const bobShared = await deriveSharedKey(bob.privateKey, alice.publicKey);
      
      expect(aliceShared).toEqual(bobShared);
    });
  });

  describe('AEAD Encryption', () => {
    it('should encrypt and decrypt messages correctly', async () => {
      const alice = await generateEphemeralKeypair();
      const bob = await generateEphemeralKeypair();
      
      const sharedKey = await deriveSharedKey(alice.privateKey, bob.publicKey);
      const message = 'Hello, Web3!';
      
      const encrypted = await encryptString(message, sharedKey);
      const decrypted = await decryptString(encrypted, sharedKey);
      
      expect(decrypted).toBe(message);
    });

    it('should fail decryption with wrong key', async () => {
      const alice = await generateEphemeralKeypair();
      const bob = await generateEphemeralKeypair();
      const charlie = await generateEphemeralKeypair();
      
      const aliceShared = await deriveSharedKey(alice.privateKey, bob.publicKey);
      const charlieShared = await deriveSharedKey(charlie.privateKey, bob.publicKey);
      
      const message = 'Secret message';
      const encrypted = await encryptString(message, aliceShared);
      
      await expect(decryptString(encrypted, charlieShared)).rejects.toThrow();
    });
  });

  describe('Message Envelopes', () => {
    it('should create valid message envelopes', () => {
      const envelope = createMessageEnvelope(
        MessageType.PAYMENT_URI,
        'ethereum:0x742d35cc6aa123456789abcdef67890123456789?value=1000000000000000000',
        { expiry: Date.now() + 300000 }
      );
      
      expect(envelope.type).toBe(MessageType.PAYMENT_URI);
      expect(envelope.id).toBeDefined();
      expect(envelope.payload).toContain('ethereum:');
      expect(envelope.meta.expiry).toBeGreaterThan(Date.now());
    });

    it('should validate message envelopes', async () => {
      const envelope = createMessageEnvelope(
        MessageType.PAYMENT_URI,
        'ethereum:0x742d35cc6aa123456789abcdef67890123456789?value=1000000000000000000',
        { expiry: Date.now() + 300000 }
      );
      
      const isValid = await validateMessageEnvelope(envelope);
      expect(isValid).toBe(true);
    });

    it('should reject expired messages', async () => {
      // Create a valid envelope first
      const envelope = createMessageEnvelope(
        MessageType.PAYMENT_URI,
        'ethereum:0x742d35cc6aa123456789abcdef67890123456789?value=1000000000000000000',
        { expiry: Date.now() + 300000 } // Valid expiry
      );
      
      // Manually set expiry to past for testing validation
      envelope.meta.expiry = Date.now() - 1000; // Expired 1 second ago
      
      await expect(validateMessageEnvelope(envelope)).rejects.toThrow('expired');
    });
  });

  describe('Presence Packets', () => {
    it('should parse valid presence packets', () => {
      const presencePacket: PresencePacket = {
        proto: 'airsign-v1',
        ephemeral_pub: 'SGVsbG8gV29ybGQ=', // base64 "Hello World"
        name: 'Alice iPhone',
        capabilities: ['payment-uri', 'nft-transfer'],
        timestamp: Date.now()
      };
      
      const packetJson = JSON.stringify(presencePacket);
      const parsed = parsePresence(packetJson);
      
      expect(parsed.name).toBe('Alice iPhone');
      expect(parsed.capabilities).toContain('payment-uri');
      expect(parsed.proto).toBe('airsign-v1');
    });

    it('should reject invalid presence packets', () => {
      const invalidPacket = {
        proto: 'wrong-version',
        ephemeral_pub: 'SGVsbG8gV29ybGQ=',
        name: 'Alice iPhone',
        capabilities: ['payment-uri'],
        timestamp: Date.now()
      };
      
      const packetJson = JSON.stringify(invalidPacket);
      
      expect(() => parsePresence(packetJson)).toThrow();
    });

    it('should reject old presence packets', () => {
      const oldPacket: PresencePacket = {
        proto: 'airsign-v1',
        ephemeral_pub: 'SGVsbG8gV29ybGQ=',
        name: 'Alice iPhone',
        capabilities: ['payment-uri'],
        timestamp: Date.now() - (2 * 60 * 60 * 1000) // 2 hours ago
      };
      
      const packetJson = JSON.stringify(oldPacket);
      
      expect(() => parsePresence(packetJson)).toThrow('too old');
    });
  });

  describe('End-to-End Message Flow', () => {
    it('should complete full encrypted message exchange', async () => {
      // Generate ephemeral keypairs for Alice and Bob
      const alice = await generateEphemeralKeypair();
      const bob = await generateEphemeralKeypair();
      
      // Create Alice's presence packet
      const alicePresence: PresencePacket = {
        proto: 'airsign-v1',
        ephemeral_pub: alice.publicKey,
        name: 'Alice iPhone',
        capabilities: ['payment-uri', 'nft-transfer'],
        timestamp: Date.now()
      };
      
      // Bob receives and parses Alice's presence
      const parsedPresence = parsePresence(JSON.stringify(alicePresence));
      expect(parsedPresence.name).toBe('Alice iPhone');
      
      // Bob derives shared key using Alice's public key
      const sharedKey = await deriveSharedKey(bob.privateKey, parsedPresence.ephemeral_pub);
      
      // Alice creates a payment URI message
      const paymentUri = 'ethereum:0x742d35cc6aa123456789abcdef67890123456789?value=1000000000000000000&data=0x1234';
      const envelope = createMessageEnvelope(
        MessageType.PAYMENT_URI,
        paymentUri,
        { expiry: Date.now() + 300000 }
      );
      
      // Validate the envelope
      await validateMessageEnvelope(envelope);
      
      // Alice encrypts the envelope for Bob
      const encryptedMessage = await encryptString(JSON.stringify(envelope), sharedKey);
      
      // Bob receives and decrypts the message
      const decryptedMessage = await decryptString(encryptedMessage, sharedKey);
      const receivedEnvelope = JSON.parse(decryptedMessage);
      
      // Verify the received message
      expect(receivedEnvelope.type).toBe(MessageType.PAYMENT_URI);
      expect(receivedEnvelope.payload).toBe(paymentUri);
      expect(receivedEnvelope.payload).toContain('0x742d35cc6aa123456789abcdef67890123456789');
      expect(receivedEnvelope.payload).toContain('value=1000000000000000000');
    });
  });
});