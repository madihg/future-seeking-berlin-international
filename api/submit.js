const { kv } = require("@vercel/kv");

const KEY = "submissions";
const USERS_KEY = "active_users";
const TTL_MS = 30 * 60 * 1000; // 30 minutes

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    let body = {};
    if (req.method === "POST" && req.body) {
      body = req.body;
    } else if (req.method === "POST") {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const raw = Buffer.concat(chunks).toString();
      if (raw) {
        try {
          body = JSON.parse(raw);
        } catch (e) {
          body = {};
        }
      }
    }

    const now = Date.now();
    const cutoff = now - TTL_MS;

    if (req.method === "POST") {
      const { text, userId } = body;
      if (!text || !text.trim()) {
        return res.status(400).json({ error: "Text is required" });
      }

      const submission = {
        id: now + "-" + Math.random().toString(36).substr(2, 9),
        text: text.trim(),
        timestamp: now,
        userId: userId || "anon",
      };

      // Read current, append, filter expired, write back
      let submissions = (await kv.get(KEY)) || [];
      submissions.push(submission);
      submissions = submissions.filter((s) => s.timestamp > cutoff);
      await kv.set(KEY, submissions);

      if (userId) {
        await kv.hset(USERS_KEY, { [userId]: now });
      }

      const activeUsers = await countActive();

      return res.status(200).json({
        success: true,
        submission,
        activeUsers,
      });
    } else if (req.method === "GET") {
      let submissions = (await kv.get(KEY)) || [];
      submissions = submissions.filter((s) => s.timestamp > cutoff);

      const activeUsers = await countActive();

      return res.status(200).json({
        submissions,
        count: submissions.length,
        activeUsers,
      });
    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ error: "Server error", message: error.message });
  }
};

async function countActive() {
  try {
    const users = (await kv.hgetall(USERS_KEY)) || {};
    const cutoff = Date.now() - 2 * 60 * 1000;
    let count = 0;
    for (const [id, lastSeen] of Object.entries(users)) {
      if (lastSeen > cutoff) count++;
    }
    return count;
  } catch (e) {
    return 0;
  }
}
