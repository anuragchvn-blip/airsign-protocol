# AirSign Protocol Web Demo Deployment Guide

## 🌐 Current Status
- **Localhost Only**: Currently hardcoded to `localhost:3000` and `ws://localhost:3001`
- **Local Network**: Can be accessed by other devices on your local network with modifications
- **Internet**: Requires additional configuration for global access

## 🚀 Deployment Options

### 1. Local Network Access (LAN)
Access AirSign from phones, tablets, and other computers on your WiFi network.

**Steps:**
```bash
# Find your IP address
ipconfig  # Windows
ifconfig  # Mac/Linux

# Start server (now configured for network access)
npm run local

# Access from any device on your network:
# http://YOUR_IP_ADDRESS:3000
# Example: http://192.168.1.100:3000
```

### 2. Cloud Deployment (Internet Access)
Deploy to cloud platforms for global access.

#### Option A: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Your AirSign demo will be available at:
# https://your-project.vercel.app
```

#### Option B: Railway
```bash
# Connect your GitHub repo to Railway
# Add environment variables:
# HOST=0.0.0.0
# PORT=3000
# WS_PORT=443
```

#### Option C: Heroku
```bash
# Create Procfile
echo "web: npm run prod" > Procfile

# Deploy
git add .
git commit -m "Production deployment"
heroku create your-airsign-demo
git push heroku main
```

### 3. Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000 3001
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t airsign-demo .
docker run -p 3000:3000 -p 3001:3001 airsign-demo
```

## 🔧 Configuration

### Environment Variables
- `HOST`: Server bind address (default: `0.0.0.0`)
- `PORT`: HTTP server port (default: `3000`)
- `WS_PORT`: WebSocket server port (default: `3001`)

### Production Settings
```bash
# For production deployment
export HOST=0.0.0.0
export PORT=80
export WS_PORT=443
npm run prod
```

## 📱 Mobile Device Access

### Prerequisites for Mobile
1. **HTTPS Required**: Most mobile browsers require HTTPS for advanced features
2. **WebSocket Security**: Use WSS (secure WebSocket) for HTTPS sites
3. **CORS Configuration**: May need CORS headers for cross-origin requests

### Enable HTTPS (Production)
```javascript
// Add to server.js for HTTPS
import https from 'https';
import fs from 'fs';

const options = {
  key: fs.readFileSync('path/to/private-key.pem'),
  cert: fs.readFileSync('path/to/certificate.pem')
};

https.createServer(options, app).listen(443);
```

## 🌍 Real-World Deployment Architecture

### Current Architecture (Demo)
```
[Browser Tab 1] ←→ [WebSocket Server] ←→ [Browser Tab 2]
                        ↕
                 [HTTP Static Server]
```

### Production Architecture (Recommended)
```
[Mobile App] ←→ [Load Balancer] ←→ [AirSign Server Cluster]
[Web Browser] ←→ [CDN/HTTPS] ←→ [WebSocket Signaling]
                                        ↕
                                [Redis/Database]
```

## 🚨 Security Considerations

### For Production Use
1. **Rate Limiting**: Prevent spam and DoS attacks
2. **Authentication**: User accounts and device verification  
3. **Message Validation**: Verify all incoming messages
4. **HTTPS/WSS Only**: Encrypt all communications
5. **Content Security Policy**: Prevent XSS attacks

### Current Security Status
- ✅ **End-to-end encryption** of payment requests
- ✅ **Public key cryptography** for device identity
- ⚠️ **No authentication** (anyone can connect)
- ⚠️ **No rate limiting** (open to spam)
- ⚠️ **HTTP only** (not suitable for production)

## 📝 Next Steps for Production

1. **Add HTTPS/WSS support**
2. **Implement user authentication**
3. **Add rate limiting and spam protection**
4. **Create mobile apps** (React Native)
5. **Add real WebRTC** for direct P2P connections
6. **Integrate with wallet apps** for seamless payments

## 💡 Current Capabilities

**What Works Everywhere:**
- ✅ **Crypto key generation** (browser crypto APIs)
- ✅ **Payment URI creation** (EIP-681 standard)
- ✅ **Message encryption/decryption** (Base64 fallback)
- ✅ **Device discovery** (WebSocket signaling)

**What Needs Internet Deployment:**
- 🌐 **Cross-network device discovery**
- 📱 **Mobile device access**
- 🔒 **HTTPS security requirements**
- ⚡ **Real-time WebRTC connections**