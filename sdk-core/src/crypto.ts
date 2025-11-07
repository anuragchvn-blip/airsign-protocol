/**
 * Cryptographic operations for AirSign Protocol
 * 
 * Provides X25519 ECDH key exchange, XChaCha20-Poly1305 AEAD encryption,
 * and signature verification using libsodium and noble-crypto libraries.
 */

import sodium from 'libsodium-wrappers';
// import * as secp256k1 from '@noble/secp256k1';
// import * as ed25519 from '@noble/ed25519';
import { AirSignError, ErrorCode, type EphemeralKeyPair, type SignatureScheme } from './types.js';

// Ensure libsodium is initialized
let sodiumReady = false;

/**
 * Initialize the cryptographic library (libsodium)
 * Must be called before using any crypto functions
 */
async function ensureSodiumReady(): Promise<void> {
  if (!sodiumReady) {
    await sodium.ready;
    sodiumReady = true;
  }
}

/**
 * Generate an ephemeral X25519 keypair for ECDH key exchange
 * 
 * @returns Promise resolving to a new ephemeral keypair
 * @throws {AirSignError} If key generation fails
 */
export async function generateEphemeralKeypair(): Promise<EphemeralKeyPair> {
  try {
    await ensureSodiumReady();
    
    const keypair = sodium.crypto_box_keypair();
    
    return {
      privateKey: keypair.privateKey,
      publicKey: sodium.to_base64(keypair.publicKey)
    };
  } catch (error) {
    throw new AirSignError(
      'Failed to generate ephemeral keypair',
      ErrorCode.CRYPTO_ERROR,
      { error }
    );
  }
}

/**
 * Derive shared secret using X25519 ECDH
 * 
 * @param ourPrivateKey - Our private key (Uint8Array)
 * @param theirPublicKey - Their public key (base64 string)
 * @returns Promise resolving to shared secret key
 * @throws {AirSignError} If key derivation fails
 */
export async function deriveSharedKey(
  ourPrivateKey: Uint8Array,
  theirPublicKey: string
): Promise<Uint8Array> {
  try {
    await ensureSodiumReady();
    
    if (ourPrivateKey.length !== 32) {
      throw new Error('Private key must be 32 bytes');
    }
    
    // Convert base64 public key to Uint8Array
    const theirPublicKeyBytes = sodium.from_base64(theirPublicKey);
    
    if (theirPublicKeyBytes.length !== 32) {
      throw new Error('Public key must be 32 bytes');
    }
    
    // Perform X25519 ECDH and derive key using HKDF
    const sharedSecret = sodium.crypto_scalarmult(ourPrivateKey, theirPublicKeyBytes);
    
    // Use HKDF to derive a proper symmetric key
    const derivedKey = sodium.crypto_kdf_derive_from_key(
      32, // 32 byte key
      1,  // subkey id
      'airsign1', // context (8 bytes)
      sharedSecret
    );
    
    return derivedKey;
  } catch (error) {
    throw new AirSignError(
      'Failed to derive shared key',
      ErrorCode.CRYPTO_ERROR,
      { error }
    );
  }
}

/**
 * Encrypt a message using XChaCha20-Poly1305 AEAD
 * 
 * @param key - 32-byte encryption key
 * @param plaintext - Object to encrypt
 * @returns Promise resolving to encrypted message with nonce
 * @throws {AirSignError} If encryption fails
 */
export async function encryptMessage(
  key: Uint8Array,
  plaintext: object
): Promise<{ ciphertext: string; nonce: string }> {
  try {
    await ensureSodiumReady();
    
    if (key.length !== 32) {
      throw new Error('Encryption key must be 32 bytes');
    }
    
    const plaintextBytes = new TextEncoder().encode(JSON.stringify(plaintext));
    const nonce = sodium.randombytes_buf(24); // XChaCha20 uses 24-byte nonces
    
    const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
      plaintextBytes,
      null, // No additional data
      null, // Secret nonce (not used)
      nonce,
      key
    );
    
    return {
      ciphertext: sodium.to_base64(ciphertext),
      nonce: sodium.to_base64(nonce)
    };
  } catch (error) {
    throw new AirSignError(
      'Failed to encrypt message',
      ErrorCode.CRYPTO_ERROR,
      { error }
    );
  }
}

/**
 * Decrypt a message using XChaCha20-Poly1305 AEAD
 * 
 * @param key - 32-byte decryption key
 * @param ciphertext - Base64 encoded ciphertext
 * @param nonce - Base64 encoded nonce
 * @returns Promise resolving to decrypted object
 * @throws {AirSignError} If decryption fails
 */
export async function decryptMessage(
  key: Uint8Array,
  ciphertext: string,
  nonce: string
): Promise<object> {
  try {
    await ensureSodiumReady();
    
    if (key.length !== 32) {
      throw new Error('Decryption key must be 32 bytes');
    }
    
    const ciphertextBytes = sodium.from_base64(ciphertext);
    const nonceBytes = sodium.from_base64(nonce);
    
    const plaintextBytes = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
      null, // Secret nonce (not used)
      ciphertextBytes,
      null, // No additional data
      nonceBytes,
      key
    );
    
    const plaintextString = new TextDecoder().decode(plaintextBytes);
    return JSON.parse(plaintextString);
  } catch (error) {
    throw new AirSignError(
      'Failed to decrypt message',
      ErrorCode.CRYPTO_ERROR,
      { error }
    );
  }
}

/**
 * Simple string encryption for testing and demos
 * 
 * @param message - Plain text message to encrypt
 * @param key - 32-byte encryption key
 * @returns Base64 encoded encrypted message with embedded nonce
 */
export async function encryptString(message: string, key: Uint8Array): Promise<string> {
  const result = await encryptMessage(key, { data: message });
  return `${result.nonce}:${result.ciphertext}`;
}

/**
 * Simple string decryption for testing and demos
 * 
 * @param encryptedMessage - Base64 encoded encrypted message with embedded nonce
 * @param key - 32-byte decryption key
 * @returns Decrypted plain text message
 */
export async function decryptString(encryptedMessage: string, key: Uint8Array): Promise<string> {
  const [nonce, ciphertext] = encryptedMessage.split(':');
  if (!nonce || !ciphertext) {
    throw new AirSignError('Invalid encrypted message format', ErrorCode.CRYPTO_ERROR);
  }
  const result = await decryptMessage(key, ciphertext, nonce) as { data: string };
  return result.data;
}

/**
 * Hash a message envelope for signature verification
 * 
 * @param envelope - Message envelope to hash
 * @returns Promise resolving to SHA-256 hash
 */
export async function hashMessageEnvelope(envelope: {
  type: string;
  id: string;
  payload: string;
  meta: object;
}): Promise<Uint8Array> {
  try {
    await ensureSodiumReady();
    
    // Create deterministic string representation
    const canonical = JSON.stringify({
      type: envelope.type,
      id: envelope.id,
      payload: envelope.payload,
      meta: envelope.meta
    });
    
    const messageBytes = new TextEncoder().encode(canonical);
    return sodium.crypto_hash(messageBytes);
  } catch (error) {
    throw new AirSignError(
      'Failed to hash message envelope',
      ErrorCode.CRYPTO_ERROR,
      { error }
    );
  }
}

/**
 * Verify a sender signature on a message
 * 
 * @param messageHash - Hash of the message to verify
 * @param signatureHex - Hex-encoded signature
 * @param publicKeyHex - Hex-encoded public key
 * @param scheme - Signature scheme ('secp256k1' or 'ed25519')
 * @returns Promise resolving to true if signature is valid
 * @throws {AirSignError} If verification fails
 */
export async function verifySenderSignature(
  _messageHash: Uint8Array,
  _signatureHex: string,
  _publicKeyHex: string,
  scheme: SignatureScheme
): Promise<boolean> {
  // TODO: Implement signature verification with @noble/secp256k1 and @noble/ed25519
  // For now, return false as verification is not implemented
  // eslint-disable-next-line no-console
  console.warn(`Signature verification not implemented for ${scheme}`);
  return false;
  
  /*
  try {
    const signature = hexToBytes(signatureHex);
    const publicKey = hexToBytes(publicKeyHex);
    
    if (scheme === 'secp256k1') {
      return secp256k1.verify(signature, messageHash, publicKey);
    } else if (scheme === 'ed25519') {
      return ed25519.verify(signature, messageHash, publicKey);
    } else {
      throw new Error(`Unsupported signature scheme: ${scheme}`);
    }
  } catch (error) {
    throw new AirSignError(
      'Failed to verify signature',
      ErrorCode.INVALID_SIGNATURE,
      { error, scheme }
    );
  }
  */
}

/**
 * Securely clear sensitive data from memory
 * 
 * @param data - Sensitive data to clear
 */
export function secureClear(data: Uint8Array): void {
  try {
    sodium.memzero(data);
  } catch {
    // Fallback: overwrite with random data
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.floor(Math.random() * 256);
    }
  }
}

// Helper functions

/*
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}
*/

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}