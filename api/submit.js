const { kv } = require("@vercel/kv");

const KEY = "futures";
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

      const subId = now + "-" + Math.random().toString(36).substr(2, 9);
      const submission = {
        id: subId,
        text: text.trim(),
        timestamp: now,
        userId: userId || "anon",
      };

      // Use hset - proven to work on this KV instance
      await kv.hset(KEY, { [subId]: JSON.stringify(submission) });

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
      const all = (await kv.hgetall(KEY)) || {};

      const submissions = Object.values(all)
        .map((v) => {
          try {
            return typeof v === "string" ? JSON.parse(v) : v;
          } catch {
            return null;
          }
        })
        .filter((s) => s && s.timestamp > cutoff)
        .sort((a, b) => a.timestamp - b.timestamp);

      // Clean up expired entries
      const expired = Object.entries(all)
        .filter(([, v]) => {
          try {
            const s = typeof v === "string" ? JSON.parse(v) : v;
            return !s || s.timestamp <= cutoff;
          } catch {
            return true;
          }
        })
        .map(([k]) => k);

      if (expired.length > 0) {
        await kv.hdel(KEY, ...expired);
      }

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
    for (const [, lastSeen] of Object.entries(users)) {
      if (lastSeen > cutoff) count++;
    }
    return count;
  } catch (e) {
    return 0;
  }
}
