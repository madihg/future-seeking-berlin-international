const { kv } = require("@vercel/kv");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const results = {};

  // Test 1: hset (known working)
  try {
    await kv.hset("test_hash", { test: Date.now() });
    results.hset = "OK";
  } catch (e) {
    results.hset = e.message;
  }

  // Test 2: set on a fresh key
  try {
    await kv.set("test_fresh_key", "hello");
    results.set = "OK";
  } catch (e) {
    results.set = e.message;
  }

  // Test 3: get on that fresh key
  try {
    const val = await kv.get("test_fresh_key");
    results.get = val;
  } catch (e) {
    results.get = e.message;
  }

  // Test 4: get submissions key
  try {
    const val = await kv.get("submissions");
    results.get_submissions = val === null ? "null" : typeof val;
  } catch (e) {
    results.get_submissions = e.message;
  }

  // Test 5: type of submissions key
  try {
    const t = await kv.type("submissions");
    results.submissions_type = t;
  } catch (e) {
    results.submissions_type = e.message;
  }

  return res.status(200).json(results);
};
