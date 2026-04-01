const { kv } = require("@vercel/kv");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  const { key } = req.query;
  if (key !== "001188") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Clear all submission fields from the hash
    const all = (await kv.hgetall("futures")) || {};
    const keys = Object.keys(all);
    if (keys.length > 0) {
      await kv.hdel("futures", ...keys);
    }

    // Clear active users
    const users = (await kv.hgetall("active_users")) || {};
    const userKeys = Object.keys(users);
    if (userKeys.length > 0) {
      await kv.hdel("active_users", ...userKeys);
    }

    return res.status(200).json({ success: true, message: "Reset done" });
  } catch (error) {
    console.error("Reset error:", error);
    return res.status(500).json({ error: error.message });
  }
};
