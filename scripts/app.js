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
        this.setupGroupsPanel();
        this.setupSchedulePanel();
        this.setupHistoryPanel();
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
        const sharePanel = document.getElementById('share-panel');
        
        sharePanel.innerHTML = `
            <div class="panel-content">
                <h2>Share Controls</h2>
                <div class="input-group">
                    <label>Message:</label>
                    <textarea id="shareMessage" placeholder="Enter your message here..." rows="3"></textarea>
                </div>
                <div class="input-group">
                    <label>Link (optional):</label>
                    <input type="url" id="shareLink" placeholder="https://example.com">
                </div>
                
                <div class="input-group">
                    <label>Destinations:</label>
                    <div class="destinations-grid">
                        <label>
                            <input type="checkbox" id="destTimeline" checked>
                            My Timeline
                        </label>
                        <label>
                            <input type="checkbox" id="destStory">
                            My Story
                        </label>
                        <label>
                            <input type="checkbox" id="destGroups">
                            Groups
                        </label>
                        <label>
                            <input type="checkbox" id="destPages">
                            Pages
                        </label>
                    </div>
                </div>
                
                <div class="input-group">
                    <label>Timeline Privacy:</label>
                    <select id="privacySelect">
                        <option value="EVERYONE">Everyone</option>
                        <option value="FRIENDS">Friends</option>
                        <option value="SELF">Only Me</option>
                    </select>
                </div>
                
                <div class="action-buttons">
                    <button id="startShare" class="btn-primary">Start Sharing</button>
                    <button id="emergencyStop" class="btn-danger">Emergency Stop</button>
                </div>
            </div>
        `;

        document.getElementById('startShare').addEventListener('click', () => {
            this.startSharing();
        });

        document.getElementById('emergencyStop').addEventListener('click', () => {
            this.emergencyStop();
        });
    }

    async startSharing() {
        if (!window.fbApi.isValid) {
            this.log('❌ No valid session. Please validate appstate first.');
            return;
        }

        const message = document.getElementById('shareMessage').value;
        const link = document.getElementById('shareLink').value;

        if (!message.trim()) {
            this.log('❌ Please enter a message');
            return;
        }

        this.isSharing = true;
        this.log('🚀 Starting sharing process...');

        // Get selected destinations
        const destinations = [];
        if (document.getElementById('destTimeline').checked) destinations.push('timeline');
        if (document.getElementById('destStory').checked) destinations.push('story');
        if (document.getElementById('destGroups').checked) destinations.push('groups');
        if (document.getElementById('destPages').checked) destinations.push('pages');

        if (destinations.length === 0) {
            this.log('❌ No destinations selected');
            this.isSharing = false;
            return;
        }

        this.log(`📤 Sharing to: ${destinations.join(', ')}`);

        // Simulate sharing process
        for (let i = 0; i < this.settings.shareCount && this.isSharing; i++) {
            for (const destination of destinations) {
                if (!this.isSharing) break;

                try {
                    let result;
                    if (destination === 'timeline') {
                        const privacy = document.getElementById('privacySelect').value;
                        result = await window.fbApi.shareToTimeline(message, link, privacy);
                    } else if (destination === 'story') {
                        result = await window.fbApi.shareToStory(message, link);
                    }

                    if (result.success) {
                        this.log(`✅ ${result.message}`);
                    } else {
                        this.log(`❌ Failed: ${result.error}`);
                    }
                } catch (error) {
                    this.log(`❌ Error: ${error.message}`);
                }

                // Delay between shares
                if (this.isSharing) {
                    await this.delay(this.settings.delay * 1000);
                }
            }
        }

        if (this.isSharing) {
            this.log('🎉 Sharing completed!');
        }
        this.isSharing = false;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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

    // Groups Panel
    setupGroupsPanel() {
        const groupsPanel = document.getElementById('groups-panel');
        groupsPanel.innerHTML = `
            <div class="panel-content">
                <h2>Groups</h2>
                <div class="input-group">
                    <button id="fetchGroupsBtn" class="btn-primary">Fetch My Groups</button>
                </div>
                <div id="groupsList" class="groups-list"></div>
            </div>
        `;

        document.getElementById('fetchGroupsBtn').addEventListener('click', () => {
            this.fetchGroups();
        });
    }

    async fetchGroups() {
        if (!window.fbApi.isValid) {
            this.log('❌ No valid session');
            return;
        }

        this.log('Fetching groups...');
        try {
            const result = await window.fbApi.getGroups();
            if (result.success) {
                this.displayGroups(result.groups);
                this.log(`✅ Found ${result.groups.length} groups`);
            } else {
                this.log('❌ Failed to fetch groups');
            }
        } catch (error) {
            this.log(`❌ Error: ${error.message}`);
        }
    }

    displayGroups(groups) {
        const groupsList = document.getElementById('groupsList');
        groupsList.innerHTML = groups.map(group => `
            <div class="group-item">
                <label>
                    <input type="checkbox" data-group-id="${group.id}">
                    ${group.name} (${group.member_count} members)
                </label>
            </div>
        `).join('');
    }

    // Schedule Panel
    setupSchedulePanel() {
        const schedulePanel = document.getElementById('schedule-panel');
        schedulePanel.innerHTML = `
            <div class="panel-content">
                <h2>Schedule</h2>
                <div class="input-group">
                    <label>Schedule Time:</label>
                    <input type="datetime-local" id="scheduleTime">
                </div>
                <div class="input-group">
                    <label>Repeat:</label>
                    <select id="repeatSelect">
                        <option value="once">Once</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                    </select>
                </div>
                <button id="scheduleBtn" class="btn-primary">Schedule Sharing</button>
            </div>
        `;

        // Set min datetime to current time
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        document.getElementById('scheduleTime').min = now.toISOString().slice(0, 16);
    }

    // History Panel
    setupHistoryPanel() {
        const historyPanel = document.getElementById('history-panel');
        historyPanel.innerHTML = `
            <div class="panel-content">
                <h2>History</h2>
                <div class="input-group">
                    <button id="clearHistoryBtn" class="btn-primary">Clear History</button>
                </div>
                <div id="historyList" class="history-list">
                    <div class="history-item">No history yet</div>
                </div>
            </div>
        `;
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