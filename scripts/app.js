// Main Application Logic
class ChickenInasarApp {
    constructor() {
        this.settings = {
            delay: 5,
            shareCount: 50,
            stealth: true
        };
        this.shareQueue = [];
        this.isSharing = false;
        this.init();
    }

    init() {
        this.loadSettings();
        this.setupShareControls();
        this.setupSessionsPanel();
        this.setupSettingsPanel();
        this.log('System initialized');
    }

    // Log to real-time logs
    log(message) {
        const logsContent = document.getElementById('logsContent');
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.textContent = `> ${new Date().toLocaleTimeString()} ${message}`;
        logsContent.appendChild(logEntry);
        logsContent.scrollTop = logsContent.scrollHeight;
    }

    // Settings management
    loadSettings() {
        const saved = localStorage.getItem('chickenInasarSettings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
    }

    saveSettings() {
        localStorage.setItem('chickenInasarSettings', JSON.stringify(this.settings));
    }

    // Share Controls Panel
    setupShareControls() {
        // This will be populated when we build the panel content
    }

    // Sessions Panel
    setupSessionsPanel() {
        const sessionsPanel = document.getElementById('sessions-panel');
        
        sessionsPanel.innerHTML = `
            <div class="panel-content">
                <h2>Sessions</h2>
                <div class="input-group">
                    <label>AppState JSON:</label>
                    <textarea id="appstateInput" placeholder="Paste your appstate JSON here..." rows="10"></textarea>
                </div>
                <button id="validateBtn" class="btn-primary">Validate Session</button>
                <div id="sessionStatus" class="status-box">
                    <div class="status-line">Status: ❌ Not Connected</div>
                    <div class="status-line">User: -</div>
                    <div class="status-line">Expires: -</div>
                </div>
            </div>
        `;

        document.getElementById('validateBtn').addEventListener('click', () => {
            this.validateSession();
        });
    }

    async validateSession() {
        const appstateInput = document.getElementById('appstateInput').value;
        
        if (!appstateInput.trim()) {
            this.log('Error: No appstate provided');
            return;
        }

        this.log('Validating appstate...');
        
        try {
            const result = await window.fbApi.validateAppState(appstateInput);
            
            if (result.success) {
                this.log(`✅ Session validated - User: ${result.userId}`);
                this.updateSessionStatus(result);
            } else {
                this.log(`❌ Validation failed: ${result.error}`);
                this.updateSessionStatus({ success: false });
            }
        } catch (error) {
            this.log(`❌ Error: ${error.message}`);
        }
    }

    updateSessionStatus(result) {
        const statusBox = document.getElementById('sessionStatus');
        
        if (result.success) {
            statusBox.innerHTML = `
                <div class="status-line">Status: ✅ Connected</div>
                <div class="status-line">User: ${result.userId}</div>
                <div class="status-line">Expires: ${result.expires}</div>
            `;
        } else {
            statusBox.innerHTML = `
                <div class="status-line">Status: ❌ Not Connected</div>
                <div class="status-line">User: -</div>
                <div class="status-line">Expires: -</div>
            `;
        }
    }

    // Settings Panel
    setupSettingsPanel() {
        const settingsPanel = document.getElementById('settings-panel');
        
        settingsPanel.innerHTML = `
            <div class="panel-content">
                <h2>Settings</h2>
                <div class="input-group">
                    <label>Delay (seconds):</label>
                    <input type="number" id="delayInput" value="${this.settings.delay}" min="1" max="60">
                </div>
                <div class="input-group">
                    <label>Share Count:</label>
                    <input type="number" id="shareCountInput" value="${this.settings.shareCount}" min="1" max="1000">
                </div>
                <div class="input-group">
                    <label>
                        <input type="checkbox" id="stealthInput" ${this.settings.stealth ? 'checked' : ''}>
                        Stealth Mode
                    </label>
                </div>
                <button id="saveSettingsBtn" class="btn-primary">Save Settings</button>
            </div>
        `;

        document.getElementById('saveSettingsBtn').addEventListener('click', () => {
            this.saveSettingsFromUI();
        });
    }

    saveSettingsFromUI() {
        this.settings.delay = parseInt(document.getElementById('delayInput').value) || 5;
        this.settings.shareCount = parseInt(document.getElementById('shareCountInput').value) || 50;
        this.settings.stealth = document.getElementById('stealthInput').checked;
        
        this.saveSettings();
        this.log('Settings saved');
    }

    // Emergency stop
    emergencyStop() {
        this.isSharing = false;
        this.shareQueue = [];
        this.log('🛑 EMERGENCY STOP - All operations cancelled');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chickenApp = new ChickenInasarApp();
});
