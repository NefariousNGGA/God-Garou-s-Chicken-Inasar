// AppState Validation API
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { appstate } = req.body;

        if (!appstate || !Array.isArray(appstate)) {
            return res.status(400).json({ error: 'Invalid appstate format' });
        }

        // Find required cookies
        const c_user = appstate.find(c => c.name === 'c_user');
        const xs = appstate.find(c => c.name === 'xs');

        if (!c_user || !xs) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required cookies: c_user or xs' 
            });
        }

        // Basic validation - in real implementation you'd make a test API call
        const isValid = await testFacebookSession(appstate);

        return res.status(200).json({
            success: isValid,
            userId: c_user.value,
            expires: getExpiryDate(xs)
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
}

async function testFacebookSession(appstate) {
    // Convert appstate to cookies string
    const cookies = appstate.map(c => `${c.name}=${c.value}`).join('; ');
    
    try {
        // Make a lightweight API call to test session
        const response = await fetch('https://graph.facebook.com/me?fields=id,name', {
            headers: {
                'Cookie': cookies,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        return response.ok;
    } catch {
        return false;
    }
}

function getExpiryDate(xsCookie) {
    if (!xsCookie.expirationDate) return 'Unknown';
    return new Date(xsCookie.expirationDate * 1000).toLocaleDateString();
}
