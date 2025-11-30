import fetch from 'node-fetch';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { appstate, type, message, link, privacy } = req.body;

        if (!appstate || !type) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // Validate session first
        const isValid = await testSessionValidity(appstate);
        if (!isValid) {
            return res.status(401).json({ 
                success: false, 
                error: 'Facebook session expired. Please refresh your appstate.' 
            });
        }

        let result;
        if (type === 'timeline') {
            result = await shareToTimelineReal(appstate, message, link, privacy);
        } else if (type === 'story') {
            result = await shareToStoryReal(appstate, message, link);
        } else {
            return res.status(400).json({ error: 'Invalid share type' });
        }

        return res.status(200).json(result);

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
}

async function shareToTimelineReal(appstate, message, link, privacy) {
    const cookieString = appstate.map(c => `${c.name}=${c.value}`).join('; ');
    const xsToken = appstate.find(c => c.name === 'xs').value;

    try {
        // Method 1: Try Graph API first
        const postData = {
            message: message,
            link: link,
            privacy: { value: privacy }
        };

        const response = await fetch('https://graph.facebook.com/me/feed', {
            method: 'POST',
            headers: {
                'Cookie': cookieString,
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
                'Content-Type': 'application/json',
                'Authorization': `OAuth ${xsToken}`
            },
            body: JSON.stringify(postData),
            timeout: 15000
        });

        if (response.ok) {
            const data = await response.json();
            return {
                success: true,
                type: 'timeline',
                message: `Shared to timeline successfully`,
                postId: data.id
            };
        }

        // If Graph API fails, throw error
        throw new Error(`Facebook API returned ${response.status}`);

    } catch (error) {
        throw new Error(`Timeline share failed: ${error.message}`);
    }
}

async function shareToStoryReal(appstate, message, link) {
    const cookieString = appstate.map(c => `${c.name}=${c.value}`).join('; ');

    try {
        // Story sharing via Graph API
        const postData = {
            message: message,
            link: link,
            place_attachment_setting: 'CHECKIN'
        };

        const response = await fetch('https://graph.facebook.com/me/stories', {
            method: 'POST',
            headers: {
                'Cookie': cookieString,
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData),
            timeout: 15000
        });

        if (response.ok) {
            const data = await response.json();
            return {
                success: true,
                type: 'story',
                message: `Posted to story successfully`,
                storyId: data.id
            };
        }

        throw new Error(`Facebook API returned ${response.status}`);

    } catch (error) {
        throw new Error(`Story share failed: ${error.message}`);
    }
}

async function testSessionValidity(appstate) {
    const cookieString = appstate.map(c => `${c.name}=${c.value}`).join('; ');

    try {
        const response = await fetch('https://graph.facebook.com/me?fields=id', {
            headers: { 
                'Cookie': cookieString,
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
                'Accept': 'application/json'
            },
            timeout: 10000
        });
        
        if (!response.ok) return false;
        
        const data = await response.json();
        return !data.error;
    } catch {
        return false;
    }
}