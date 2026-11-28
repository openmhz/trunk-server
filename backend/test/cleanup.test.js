// Run with: node --test test/*.test.js  (needs Mongo on 127.0.0.1:27117, see stability.test.js)
const test = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");

const host = process.env.TEST_MONGO_HOST || "127.0.0.1";
const port = process.env.TEST_MONGO_PORT || "27117";

test("cleanOldCalls removes calls older than a month, system by system", async () => {
  await mongoose.connect(`mongodb://${host}:${port}/cleanup_test_${process.pid}`, { serverSelectionTimeoutMS: 5000 });
  try {
    const Call = require("../models/call");
    const { cleanOldCalls } = require("../db");
    const old = new Date(Date.now() - 40 * 864e5);
    await Call.create([
      { shortName: "a", time: old }, { shortName: "a", time: new Date() },
      { shortName: "b", time: old }, { shortName: "c", time: new Date() },
    ]);
    await cleanOldCalls();
    const left = await Call.find({}, { shortName: 1, _id: 0 }).sort({ shortName: 1 }).lean();
    assert.deepStrictEqual(left.map((c) => c.shortName), ["a", "c"]);
  } finally {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
