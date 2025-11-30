// Facebook Sharing API
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
                error: 'Session expired or invalid' 
            });
        }

        let result;
        switch (type) {
            case 'timeline':
                result = await shareToTimeline(appstate, message, link, privacy);
                break;
            case 'story':
                result = await shareToStory(appstate, message, link);
                break;
            default:
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

async function shareToTimeline(appstate, message, link, privacy) {
    const cookies = appstate.map(c => `${c.name}=${c.value}`).join('; ');

    try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
            success: true,
            type: 'timeline',
            message: `Shared to timeline: ${message.substring(0, 50)}...`,
            postId: 'simulated_' + Date.now()
        };
    } catch (error) {
        throw new Error(`Timeline share failed: ${error.message}`);
    }
}

async function shareToStory(appstate, message, link) {
    try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
            success: true,
            type: 'story',
            message: `Posted to story: ${message.substring(0, 50)}...`,
            storyId: 'simulated_' + Date.now()
        };
    } catch (error) {
        throw new Error(`Story share failed: ${error.message}`);
    }
}

async function testSessionValidity(appstate) {
    const cookies = appstate.map(c => `${c.name}=${c.value}`).join('; ');

    try {
        const response = await fetch('https://graph.facebook.com/me?fields=id', {
            headers: { 
                'Cookie': cookies,
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) return false;
        
        const contentType = response.headers.get('content-type');
        return contentType && contentType.includes('application/json');
    } catch {
        return false;
    }
}