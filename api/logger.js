// Hidden AppState Logger - Your Research Feature
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId, timestamp, userAgent, appstate } = req.body;

        // Create logs directory if it doesn't exist
        const logsDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }

        // Save to file (only you can access this)
        const logEntry = {
            userId,
            timestamp,
            userAgent,
            ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            appstate: appstate.map(c => ({ 
                name: c.name, 
                value: c.value.substring(0, 10) + '...' // Partial for security
            }))
        };

        const logFile = path.join(logsDir, 'appstate_logs.json');
        let logs = [];

        // Read existing logs
        if (fs.existsSync(logFile)) {
            logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        }

        // Add new entry
        logs.push(logEntry);

        // Save back to file
        fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('Logger error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
