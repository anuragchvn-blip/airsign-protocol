/**
 * REAL Example: Send Crypto Payment Request (Manual Setup)
 * 
 * This shows what's possible TODAY if you handle the transport yourself
 */

import {
  generateEphemeralKeypair,
  deriveSharedKey,
  encryptString,
  decryptString,
  createMessageEnvelope,
  MessageType
} from '@airsign/sdk-core';

// 🎯 THIS WORKS TODAY - Real crypto payment sharing
async function sendCryptoPaymentRequest() {
  console.log('💰 Crypto Payment Request Demo');
  console.log('===============================\n');

  // Step 1: Both devices generate keys (REAL crypto)
  console.log('📱 Alice (sender) generates keypair...');
  const alice = await generateEphemeralKeypair();
  console.log('📱 Bob (receiver) generates keypair...');
  const bob = await generateEphemeralKeypair();

  // Step 2: Exchange public keys (you handle this part)
  console.log('🔄 Exchanging public keys (via QR, websocket, etc.)...');
  const sharedKey = await deriveSharedKey(alice.privateKey, bob.publicKey);

  // Step 3: Create REAL payment request
  console.log('💳 Creating payment request...');
  const paymentRequest = createMessageEnvelope(
    MessageType.PAYMENT_URI,
    'ethereum:0x742d35cc6aa123456789abcdef67890123456789?value=50000000000000000000', // 50 ETH
    { 
      expiry: Date.now() + 300000,
      description: 'Coffee payment',
      amount: '50 ETH'
    }
  );

  console.log('   ✅ Payment amount: 50 ETH');
  console.log('   ✅ Recipient: 0x742d35cc6aa123456789abcdef67890123456789');
  console.log('   ✅ Expires in: 5 minutes');

  // Step 4: Encrypt with REAL XChaCha20-Poly1305
  console.log('🔐 Encrypting payment request...');
  const encrypted = await encryptString(JSON.stringify(paymentRequest), sharedKey);
  console.log('   ✅ Encrypted length:', encrypted.length, 'characters');

  // Step 5: Send via YOUR transport (websocket, QR, etc.)
  console.log('📡 Sending encrypted payment (via your transport)...');
  // await yourWebSocket.send(encrypted);
  // await yourQRCode.display(encrypted);
  // await yourBluetoothConnection.transmit(encrypted);

  // Step 6: Receiver decrypts and processes
  console.log('📱 Bob receives and decrypts...');
  const decrypted = await decryptString(encrypted, sharedKey);
  const receivedRequest = JSON.parse(decrypted);

  console.log('✅ PAYMENT REQUEST RECEIVED:');
  console.log('   💰 Amount: 50 ETH');
  console.log('   📍 To wallet:', receivedRequest.payload.substring(9, 51));
  console.log('   🕐 Valid until:', new Date(receivedRequest.meta.expiry).toLocaleTimeString());
  console.log('   🔒 Cryptographically verified!');

  console.log('\n🎉 SUCCESS: Secure crypto payment request transmitted!');
  console.log('💡 Bob can now use this URI in any Web3 wallet');
  
  return receivedRequest.payload; // Returns: ethereum:0x742...?value=50000000000000000000
}

// Example: What the receiver would do next
async function processPaymentInWallet(paymentURI) {
  console.log('\n💼 WALLET INTEGRATION EXAMPLE:');
  console.log('================================');
  
  // Parse the payment URI (this part is standard)
  const url = new URL(paymentURI);
  const recipient = url.pathname;
  const amount = url.searchParams.get('value');
  
  console.log('📱 Wallet receives secure payment request:');
  console.log('   👤 Send to:', recipient);
  console.log('   💰 Amount:', amount, 'wei (50 ETH)');
  console.log('   ✅ User clicks "Approve"');
  
  // NOW the wallet would use web3.js/ethers.js
  console.log('🌐 Wallet uses web3 to execute transaction:');
  console.log('   // import { ethers } from "ethers";');
  console.log('   // const tx = await wallet.sendTransaction({');
  console.log('   //   to: "' + recipient + '",');
  console.log('   //   value: "' + amount + '"');
  console.log('   // });');
  console.log('   ⛽ Gas fee calculated, transaction broadcast to blockchain');
  console.log('   ⏳ Waiting for confirmation...');
  console.log('   ✅ Transaction confirmed on Ethereum!');
}

// Run the demo
sendCryptoPaymentRequest()
  .then(processPaymentInWallet)
  .catch(console.error);