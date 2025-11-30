import fetch from 'node-fetch';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { appstate } = req.body;

        if (!appstate || !Array.isArray(appstate)) {
            return res.status(400).json({ error: 'Invalid appstate format' });
        }

        const c_user = appstate.find(c => c.name === 'c_user');
        const xs = appstate.find(c => c.name === 'xs');

        if (!c_user || !xs) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required cookies: c_user or xs' 
            });
        }

        // Test with REAL Facebook Graph API
        const isValid = await testFacebookSessionReal(appstate);

        return res.status(200).json({
            success: isValid,
            userId: c_user.value,
            expires: getExpiryDate(xs),
            message: isValid ? 'Session is valid' : 'Session invalid or blocked'
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
}

async function testFacebookSessionReal(appstate) {
    const cookieString = appstate.map(c => `${c.name}=${c.value}`).join('; ');

    try {
        const response = await fetch('https://graph.facebook.com/me?fields=id,name', {
            headers: {
                'Cookie': cookieString,
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
                'Accept': 'application/json',
                'Authorization': 'OAuth ' + appstate.find(c => c.name === 'xs').value
            },
            timeout: 10000
        });

        if (!response.ok) {
            console.log('Facebook API returned status:', response.status);
            return false;
        }

        const data = await response.json();
        return !data.error && data.id;

    } catch (error) {
        console.log('Facebook API error:', error.message);
        return false;
    }
}

function getExpiryDate(xsCookie) {
    if (!xsCookie.expirationDate) return 'Unknown';
    return new Date(xsCookie.expirationDate * 1000).toLocaleDateString();
}