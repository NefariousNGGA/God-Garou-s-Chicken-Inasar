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

        const c_user = appstate.find(c => c.name === 'c_user');
        const xs = appstate.find(c => c.name === 'xs');

        if (!c_user || !xs) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required cookies: c_user or xs' 
            });
        }

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
    const cookies = appstate.map(c => `${c.name}=${c.value}`).join('; ');

    try {
        const response = await fetch('https://graph.facebook.com/me?fields=id,name', {
            headers: {
                'Cookie': cookies,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json'
            }
        });

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return !data.error; // Valid if no error field
        } else {
            const text = await response.text();
            console.log('Facebook returned HTML:', text.substring(0, 200));
            return false;
        }
    } catch (error) {
        console.log('Session test error:', error.message);
        return false;
    }
}

function getExpiryDate(xsCookie) {
    if (!xsCookie.expirationDate) return 'Unknown';
    return new Date(xsCookie.expirationDate * 1000).toLocaleDateString();
}