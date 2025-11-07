/**
 * AirSign Protocol SDK Core
 * 
 * Production-ready TypeScript implementation of the AirSign Protocol
 * for secure peer-to-peer Web3 asset transfers.
 */

// Core types
export * from './types.js';

// Cryptographic operations
export {
  generateEphemeralKeypair,
  deriveSharedKey,
  encryptMessage,
  decryptMessage,
  encryptString,
  decryptString,
  hashMessageEnvelope,
  verifySenderSignature
} from './crypto.js';

// Protocol message handling
export {
  parsePresence,
  createMessageEnvelope,
  validateMessageEnvelope,
  cleanupReplayProtection,
  getReplayProtectionStats
} from './protocol.js';

// Version and metadata
export const VERSION = '1.0.0';
export const PROTOCOL_VERSION = 'airsign-v1';