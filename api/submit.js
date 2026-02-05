const { kv } = require('@vercel/kv');

// Keys for KV storage
const SUBMISSIONS_KEY = 'submissions';
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

  // Parse JSON body for POST requests
  if (req.method === 'POST') {
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
  }

  await handleRequest(req, res);
};

async function handleRequest(req, res) {
  try {
    if (req.method === 'POST') {
      const { text, userId } = req.body || {};
      
      if (!text || !text.trim()) {
        return res.status(400).json({ error: 'Text is required' });
      }

      // Get existing submissions
      let submissions = await kv.get(SUBMISSIONS_KEY) || [];
      
      // Create new submission
      const newSubmission = {
        id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        text: text.trim(),
        timestamp: Date.now(),
        userId: userId
      };
      
      // Add to array
      submissions.push(newSubmission);
      
      // Keep only last 500 submissions to avoid memory issues
      if (submissions.length > 500) {
        submissions = submissions.slice(-500);
      }
      
      // Save back to KV
      await kv.set(SUBMISSIONS_KEY, submissions);
      
      // Update active users
      if (userId) {
        await kv.hset(USERS_KEY, { [userId]: Date.now() });
      }
      
      // Get active user count
      const activeUsers = await getActiveUserCount();
      
      res.status(200).json({ 
        success: true, 
        submission: newSubmission,
        activeUsers: activeUsers
      });
      
    } else if (req.method === 'GET') {
      // Get all submissions
      const submissions = await kv.get(SUBMISSIONS_KEY) || [];
      const activeUsers = await getActiveUserCount();
      
      res.status(200).json({ 
        submissions, 
        count: submissions.length,
        activeUsers: activeUsers
      });
      
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
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
