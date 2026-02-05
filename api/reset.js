const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  const { key } = req.query;
  if (key !== '001188') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await kv.set('submissions', []);
    await kv.del('active_users');
    return res.status(200).json({ success: true, message: 'Database reset' });
  } catch (error) {
    console.error('Reset error:', error);
    return res.status(500).json({ error: error.message });
  }
};
