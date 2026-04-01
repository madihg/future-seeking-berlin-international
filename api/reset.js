// Reset is handled by submit.js TTL (30 min auto-expire)
// This endpoint is kept for admin use
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { key } = req.query;
  if (key !== "001188") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Can't clear another function's memory directly
  // Submissions auto-expire after 30 minutes
  return res
    .status(200)
    .json({ success: true, message: "Submissions auto-expire in 30 minutes" });
};
