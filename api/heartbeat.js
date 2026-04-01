// Heartbeat is now handled by the submit endpoint via polling
// This endpoint is kept for backwards compatibility
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  return res.status(200).json({ success: true, activeUsers: 0 });
};
