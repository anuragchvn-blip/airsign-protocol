# 🚀 AirSign Protocol - Production Deployment Guide

This guide covers deploying the AirSign Protocol in production environments.

## 📋 Overview

AirSign Protocol consists of:
- **sdk-core**: Production crypto library (19 tests passing)
- **web-demo**: WebSocket signaling server + demo interface
- **airsign-embed.js**: Embeddable widget for third-party integration

## 🛠️ Prerequisites

- Node.js 18+ 
- npm 8+
- SSL certificate (for HTTPS/WSS)
- Domain name (recommended)

## 🎯 Quick Production Setup

### 1. Server Deployment

```bash
# Clone and setup
git clone https://github.com/anuragchvn-blip/airsign-protocol.git
cd airsign-protocol

# Install dependencies  
cd sdk-core && npm install && npm run build
cd ../web-demo && npm install --production

# Start production server
NODE_ENV=production node server.js
```

### 2. Process Management (PM2)

```bash
# Install PM2
npm install -g pm2

# Start with PM2
cd web-demo
pm2 start server.js --name airsign-protocol

# Configure auto-restart
pm2 startup
pm2 save
```

### 3. SSL/HTTPS Setup (Nginx)

```nginx
# /etc/nginx/sites-available/airsign
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/private.key;
    
    # Web interface
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket signaling
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🐳 Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy sdk-core
COPY sdk-core/package*.json ./sdk-core/
RUN cd sdk-core && npm install --production
COPY sdk-core/ ./sdk-core/
RUN cd sdk-core && npm run build

# Copy web-demo
COPY web-demo/package*.json ./web-demo/
RUN cd web-demo && npm install --production
COPY web-demo/ ./web-demo/

EXPOSE 3000 3001

CMD ["node", "web-demo/server.js"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  airsign:
    build: .
    ports:
      - "3000:3000"
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - HOST=0.0.0.0
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - airsign
    restart: unless-stopped
```

## ☁️ Cloud Deployment

### AWS (EC2 + ALB)

```bash
# 1. Launch EC2 instance (Ubuntu 22.04)
# 2. Install Node.js and dependencies
sudo apt update
sudo apt install -y nodejs npm nginx certbot

# 3. Deploy application
git clone https://github.com/your-username/airsign-protocol.git
cd airsign-protocol
# Follow setup steps above

# 4. Configure Application Load Balancer
# - Target Group: HTTP 3000
# - Health Check: /
# - WebSocket: HTTP 3001 with sticky sessions
```

### DigitalOcean App Platform

```yaml
# .do/app.yaml
name: airsign-protocol
services:
- name: web
  source_dir: /web-demo
  github:
    repo: your-username/airsign-protocol
    branch: main
  run_command: node server.js
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  http_port: 3000
  routes:
  - path: /
  health_check:
    http_path: /
  envs:
  - key: NODE_ENV
    value: "production"
```

## 🔧 Environment Configuration

### Environment Variables

```bash
# Production settings
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
WS_PORT=3001

# Security
CORS_ORIGIN=https://your-domain.com
SSL_CERT=/path/to/cert.pem
SSL_KEY=/path/to/private.key

# Monitoring
LOG_LEVEL=info
HEALTH_CHECK_PORT=9000
```

## 📊 Monitoring & Security

### Health Checks

```javascript
// Add to server.js
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

## 🚀 CDN & Performance

### Static Asset CDN

```html
<!-- Production CDN URLs -->
<script src="https://cdn.your-domain.com/airsign-embed.js"></script>
<script src="https://cdn.your-domain.com/airsign-browser.js"></script>
```

## ✅ Production Checklist

- [ ] SSL/TLS certificates configured
- [ ] Firewall rules configured (ports 80, 443, 3001)
- [ ] Process manager (PM2) configured with auto-restart
- [ ] Health check endpoints working
- [ ] Monitoring and logging configured
- [ ] CORS properly configured for production domain
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Static assets served with proper cache headers

## 🔍 Troubleshooting

### Common Issues

1. **WebSocket Connection Fails**
   - Check firewall rules for port 3001
   - Verify SSL certificate for WSS
   - Ensure proxy pass WebSocket upgrade headers

2. **CORS Errors**
   - Set proper CORS_ORIGIN environment variable
   - Check protocol (HTTP vs HTTPS) matching

### Debug Commands

```bash
# Check port binding
netstat -tlnp | grep :3000
netstat -tlnp | grep :3001

# Test WebSocket connection
wscat -c ws://localhost:3001

# Monitor system resources
htop
```

## 📞 Support

For deployment issues:
- 📧 Email: support@airsign.dev
- 💬 Discord: [AirSign Community](https://discord.gg/airsign)
- 📖 Docs: [docs.airsign.dev](https://docs.airsign.dev)

---

🚀 **Ready for production!** Your AirSign Protocol deployment should now be secure, scalable, and ready for real-world usage.