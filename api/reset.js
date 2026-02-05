const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Simple secret key protection
  const { key } = req.query;
  if (key !== 'halim2026') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await kv.set('submissions', []);
    await kv.del('active_users');
    return res.status(200).json({ success: true, message: 'Database reset' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
