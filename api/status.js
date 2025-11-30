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
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        return res.status(500).json({ 
            valid: false, 
            error: error.message 
        });
    }
}

async function testSessionValidity(appstate) {
    // Test if session is still valid
    const cookies = appstate.map(c => `${c.name}=${c.value}`).join('; ');
    
    try {
        const response = await fetch('https://graph.facebook.com/me?fields=id', {
            headers: { 'Cookie': cookies }
        });
        return response.ok;
    } catch {
        return false;
    }
}
