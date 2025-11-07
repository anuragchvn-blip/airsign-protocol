/**
 * Simple AirSign Protocol Core Tests
 * 
 * Basic tests for core functionality
 */

describe('AirSign Protocol Core', () => {
  // Test basic imports
  it('should import without errors', async () => {
    const crypto = await import('../crypto.js');
    const protocol = await import('../protocol.js');
    const types = await import('../types.js');
    
    expect(crypto.generateEphemeralKeypair).toBeDefined();
    expect(protocol.parsePresence).toBeDefined();
    expect(types.MessageType).toBeDefined();
  });

  // Test basic crypto without noble libraries
  it('should generate keypairs', async () => {
    const crypto = await import('../crypto.js');
    
    const alice = await crypto.generateEphemeralKeypair();
    const bob = await crypto.generateEphemeralKeypair();
    
    expect(alice.publicKey).toBeDefined();
    expect(alice.privateKey).toBeDefined();
    expect(bob.publicKey).toBeDefined();
    expect(bob.privateKey).toBeDefined();
    
    // Keys should be different
    expect(alice.publicKey).not.toBe(bob.publicKey);
  });

  it('should derive shared keys', async () => {
    const crypto = await import('../crypto.js');
    
    const alice = await crypto.generateEphemeralKeypair();
    const bob = await crypto.generateEphemeralKeypair();
    
    const aliceShared = await crypto.deriveSharedKey(alice.privateKey, bob.publicKey);
    const bobShared = await crypto.deriveSharedKey(bob.privateKey, alice.publicKey);
    
    expect(aliceShared).toEqual(bobShared);
  });

  it('should encrypt and decrypt strings', async () => {
    const crypto = await import('../crypto.js');
    
    const alice = await crypto.generateEphemeralKeypair();
    const bob = await crypto.generateEphemeralKeypair();
    
    const sharedKey = await crypto.deriveSharedKey(alice.privateKey, bob.publicKey);
    const message = 'Hello, Web3!';
    
    const encrypted = await crypto.encryptString(message, sharedKey);
    const decrypted = await crypto.decryptString(encrypted, sharedKey);
    
    expect(decrypted).toBe(message);
  });

  it('should create message envelopes', async () => {
    const protocol = await import('../protocol.js');
    const types = await import('../types.js');
    
    const envelope = protocol.createMessageEnvelope(
      types.MessageType.PAYMENT_URI,
      'ethereum:0x742d35cc6aa123456789abcdef67890123456789?value=1000000000000000000',
      { expiry: Date.now() + 300000 }
    );
    
    expect(envelope.type).toBe(types.MessageType.PAYMENT_URI);
    expect(envelope.id).toBeDefined();
    expect(envelope.payload).toContain('ethereum:');
    expect(envelope.meta.expiry).toBeGreaterThan(Date.now());
  });

  it('should validate message envelopes', async () => {
    const protocol = await import('../protocol.js');
    const types = await import('../types.js');
    
    const envelope = protocol.createMessageEnvelope(
      types.MessageType.PAYMENT_URI,
      'ethereum:0x742d35cc6aa123456789abcdef67890123456789?value=1000000000000000000',
      { expiry: Date.now() + 300000 }
    );
    
    const isValid = await protocol.validateMessageEnvelope(envelope);
    expect(isValid).toBe(true);
  });

  it('should parse presence packets', async () => {
    const protocol = await import('../protocol.js');
    
    const presencePacket = {
      proto: 'airsign-v1',
      ephemeral_pub: 'SGVsbG8gV29ybGQ=', // base64 "Hello World"
      name: 'Alice iPhone',
      capabilities: ['payment-uri', 'nft-transfer'],
      timestamp: Date.now()
    };
    
    const packetJson = JSON.stringify(presencePacket);
    const parsed = protocol.parsePresence(packetJson);
    
    expect(parsed.name).toBe('Alice iPhone');
    expect(parsed.capabilities).toContain('payment-uri');
    expect(parsed.proto).toBe('airsign-v1');
  });

  it('should complete end-to-end message exchange', async () => {
    const crypto = await import('../crypto.js');
    const protocol = await import('../protocol.js');
    const types = await import('../types.js');
    
    // Generate ephemeral keypairs for Alice and Bob
    const alice = await crypto.generateEphemeralKeypair();
    const bob = await crypto.generateEphemeralKeypair();
    
    // Create Alice's presence packet
    const alicePresence = {
      proto: 'airsign-v1',
      ephemeral_pub: alice.publicKey,
      name: 'Alice iPhone',
      capabilities: ['payment-uri', 'nft-transfer'],
      timestamp: Date.now()
    };
    
    // Bob receives and parses Alice's presence
    const parsedPresence = protocol.parsePresence(JSON.stringify(alicePresence));
    expect(parsedPresence.name).toBe('Alice iPhone');
    
    // Bob derives shared key using Alice's public key
    const sharedKey = await crypto.deriveSharedKey(bob.privateKey, parsedPresence.ephemeral_pub);
    
    // Alice creates a payment URI message
    const paymentUri = 'ethereum:0x742d35cc6aa123456789abcdef67890123456789?value=1000000000000000000&data=0x1234';
    const envelope = protocol.createMessageEnvelope(
      types.MessageType.PAYMENT_URI,
      paymentUri,
      { expiry: Date.now() + 300000 }
    );
    
    // Validate the envelope
    await protocol.validateMessageEnvelope(envelope);
    
    // Alice encrypts the envelope for Bob
    const encryptedMessage = await crypto.encryptString(JSON.stringify(envelope), sharedKey);
    
    // Bob receives and decrypts the message
    const decryptedMessage = await crypto.decryptString(encryptedMessage, sharedKey);
    const receivedEnvelope = JSON.parse(decryptedMessage);
    
    // Verify the received message
    expect(receivedEnvelope.type).toBe(types.MessageType.PAYMENT_URI);
    expect(receivedEnvelope.payload).toBe(paymentUri);
    expect(receivedEnvelope.payload).toContain('0x742d35cc6aa123456789abcdef67890123456789');
    expect(receivedEnvelope.payload).toContain('value=1000000000000000000');
  });
});