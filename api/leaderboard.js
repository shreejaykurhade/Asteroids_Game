import { createClient } from 'redis';

const LEADERBOARD_KEY = 'asteroid_leaderboard';

let redis = null;

async function getRedisClient() {
    if (!redis) {
        redis = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });
        await redis.connect();
    }
    return redis;
}

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const client = await getRedisClient();

        if (req.method === 'GET') {
            // Fetch leaderboard
            const data = await client.get(LEADERBOARD_KEY);
            const leaderboard = data ? JSON.parse(data) : [];
            return res.status(200).json(leaderboard);
        }

        if (req.method === 'POST') {
            // Add new score
            const { name, score } = req.body;

            if (!name || !score || typeof score !== 'number') {
                return res.status(400).json({ error: 'Invalid data' });
            }

            // Get current leaderboard
            const data = await client.get(LEADERBOARD_KEY);
            let leaderboard = data ? JSON.parse(data) : [];

            // Check if user already exists
            const existingIndex = leaderboard.findIndex(entry => entry.name === name);

            if (existingIndex !== -1) {
                // Update only if new score is higher
                if (score > leaderboard[existingIndex].score) {
                    leaderboard[existingIndex].score = score;
                    leaderboard[existingIndex].timestamp = Date.now();
                }
            } else {
                // Add new entry
                leaderboard.push({
                    name,
                    score,
                    timestamp: Date.now()
                });
            }

            // Sort and keep top 20
            leaderboard.sort((a, b) => b.score - a.score);
            leaderboard = leaderboard.slice(0, 20);

            // Save back to Redis
            await client.set(LEADERBOARD_KEY, JSON.stringify(leaderboard));

            return res.status(200).json({ success: true, leaderboard });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Leaderboard API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
