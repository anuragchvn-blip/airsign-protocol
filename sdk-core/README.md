# @airsign/sdk-core

**Core SDK for AirSign Protocol** - Secure nearby crypto & data exchange

[![NPM Version](https://img.shields.io/npm/v/@airsign/sdk-core)](https://www.npmjs.com/package/@airsign/sdk-core)
[![Tests](https://img.shields.io/badge/tests-19/19%20passing-brightgreen)](#testing)
[![License](https://img.shields.io/badge/license-MIT-blue)](../LICENSE)

## Overview

The AirSign SDK Core provides production-ready cryptographic functions and protocol implementation for secure peer-to-peer communication and crypto payment exchange between nearby devices.

## Features

- 🔐 **Production Cryptography**: X25519 ECDH + XChaCha20-Poly1305 AEAD
- 🌐 **Multiple Transports**: WebSocket relay + WebRTC P2P 
- 💰 **Payment URIs**: Bitcoin, Ethereum, Solana, USDC support
- 📱 **Cross-Platform**: Browser, Node.js, React Native ready
- 🛡️ **Zero-Trust**: End-to-end encryption with forward secrecy
- ⚡ **High Performance**: <50ms crypto operations

## Installation

```bash
npm install @airsign/sdk-core
```

## Quick Start

```typescript
import { AirSignSDK } from '@airsign/sdk-core';

// Initialize SDK
const sdk = new AirSignSDK();
await sdk.init();

// Start device discovery
await sdk.startDiscovery({
  deviceName: 'My Device',
  capabilities: ['payment-uri', 'nft-transfer']
});

// Listen for discovered peers
sdk.on('peer-discovered', (peer) => {
  console.log('Found device:', peer.deviceName);
});

// Send encrypted payment request
await sdk.sendPayment(
  'ethereum:0x742d35Cc6634C0532925a3b8D2f8c8e2Bf4e7a4a?value=1000000000000000000',
  peerId
);

// Handle received payments
sdk.on('payment-received', (payment) => {
  console.log('Payment request:', payment.uri);
  // Open wallet app with payment URI
});
```

## Testing

**Test Results: 19/19 passing** ✅

```bash
npm test
```

## License

MIT License - see [LICENSE](../LICENSE) for details.

## Support

- 📧 **Email**: support@airsign.dev
- 🐛 **Issues**: [GitHub Issues](https://github.com/anuragchvn-blip/airsign-protocol/issues)
- 📖 **Docs**: [Documentation](https://github.com/anuragchvn-blip/airsign-protocol#readme)

---

**Made with Real Crypto™** - Production-ready cryptography, no simulations.