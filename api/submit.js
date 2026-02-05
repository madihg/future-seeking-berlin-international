const { kv } = require('@vercel/kv');

const SUBMISSIONS_KEY = 'submissions';
const USERS_KEY = 'active_users';

// Fallback in-memory storage if KV fails
let fallbackSubmissions = [];
let fallbackUsers = {};

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Parse body for POST
    let body = {};
    if (req.method === 'POST' && req.body) {
      body = req.body;
    } else if (req.method === 'POST') {
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

    if (req.method === 'POST') {
      const { text, userId } = body;
      
      if (!text || !text.trim()) {
        return res.status(400).json({ error: 'Text is required' });
      }

      const newSubmission = {
        id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        text: text.trim(),
        timestamp: Date.now(),
        userId: userId || 'anonymous'
      };

      let submissions = [];
      let activeUsers = 0;

      try {
        // Try KV
        submissions = await kv.get(SUBMISSIONS_KEY) || [];
        submissions.push(newSubmission);
        if (submissions.length > 500) {
          submissions = submissions.slice(-500);
        }
        await kv.set(SUBMISSIONS_KEY, submissions);
        
        if (userId) {
          await kv.hset(USERS_KEY, { [userId]: Date.now() });
        }
        activeUsers = await countActiveUsers();
      } catch (kvError) {
        console.error('KV Error:', kvError);
        // Fallback to memory
        fallbackSubmissions.push(newSubmission);
        submissions = fallbackSubmissions;
        if (userId) {
          fallbackUsers[userId] = Date.now();
        }
        activeUsers = Object.keys(fallbackUsers).length;
      }

      return res.status(200).json({ 
        success: true, 
        submission: newSubmission,
        activeUsers: activeUsers
      });

    } else if (req.method === 'GET') {
      let submissions = [];
      let activeUsers = 0;

      try {
        submissions = await kv.get(SUBMISSIONS_KEY) || [];
        activeUsers = await countActiveUsers();
      } catch (kvError) {
        console.error('KV Error:', kvError);
        submissions = fallbackSubmissions;
        activeUsers = Object.keys(fallbackUsers).length;
      }

      return res.status(200).json({ 
        submissions, 
        count: submissions.length,
        activeUsers: activeUsers
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
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
