// Pure in-memory storage - no database needed
// Data persists as long as the serverless function stays warm
// (polling every 3s keeps it warm during the event)

const submissions = new Map();
const users = new Map();

const SUB_TTL = 30 * 60 * 1000; // 30 minutes
const USER_TTL = 2 * 60 * 1000; // 2 minutes

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const now = Date.now();

  // Clean expired entries
  for (const [id, sub] of submissions) {
    if (now - sub.timestamp > SUB_TTL) submissions.delete(id);
  }
  for (const [id, lastSeen] of users) {
    if (now - lastSeen > USER_TTL) users.delete(id);
  }

  if (req.method === "POST") {
    let body = {};
    if (req.body) {
      body = req.body;
    } else {
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

    const { text, userId } = body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Text is required" });
    }

    const id = now + "-" + Math.random().toString(36).substr(2, 9);
    const submission = { id, text: text.trim(), timestamp: now };

    submissions.set(id, submission);

    if (userId) users.set(userId, now);

    return res.status(200).json({
      success: true,
      submission,
      activeUsers: users.size,
    });
  }

  if (req.method === "GET") {
    // Track user from poll
    const uid = req.query && req.query.uid;
    if (uid) users.set(uid, now);

    const list = [...submissions.values()].sort(
      (a, b) => a.timestamp - b.timestamp,
    );

    return res.status(200).json({
      submissions: list,
      count: list.length,
      activeUsers: users.size,
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
};
