const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const mongoose = require("mongoose");
const { connect, disconnect, fakeRes } = require("./helpers");
const System = require("../models/system");
const Talkgroup = require("../models/talkgroup");
const Group = require("../models/group");
const talkgroups = require("../controllers/talkgroups");
const groups = require("../controllers/groups");
const systemsCtl = require("../controllers/systems");
const { csvField } = talkgroups;

const userId = new mongoose.Types.ObjectId();
const user = { _id: userId };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tg-test-"));
const origErr = console.error;

test.before(async () => {
  console.error = () => {};
  await connect();
  await System.deleteMany({});
  await System.create({ shortName: "sys1", name: "S", userId });
});
test.after(async () => {
  console.error = origErr;
  await disconnect();
  fs.rmSync(tmp, { recursive: true, force: true });
});

async function seed() {
  await Talkgroup.deleteMany({});
  await Talkgroup.insertMany([
    { shortName: "sys1", num: 1, alpha: "old1", description: "Old One" },
    { shortName: "sys1", num: 2, alpha: "old2", description: "Old Two" },
    { shortName: "other", num: 9, alpha: "keep", description: "Other system" }
  ]);
}

let n = 0;
async function runImport(content) {
  const file = path.join(tmp, "up" + (n++));
  fs.writeFileSync(file, content);
  const res = fakeRes();
  const req = { params: { shortName: "SYS1" }, user, file: { path: file, size: Buffer.byteLength(content) } };
  await talkgroups.importTalkgroups(req, res, (e) => { throw e || new Error("next called"); });
  assert.strictEqual(res.sends.length, 1, "must respond exactly once");
  assert.ok(!fs.existsSync(file), "temp upload must be deleted");
  return res;
}
const oldIntact = async () => {
  const tgs = await Talkgroup.find({ shortName: "sys1" }).sort("num");
  assert.deepStrictEqual(tgs.map(t => t.num), [1, 2]);
  assert.strictEqual(await Talkgroup.countDocuments({ shortName: "other" }), 1);
};

test("import: UTF-8 BOM file succeeds and replaces the old set", async () => {
  await seed();
  const res = await runImport("﻿Decimal,Alpha Tag,Description,Priority\r\n100,FireDisp,Fire Dispatch,3\r\n101,PD,\"Police, Main\",\r\n");
  assert.strictEqual(res.sends[0].status, 200);
  assert.deepStrictEqual(res.body.map(t => t.num), [100, 101]);
  assert.strictEqual(res.body[0].alpha, "firedisp");
  assert.strictEqual(res.body[1].description, "Police, Main");
  const tgs = await Talkgroup.find({ shortName: "sys1" }).sort("num");
  assert.deepStrictEqual(tgs.map(t => t.num), [100, 101]);
  assert.strictEqual(tgs[0].priority, 3);
  assert.strictEqual(await Talkgroup.countDocuments({ shortName: "other" }), 1);
});

test("import: missing header leaves existing talkgroups intact", async () => {
  await seed();
  const res = await runImport("Decimal,Alpha Tag\n5,x\n");
  assert.strictEqual(res.sends[0].status, 400);
  assert.match(res.body, /Description/);
  await oldIntact();
});

test("import: non-numeric Decimal names the line and leaves data intact", async () => {
  await seed();
  const res = await runImport("Decimal,Alpha Tag,Description\n5,a,b\n6,a,b\n12abc,c,d\n");
  assert.strictEqual(res.sends[0].status, 400);
  assert.match(res.body, /line 4/);
  await oldIntact();
});

test("import: non-numeric Priority is rejected", async () => {
  await seed();
  const res = await runImport("Decimal,Alpha Tag,Description,Priority\n5,a,b,high\n");
  assert.strictEqual(res.sends[0].status, 400);
  assert.match(res.body, /Priority/);
  await oldIntact();
});

test("import: xlsx (PK zip) and NUL-byte files return the binary message", async () => {
  await seed();
  for (const content of [Buffer.concat([Buffer.from("PK\x03\x04"), Buffer.alloc(50, 1)]), Buffer.from("Decimal,Alpha\0Tag\n1,2\n")]) {
    const res = await runImport(content);
    assert.strictEqual(res.sends[0].status, 400);
    assert.match(res.body, /Excel or other binary file/);
  }
  await oldIntact();
});

test("import: unparseable CSV (stray quote) returns 400 with a line, nothing deleted", async () => {
  await seed();
  const res = await runImport('Decimal,Alpha Tag,Description\n5,a,"unterminated\n');
  assert.strictEqual(res.sends[0].status, 400);
  assert.match(res.body, /could not be read/);
  await oldIntact();
});

test("import: duplicate Decimals keep the first occurrence", async () => {
  await seed();
  const res = await runImport("Decimal,Alpha Tag,Description\n7,first,One\n8,x,y\n7,second,Two\n");
  assert.strictEqual(res.sends[0].status, 200);
  assert.strictEqual(res.body.length, 2);
  assert.strictEqual(res.headers["X-Talkgroups-Duplicates-Skipped"], "1");
  const tg = await Talkgroup.findOne({ shortName: "sys1", num: 7 });
  assert.strictEqual(tg.alpha, "first");
  assert.strictEqual(await Talkgroup.countDocuments({ shortName: "sys1", num: 7 }), 1);
});

test("import: wrong owner, unknown system and missing file respond once", async () => {
  await seed();
  let res = fakeRes();
  await talkgroups.importTalkgroups({ params: { shortName: "sys1" }, user: { _id: new mongoose.Types.ObjectId() }, file: { path: "x", size: 1 } }, res);
  assert.strictEqual(res.sends.length, 1); assert.strictEqual(res.sends[0].status, 401);
  res = fakeRes();
  await talkgroups.importTalkgroups({ params: { shortName: "nope" }, user }, res);
  assert.strictEqual(res.sends.length, 1); assert.strictEqual(res.sends[0].status, 404);
  res = fakeRes();
  await talkgroups.importTalkgroups({ params: { shortName: "sys1" }, user }, res);
  assert.strictEqual(res.sends.length, 1); assert.strictEqual(res.sends[0].status, 400);
  await oldIntact();
});

test("export quotes commas and quotes per RFC 4180", async () => {
  assert.strictEqual(csvField('a,b'), '"a,b"');
  assert.strictEqual(csvField('say "hi"'), '"say ""hi"""');
  assert.strictEqual(csvField("plain"), "plain");
  await Talkgroup.deleteMany({});
  await Talkgroup.create({ shortName: "sys1", num: 3, alpha: "a", description: 'Fire, "Main"', priority: 2 });
  const res = fakeRes();
  await talkgroups.exportTalkgroups({ params: { shortName: "sys1" }, user }, res);
  assert.strictEqual(res.sends.length, 1);
  assert.strictEqual(res.body, 'Decimal,Alpha Tag,Description,Priority\r\n3,a,"Fire, ""Main""",2\r\n');
});

test("groups: invalid ObjectId returns 4xx instead of throwing", async () => {
  const base = { params: { shortName: "sys1", groupId: "bad" }, user, body: {} };
  for (const fn of ["getGroups", "deleteGroup", "upsertGroup"]) {
    const res = fakeRes();
    const body = fn === "upsertGroup" ? { groupName: "G", talkgroups: "[1]" } : {};
    await groups[fn](Object.assign({}, base, { body }), res);
    assert.strictEqual(res.sends.length, 1, fn);
    assert.ok(res.sends[0].status >= 400 && res.sends[0].status < 500, fn + " " + res.sends[0].status);
  }
  const res = fakeRes();
  await groups.reorderGroups({ params: { shortName: "sys1" }, user, body: { groupOrder: '["bad"]' } }, res);
  assert.strictEqual(res.sends[0].status, 400);
});

test("groups: bad JSON / missing groupName return 400, valid create/reorder/delete work", async () => {
  await Group.deleteMany({});
  let res = fakeRes();
  await groups.upsertGroup({ params: { shortName: "sys1" }, user, body: { talkgroups: "[1]" } }, res);
  assert.strictEqual(res.sends.length, 1); assert.strictEqual(res.sends[0].status, 400);
  res = fakeRes();
  await groups.upsertGroup({ params: { shortName: "sys1" }, user, body: { groupName: "G", talkgroups: "{not json" } }, res);
  assert.strictEqual(res.sends.length, 1);
  res = fakeRes();
  await groups.reorderGroups({ params: { shortName: "sys1" }, user, body: { groupOrder: "{nope" } }, res);
  assert.strictEqual(res.sends[0].status, 400);

  res = fakeRes();
  await groups.upsertGroup({ params: { shortName: "sys1" }, user, body: { groupName: "Fire!", talkgroups: "[1,2]" } }, res);
  assert.strictEqual(res.sends.length, 1);
  assert.strictEqual(res.body.groupName, "Fire");
  const id = String(res.body._id);
  res = fakeRes();
  await groups.reorderGroups({ params: { shortName: "sys1" }, user, body: { groupOrder: JSON.stringify([id]) } }, res);
  assert.deepStrictEqual(res.body, { success: true });
  res = fakeRes();
  await groups.reorderGroups({ params: { shortName: "sys1" }, user, body: { groupOrder: JSON.stringify([String(new mongoose.Types.ObjectId())]) } }, res);
  assert.strictEqual(res.sends.length, 1); assert.strictEqual(res.sends[0].status, 404);
  res = fakeRes();
  await groups.deleteGroup({ params: { shortName: "sys1", groupId: id }, user }, res);
  assert.deepStrictEqual(res.body, { success: true });
  assert.strictEqual(await Group.countDocuments({}), 0);
});

test("systems: validateSystem rejects wrong types with 400 and a message; uniqueShortName/delete respond once", async () => {
  const good = { name: "Sys", description: "Desc", shortName: "abc", systemType: "state", state: "OH" };
  const check = async (fn, body, expectStatus) => {
    const res = fakeRes();
    let nexted = false;
    await systemsCtl[fn]({ body, user, params: { shortName: "sys1" } }, res, () => { nexted = true; });
    return { res, nexted };
  };
  let r = await check("validateSystem", Object.assign({}, good, { state: 5 }));
  assert.strictEqual(r.res.sends[0].status, 400); assert.strictEqual(typeof r.res.body.message, "string"); assert.ok(!r.nexted);
  r = await check("validateSystem", Object.assign({}, good, { showScreenName: "maybe" }));
  assert.strictEqual(r.res.sends[0].status, 400);
  r = await check("validateSystem", Object.assign({}, good, { allowContact: { a: 1 } }));
  assert.strictEqual(r.res.sends[0].status, 400);
  r = await check("validateSystem", good);
  assert.strictEqual(r.res.sends.length, 0); assert.ok(r.nexted);
  r = await check("uniqueShortName", {});
  assert.strictEqual(r.res.sends.length, 1); assert.strictEqual(r.res.sends[0].status, 400);
  r = await check("uniqueShortName", { shortName: 12 });
  assert.strictEqual(r.res.sends.length, 1);
  r = await check("uniqueShortName", { shortName: "sys1" });
  assert.strictEqual(r.res.sends.length, 1); assert.ok(!r.nexted);
  // deleting someone else's system: 401, once
  const res = fakeRes();
  await systemsCtl.deleteSystem({ params: { shortName: "sys1" }, user: { _id: new mongoose.Types.ObjectId() } }, res);
  assert.strictEqual(res.sends.length, 1); assert.strictEqual(res.sends[0].status, 401);
});

test("systems: listActiveUsers tolerates a system whose user was deleted", async () => {
  await System.create({ shortName: "orphan", name: "O", userId: new mongoose.Types.ObjectId(), lastActive: new Date() });
  require("../models/user");
  const res = fakeRes();
  await systemsCtl.listActiveUsers({ user: { admin: true } }, res);
  assert.strictEqual(res.sends.length, 1);
  assert.ok(Array.isArray(res.body));
});
