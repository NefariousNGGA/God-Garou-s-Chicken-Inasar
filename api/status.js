// Session Status Check
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { appstate } = req.body;

        if (!appstate) {
            return res.status(400).json({ error: 'AppState required' });
        }

        const isValid = await testSessionValidity(appstate);

        return res.status(200).json({
            valid: isValid,
            timestamp: new Date().toISOString(),
            message: isValid ? 'Session is valid' : 'Session expired'
        });

    } catch (error) {
        return res.status(500).json({ 
            valid: false, 
            error: error.message 
        });
    }
}

async function testSessionValidity(appstate) {
    const cookies = appstate.map(c => `${c.name}=${c.value}`).join('; ');

    try {
        const response = await fetch('https://graph.facebook.com/me?fields=id', {
            headers: { 
                'Cookie': cookies,
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        if (!response.ok) return false;
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            return false;
        }
        
        const data = await response.json();
        return !data.error; // Valid if no error in response
    } catch {
        return false;
    }
}