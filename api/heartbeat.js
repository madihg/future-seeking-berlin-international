const { kv } = require('@vercel/kv');

const USERS_KEY = 'active_users';

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Parse JSON body
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  await new Promise((resolve) => {
    req.on('end', () => {
      try {
        req.body = JSON.parse(body);
      } catch (error) {
        req.body = {};
      }
      resolve();
    });
  });

  await handleHeartbeat(req, res);
};

async function handleHeartbeat(req, res) {
  try {
    const { userId } = req.body || {};
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Update user's last seen timestamp
    await kv.hset(USERS_KEY, { [userId]: Date.now() });
    
    // Get active user count
    const activeUsers = await getActiveUserCount();
    
    res.status(200).json({ 
      success: true, 
      activeUsers: activeUsers 
    });
  } catch (error) {
    console.error('Error in heartbeat:', error);
    res.status(500).json({ error: 'Failed to process heartbeat' });
  }
}

async function getActiveUserCount() {
  try {
    const users = await kv.hgetall(USERS_KEY) || {};
    const twoMinutesAgo = Date.now() - (2 * 60 * 1000);
    
    let activeCount = 0;
    const expiredUsers = [];
    
    for (const [userId, lastSeen] of Object.entries(users)) {
      if (lastSeen > twoMinutesAgo) {
        activeCount++;
      } else {
        expiredUsers.push(userId);
      }
    }
    
    // Clean up expired users
    if (expiredUsers.length > 0) {
      await kv.hdel(USERS_KEY, ...expiredUsers);
    }
    
    return activeCount;
  } catch (error) {
    return 0;
  }
}
