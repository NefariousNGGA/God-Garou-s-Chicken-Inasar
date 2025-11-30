import fetch from 'node-fetch';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { appstate } = req.body;

        if (!appstate) {
            return res.status(400).json({ error: 'AppState required' });
        }

        const isValid = await testSessionValidityReal(appstate);
        const userInfo = isValid ? await getUserInfo(appstate) : null;

        return res.status(200).json({
            valid: isValid,
            user: userInfo,
            timestamp: new Date().toISOString(),
            message: isValid ? 'Session is active' : 'Session expired or invalid'
        });

    } catch (error) {
        return res.status(500).json({ 
            valid: false, 
            error: error.message 
        });
    }
}

async function testSessionValidityReal(appstate) {
    const cookieString = appstate.map(c => `${c.name}=${c.value}`).join('; ');

    try {
        const response = await fetch('https://graph.facebook.com/me?fields=id,name', {
            headers: { 
                'Cookie': cookieString,
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
                'Accept': 'application/json'
            },
            timeout: 10000
        });
        
        if (!response.ok) return false;
        
        const data = await response.json();
        return !data.error && data.id;
    } catch {
        return false;
    }
}

async function getUserInfo(appstate) {
    const cookieString = appstate.map(c => `${c.name}=${c.value}`).join('; ');

    try {
        const response = await fetch('https://graph.facebook.com/me?fields=id,name,email', {
            headers: { 
                'Cookie': cookieString,
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch {
        return null;
    }
}