/**
 * AirSign Web Demo Server
 * 
 * Simple demo server that shows WebRTC peer discovery and crypto payment exchange
 * This demonstrates what normal users will experience!
 */

import express from 'express';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const WS_PORT = process.env.WS_PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0'; // Bind to all interfaces for production

// Serve static files
app.use(express.static(join(__dirname, 'public')));

// Simple signaling server for WebRTC
const wss = new WebSocketServer({ 
  port: WS_PORT,
  host: HOST
});
const clients = new Map();

wss.on('connection', (ws) => {
  const clientId = Date.now().toString();
  clients.set(clientId, { ws, id: clientId, name: 'Unknown Device' });
  
  console.log(`📱 Client connected: ${clientId}`);
  
  // Send client their ID
  ws.send(JSON.stringify({
    type: 'connected',
    clientId: clientId
  }));

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      handleMessage(clientId, message);
    } catch (error) {
      console.error('Invalid message:', error);
    }
  });

  ws.on('close', () => {
    console.log(`📱 Client disconnected: ${clientId}`);
    clients.delete(clientId);
    broadcastPeerList();
  });
});

function handleMessage(fromId, message) {
  const client = clients.get(fromId);
  console.log(`📥 Received message from ${fromId}:`, message.type, message);
  
  switch (message.type) {
    case 'announce':
    case 'presence': // Handle both announce and presence types
      client.name = message.name || message.deviceName;
      client.deviceName = message.deviceName || message.name;
      client.capabilities = message.capabilities;
      client.publicKey = message.publicKey;
      client.signature = message.signature;
      console.log(`📢 ${client.deviceName || client.name} announced presence ${client.publicKey ? '(with crypto)' : '(legacy)'}`);
      broadcastPeerList();
      break;
      
    case 'discover':
      console.log(`🔍 ${fromId} requesting peer list`);
      sendPeerList(client);
      break;
      
    case 'offer':
    case 'answer':
    case 'ice-candidate':
    case 'encrypted-payment': // Add support for encrypted payment relay
      relayMessage(fromId, message);
      break;
      
    default:
      console.log(`❓ Unknown message type: ${message.type}`);
  }
}

function relayMessage(fromId, message) {
  const toClient = clients.get(message.to);
  if (toClient) {
    console.log(`📨 Relaying ${message.type} from ${fromId} to ${message.to}`);
    toClient.ws.send(JSON.stringify({
      ...message,
      from: fromId
    }));
  } else {
    console.log(`❌ Cannot relay ${message.type}: recipient ${message.to} not found`);
  }
}

function broadcastPeerList() {
  const peerList = Array.from(clients.values()).map(client => ({
    id: client.id,
    name: client.name || 'Unknown Device',
    deviceName: client.deviceName || client.name,
    capabilities: client.capabilities || [],
    publicKey: client.publicKey || null
  }));

  clients.forEach((client) => {
    client.ws.send(JSON.stringify({
      type: 'peer-list',
      peers: peerList.filter(p => p.id !== client.id)
    }));
  });
}

function sendPeerList(client) {
  const peerList = Array.from(clients.values())
    .filter(c => c.id !== client.id)
    .map(c => ({
      id: c.id,
      name: c.name || 'Unknown Device',
      deviceName: c.deviceName || c.name,
      capabilities: c.capabilities || [],
      publicKey: c.publicKey || null
    }));

  client.ws.send(JSON.stringify({
    type: 'peer-list',
    peers: peerList
  }));
}

// Start HTTP server
app.listen(PORT, HOST, () => {
  const actualHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
  console.log(`🚀 AirSign Web Demo Server running on:`);
  console.log(`   📍 Local:    http://localhost:${PORT}`);
  console.log(`   📍 Network:  http://192.168.1.5:${PORT}`);  // Your actual IP
  console.log(`📱 WebSocket signaling server on ws://localhost:${WS_PORT}`);
  console.log(`\n💡 Open multiple browser tabs to see device discovery in action!`);
  console.log(`🌐 Access from phones/tablets using: http://192.168.1.5:${PORT}`);
});