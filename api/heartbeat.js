const { kv } = require('@vercel/kv');

const USERS_KEY = 'active_users';
let fallbackUsers = {};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse body
    let body = {};
    if (req.body) {
      body = req.body;
    } else {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const rawBody = Buffer.concat(chunks).toString();
      if (rawBody) {
        try {
          body = JSON.parse(rawBody);
        } catch (e) {
          body = {};
        }
      }
    }

    const { userId } = body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    let activeUsers = 0;

    try {
      await kv.hset(USERS_KEY, { [userId]: Date.now() });
      activeUsers = await countActiveUsers();
    } catch (kvError) {
      console.error('KV Error:', kvError);
      fallbackUsers[userId] = Date.now();
      activeUsers = Object.keys(fallbackUsers).length;
    }

    return res.status(200).json({ 
      success: true, 
      activeUsers: activeUsers 
    });
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

async function countActiveUsers() {
  try {
    const users = await kv.hgetall(USERS_KEY) || {};
    const twoMinutesAgo = Date.now() - (2 * 60 * 1000);
    let count = 0;
    for (const [id, lastSeen] of Object.entries(users)) {
      if (lastSeen > twoMinutesAgo) {
        count++;
      }
    }
    return count;
  } catch (e) {
    return 0;
  }
}
