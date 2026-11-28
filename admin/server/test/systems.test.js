const test = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const { connect, disconnect, fakeRes } = require("./helpers");
const System = require("../models/system");
const systemsCtl = require("../controllers/systems");

const ownerId = new mongoose.Types.ObjectId();
const otherId = new mongoose.Types.ObjectId();
const owner = { _id: ownerId, screenName: "owner" };
const other = { _id: otherId, screenName: "other" };
const lastActive = new Date("2024-01-02T03:04:05Z");
const OLD_KEY = "0".repeat(32);

test.before(async () => {
  await connect();
  await System.deleteMany({});
  await System.create({ shortName: "keysys", name: "K", userId: ownerId, key: OLD_KEY, active: true, lastActive, callAvg: 12 });
});
test.after(async () => { await disconnect(); });

test("listSystems includes active, lastActive and callAvg", async () => {
  const res = fakeRes();
  await systemsCtl.listSystems({ user: owner }, res, (e) => { throw e || new Error("next called"); });
  const sys = res.body.systems.find(s => s.shortName === "keysys");
  assert.ok(sys);
  assert.strictEqual(sys.active, true);
  assert.strictEqual(new Date(sys.lastActive).getTime(), lastActive.getTime());
  assert.strictEqual(sys.callAvg, 12);
  assert.strictEqual(sys.key, OLD_KEY);
});

test("regenerateKey: owner gets a new saved 32-hex key", async () => {
  const res = fakeRes();
  await systemsCtl.regenerateKey({ params: { shortName: "KeySys" }, user: owner }, res, () => {});
  assert.strictEqual(res.body.success, true);
  assert.match(res.body.key, /^[0-9a-f]{32}$/);
  assert.notStrictEqual(res.body.key, OLD_KEY);
  const saved = await System.findOne({ shortName: "keysys" });
  assert.strictEqual(saved.key, res.body.key);
});

test("regenerateKey: non-owner gets 401 and key is unchanged", async () => {
  const before = (await System.findOne({ shortName: "keysys" })).key;
  const res = fakeRes();
  await systemsCtl.regenerateKey({ params: { shortName: "keysys" }, user: other }, res, () => {});
  assert.strictEqual(res.status_, 401);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual((await System.findOne({ shortName: "keysys" })).key, before);
});

test("regenerateKey: unknown system gets 404", async () => {
  const res = fakeRes();
  await systemsCtl.regenerateKey({ params: { shortName: "nope" }, user: owner }, res, () => {});
  assert.strictEqual(res.status_, 404);
});
