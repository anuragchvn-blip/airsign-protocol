/**
 * AirSign Embeddable SDK
 * 
 * Drop-in Web3 payment sharing solution for any website or app
 * 
 * Usage:
 * <script src="airsign-embed.js"></script>
 * <script>
 *   const airsign = new AirSignEmbed({
 *     apiKey: 'your-api-key',
 *     network: 'mainnet' // or 'testnet'
 *   });
 *   
 *   airsign.enable(); // Adds AirSign to your site
 * </script>
 */

class AirSignEmbed {
    constructor(options = {}) {
        this.options = {
            apiKey: options.apiKey || 'demo',
            network: options.network || 'mainnet',
            theme: options.theme || 'auto',
            position: options.position || 'bottom-right',
            serverUrl: options.serverUrl || 'wss://airsign.app/ws',
            ...options
        };
        
        this.isEnabled = false;
        this.widget = null;
        this.sdk = null;
        this.peers = new Map();
    }
    
    // Initialize and show AirSign widget on the page
    async enable() {
        if (this.isEnabled) return;
        
        try {
            await this.initializeSDK();
            this.createWidget();
            this.connectToNetwork();
            this.isEnabled = true;
            
            console.log('🚀 AirSign enabled on your site!');
            return true;
        } catch (error) {
            console.error('❌ AirSign initialization failed:', error);
            return false;
        }
    }
    
    // Remove AirSign from the page
    disable() {
        if (!this.isEnabled) return;
        
        if (this.widget) {
            this.widget.remove();
            this.widget = null;
        }
        
        this.isEnabled = false;
        console.log('🔌 AirSign disabled');
    }
    
    // Initialize the crypto SDK
    async initializeSDK() {
        // Load AirSign browser SDK if not already loaded
        if (!window.AirSignBrowser) {
            await this.loadScript('/airsign-browser.js');
        }
        
        this.sdk = new window.AirSignBrowser();
        await this.sdk.init();
    }
    
    // Create floating widget UI
    createWidget() {
        // Remove existing widget
        if (this.widget) {
            this.widget.remove();
        }
        
        // Create widget container
        this.widget = document.createElement('div');
        this.widget.id = 'airsign-widget';
        this.widget.innerHTML = this.getWidgetHTML();
        
        // Add widget styles
        this.addWidgetStyles();
        
        // Position widget
        this.positionWidget();
        
        // Add event listeners
        this.attachWidgetEvents();
        
        // Add to page
        document.body.appendChild(this.widget);
    }
    
    getWidgetHTML() {
        return `
            <div class="airsign-fab" id="airsign-fab">
                <div class="airsign-fab-icon">💰</div>
                <div class="airsign-fab-tooltip">Send Crypto Nearby</div>
            </div>
            
            <div class="airsign-panel" id="airsign-panel" style="display: none;">
                <div class="airsign-header">
                    <h3>🚀 AirSign</h3>
                    <button class="airsign-close" id="airsign-close">×</button>
                </div>
                
                <div class="airsign-status" id="airsign-status">
                    <div class="airsign-device-name" id="airsign-device-name">Connecting...</div>
                    <div class="airsign-connection-status" id="airsign-connection-status">Initializing...</div>
                </div>
                
                <div class="airsign-discover-section">
                    <button class="airsign-discover-btn" id="airsign-discover-btn">
                        🔍 Find Nearby Devices
                    </button>
                </div>
                
                <div class="airsign-peers" id="airsign-peers">
                    <div class="airsign-empty-state">
                        <div class="airsign-empty-icon">📱</div>
                        <p>No devices found nearby</p>
                        <p>Click "Find Nearby Devices" to start</p>
                    </div>
                </div>
                
                <div class="airsign-footer">
                    <small>Powered by <strong>AirSign</strong></small>
                </div>
            </div>
            
            <!-- Payment Modal -->
            <div class="airsign-modal" id="airsign-payment-modal" style="display: none;">
                <div class="airsign-modal-content">
                    <div class="airsign-modal-header">
                        <h3>💰 Send Crypto Payment</h3>
                        <p>To: <span id="airsign-selected-peer"></span></p>
                    </div>
                    
                    <form class="airsign-payment-form" id="airsign-payment-form">
                        <div class="airsign-form-group">
                            <label>Amount</label>
                            <input type="number" id="airsign-amount" step="0.000001" placeholder="0.01" required>
                        </div>
                        
                        <div class="airsign-form-group">
                            <label>Currency</label>
                            <select id="airsign-currency" required>
                                <option value="BTC">Bitcoin (BTC)</option>
                                <option value="ETH">Ethereum (ETH)</option>
                                <option value="USDC">USD Coin (USDC)</option>
                                <option value="SOL">Solana (SOL)</option>
                            </select>
                        </div>
                        
                        <div class="airsign-form-group">
                            <label>Your Wallet Address</label>
                            <input type="text" id="airsign-wallet-address" placeholder="Your receiving address" required>
                        </div>
                        
                        <div class="airsign-modal-actions">
                            <button type="button" class="airsign-btn airsign-btn-cancel" id="airsign-cancel-payment">Cancel</button>
                            <button type="submit" class="airsign-btn airsign-btn-send">Send Request</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }
    
    addWidgetStyles() {
        if (document.getElementById('airsign-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'airsign-styles';
        styles.textContent = `
            #airsign-widget {
                position: fixed;
                z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            }
            
            .airsign-fab {
                width: 60px;
                height: 60px;
                background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                transition: all 0.3s ease;
                position: relative;
            }
            
            .airsign-fab:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 25px rgba(0,0,0,0.2);
            }
            
            .airsign-fab-icon {
                font-size: 24px;
                color: white;
            }
            
            .airsign-fab-tooltip {
                position: absolute;
                right: 70px;
                top: 50%;
                transform: translateY(-50%);
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 14px;
                white-space: nowrap;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
            }
            
            .airsign-fab:hover .airsign-fab-tooltip {
                opacity: 1;
            }
            
            .airsign-panel {
                position: absolute;
                bottom: 80px;
                right: 0;
                width: 350px;
                max-height: 500px;
                background: white;
                border-radius: 15px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.15);
                border: 1px solid #e0e0e0;
                overflow: hidden;
            }
            
            .airsign-header {
                background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
                color: white;
                padding: 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .airsign-header h3 {
                margin: 0;
                font-size: 18px;
            }
            
            .airsign-close {
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background 0.3s ease;
            }
            
            .airsign-close:hover {
                background: rgba(255,255,255,0.2);
            }
            
            .airsign-status {
                padding: 20px;
                border-bottom: 1px solid #f0f0f0;
                text-align: center;
            }
            
            .airsign-device-name {
                font-weight: bold;
                font-size: 16px;
                color: #333;
                margin-bottom: 5px;
            }
            
            .airsign-connection-status {
                font-size: 14px;
                color: #666;
            }
            
            .airsign-discover-section {
                padding: 20px;
                text-align: center;
            }
            
            .airsign-discover-btn {
                background: linear-gradient(45deg, #4ECDC4, #44A08D);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 25px;
                cursor: pointer;
                font-weight: bold;
                font-size: 14px;
                transition: all 0.3s ease;
                width: 100%;
            }
            
            .airsign-discover-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(78, 205, 196, 0.3);
            }
            
            .airsign-peers {
                max-height: 200px;
                overflow-y: auto;
                padding: 0 20px 20px;
            }
            
            .airsign-empty-state {
                text-align: center;
                padding: 20px;
                color: #666;
            }
            
            .airsign-empty-icon {
                font-size: 48px;
                margin-bottom: 10px;
            }
            
            .airsign-peer-item {
                background: #f8f9fa;
                border-radius: 10px;
                padding: 15px;
                margin-bottom: 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: all 0.3s ease;
                cursor: pointer;
            }
            
            .airsign-peer-item:hover {
                background: #e9ecef;
                transform: translateY(-1px);
            }
            
            .airsign-peer-info h4 {
                margin: 0 0 5px 0;
                color: #333;
                font-size: 14px;
            }
            
            .airsign-peer-info p {
                margin: 0;
                color: #666;
                font-size: 12px;
            }
            
            .airsign-send-btn {
                background: linear-gradient(45deg, #FF6B6B, #FF8E8E);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 15px;
                cursor: pointer;
                font-weight: bold;
                font-size: 12px;
                transition: all 0.3s ease;
            }
            
            .airsign-send-btn:hover {
                transform: scale(1.05);
            }
            
            .airsign-footer {
                background: #f8f9fa;
                padding: 15px 20px;
                text-align: center;
                color: #666;
                font-size: 12px;
            }
            
            .airsign-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000000;
            }
            
            .airsign-modal-content {
                background: white;
                border-radius: 15px;
                padding: 30px;
                max-width: 400px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
            }
            
            .airsign-modal-header {
                text-align: center;
                margin-bottom: 20px;
            }
            
            .airsign-modal-header h3 {
                margin: 0 0 5px 0;
                color: #333;
            }
            
            .airsign-payment-form {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }
            
            .airsign-form-group {
                display: flex;
                flex-direction: column;
            }
            
            .airsign-form-group label {
                margin-bottom: 5px;
                font-weight: bold;
                color: #333;
                font-size: 14px;
            }
            
            .airsign-form-group input,
            .airsign-form-group select {
                padding: 12px;
                border: 2px solid #dee2e6;
                border-radius: 8px;
                font-size: 14px;
                transition: border-color 0.3s ease;
            }
            
            .airsign-form-group input:focus,
            .airsign-form-group select:focus {
                outline: none;
                border-color: #4ECDC4;
            }
            
            .airsign-modal-actions {
                display: flex;
                gap: 10px;
                margin-top: 20px;
            }
            
            .airsign-btn {
                flex: 1;
                padding: 12px 20px;
                border: none;
                border-radius: 8px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .airsign-btn-cancel {
                background: #6c757d;
                color: white;
            }
            
            .airsign-btn-cancel:hover {
                background: #5a6268;
            }
            
            .airsign-btn-send {
                background: linear-gradient(45deg, #FF6B6B, #FF8E8E);
                color: white;
            }
            
            .airsign-btn-send:hover {
                transform: translateY(-2px);
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    positionWidget() {
        const positions = {
            'bottom-right': { bottom: '20px', right: '20px' },
            'bottom-left': { bottom: '20px', left: '20px' },
            'top-right': { top: '20px', right: '20px' },
            'top-left': { top: '20px', left: '20px' }
        };
        
        const pos = positions[this.options.position] || positions['bottom-right'];
        Object.assign(this.widget.style, pos);
    }
    
    attachWidgetEvents() {
        const fab = this.widget.querySelector('#airsign-fab');
        const panel = this.widget.querySelector('#airsign-panel');
        const closeBtn = this.widget.querySelector('#airsign-close');
        const discoverBtn = this.widget.querySelector('#airsign-discover-btn');
        const paymentForm = this.widget.querySelector('#airsign-payment-form');
        const cancelPayment = this.widget.querySelector('#airsign-cancel-payment');
        const paymentModal = this.widget.querySelector('#airsign-payment-modal');
        
        // Toggle panel
        fab.addEventListener('click', () => {
            const isVisible = panel.style.display !== 'none';
            panel.style.display = isVisible ? 'none' : 'block';
        });
        
        // Close panel
        closeBtn.addEventListener('click', () => {
            panel.style.display = 'none';
        });
        
        // Discovery
        discoverBtn.addEventListener('click', () => {
            this.startDiscovery();
        });
        
        // Payment form
        paymentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendPayment();
        });
        
        // Cancel payment
        cancelPayment.addEventListener('click', () => {
            paymentModal.style.display = 'none';
        });
        
        // Close modal on backdrop click
        paymentModal.addEventListener('click', (e) => {
            if (e.target === paymentModal) {
                paymentModal.style.display = 'none';
            }
        });
    }
    
    async connectToNetwork() {
        // Implementation would connect to AirSign network
        // For demo, simulate connection
        this.updateStatus('Connected to AirSign Network');
        this.updateDeviceName(this.generateDeviceName());
    }
    
    startDiscovery() {
        // Implementation would start device discovery
        this.updatePeerList([
            { id: '1', name: "Alice's iPhone", capabilities: ['crypto-payments'] },
            { id: '2', name: "Bob's MacBook", capabilities: ['crypto-payments'] }
        ]);
    }
    
    updateStatus(status) {
        const statusEl = this.widget.querySelector('#airsign-connection-status');
        if (statusEl) statusEl.textContent = status;
    }
    
    updateDeviceName(name) {
        const nameEl = this.widget.querySelector('#airsign-device-name');
        if (nameEl) nameEl.textContent = name;
    }
    
    updatePeerList(peers) {
        const peersEl = this.widget.querySelector('#airsign-peers');
        if (!peersEl) return;
        
        if (peers.length === 0) {
            peersEl.innerHTML = `
                <div class="airsign-empty-state">
                    <div class="airsign-empty-icon">📱</div>
                    <p>No devices found nearby</p>
                    <p>Make sure other devices are running AirSign</p>
                </div>
            `;
        } else {
            peersEl.innerHTML = peers.map(peer => `
                <div class="airsign-peer-item" onclick="window.airsignEmbed.openPaymentModal('${peer.id}', '${peer.name}')">
                    <div class="airsign-peer-info">
                        <h4>${peer.name}</h4>
                        <p>💎 Crypto enabled</p>
                    </div>
                    <button class="airsign-send-btn" onclick="event.stopPropagation(); window.airsignEmbed.openPaymentModal('${peer.id}', '${peer.name}')">
                        💰 Send
                    </button>
                </div>
            `).join('');
        }
    }
    
    openPaymentModal(peerId, peerName) {
        const modal = this.widget.querySelector('#airsign-payment-modal');
        const selectedPeer = this.widget.querySelector('#airsign-selected-peer');
        
        this.selectedPeer = { id: peerId, name: peerName };
        selectedPeer.textContent = peerName;
        modal.style.display = 'flex';
    }
    
    async sendPayment() {
        // Implementation would send encrypted payment
        const amount = this.widget.querySelector('#airsign-amount').value;
        const currency = this.widget.querySelector('#airsign-currency').value;
        const address = this.widget.querySelector('#airsign-wallet-address').value;
        
        console.log(`💰 Sending ${amount} ${currency} to ${this.selectedPeer.name}`);
        
        // Close modal
        this.widget.querySelector('#airsign-payment-modal').style.display = 'none';
        
        // Show success
        this.showNotification(`Payment request sent to ${this.selectedPeer.name}!`);
    }
    
    showNotification(message) {
        // Simple notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4ECDC4;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 1000001;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    generateDeviceName() {
        const names = [
            "User's iPhone", "User's MacBook", "User's Pixel", "User's iPad",
            "User's Surface", "User's Galaxy", "User's Desktop", "User's Laptop"
        ];
        return names[Math.floor(Math.random() * names.length)];
    }
    
    async loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
}

// Auto-attach to window for easy access
window.AirSignEmbed = AirSignEmbed;

// Auto-initialize if data attributes are present
document.addEventListener('DOMContentLoaded', () => {
    const autoInit = document.querySelector('[data-airsign-auto]');
    if (autoInit) {
        const options = {
            apiKey: autoInit.dataset.airsignApiKey,
            network: autoInit.dataset.airsignNetwork,
            theme: autoInit.dataset.airsignTheme,
            position: autoInit.dataset.airsignPosition
        };
        
        window.airsignEmbed = new AirSignEmbed(options);
        window.airsignEmbed.enable();
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AirSignEmbed;
}