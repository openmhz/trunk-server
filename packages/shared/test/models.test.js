// Run with: npm test --workspace @openmhz/shared
// Needs a throwaway Mongo (TEST_MONGO_URL, default mongodb://127.0.0.1:27117/...),
// e.g.  docker run -d --rm -p 27117:27017 mongo:8
//
// The apps run different mongoose versions, so every schema is exercised with
// each app's own mongoose.
const test = require("node:test");
const assert = require("node:assert");
const path = require("node:path");
const { userSchema, systemSchema, talkgroupSchema, groupSchema, getModel } = require("..");

const repo = path.join(__dirname, "..", "..", "..");
const BASE = process.env.TEST_MONGO_URL || "mongodb://127.0.0.1:27117/shared_models_test";

function mongooseOf(app) {
  return require(require.resolve("mongoose", { paths: [path.join(repo, app)] }));
}

for (const app of ["backend", "account", "admin"]) {
  test(`schemas work with ${app}'s mongoose`, async (t) => {
    const mongoose = mongooseOf(app);
    // A connection of our own, so tests don't share mongoose's default one.
    const conn = mongoose.createConnection(`${BASE}_${app}_${process.pid}`, { autoIndex: false });
    await conn.asPromise();
    t.after(async () => { await conn.dropDatabase(); await conn.close(); });

    await t.test(`mongoose ${mongoose.version}: user without a hasher refuses to save a password`, async () => {
      const User = getModel(conn, "User", () => userSchema(mongoose));
      const u = new User({ email: "a@x.com", screenName: "MixedCase", password: "secret12" });
      await assert.rejects(u.save(), /only be changed by the account app/);
      // Other fields still save, with the defaults the apps relied on.
      const ok = await new User({ email: "b@x.com", screenName: "Bob" }).save();
      assert.strictEqual(ok.screenName, "bob", "screen names are lowercased");
      assert.strictEqual(ok.confirmEmail, false);
      assert.strictEqual(ok.terms, 0);
      assert.strictEqual(ok.ver, 1.1);
      assert.strictEqual(ok.email, "b@x.com");
    });

    await t.test(`mongoose ${mongoose.version}: user with a hasher hashes into both fields`, async () => {
      const Hashed = conn.model("HashedUser", userSchema(mongoose, { hashPassword: (p) => "hashed:" + p }), "users");
      const u = await new Hashed({ email: "c@x.com", password: "pw" }).save();
      assert.strictEqual(u.password, "hashed:pw");
      assert.strictEqual(u.local.password, "hashed:pw");
      u.firstName = "C";
      await u.save();
      assert.strictEqual(u.password, "hashed:pw", "an unchanged password is not hashed again");
    });

    await t.test(`mongoose ${mongoose.version}: system, talkgroup and group`, async () => {
      const System = getModel(conn, "System", () => systemSchema(mongoose));
      const s = await new System({ shortName: "sys", userId: new mongoose.Types.ObjectId(), callAvg: 2 }).save();
      assert.strictEqual(s.allowContact, true);
      assert.strictEqual(s.active, false);
      assert.strictEqual(s.callAvg, 2);
      const Talkgroup = getModel(conn, "Talkgroup", () => talkgroupSchema(mongoose));
      assert.strictEqual((await new Talkgroup({ shortName: "sys", num: "101", priority: 2 }).save()).num, 101);
      const Group = getModel(conn, "Group", () => groupSchema(mongoose));
      assert.deepStrictEqual([...(await new Group({ shortName: "sys", talkgroups: ["1", 2] }).save()).talkgroups], [1, 2]);
    });

    await t.test(`mongoose ${mongoose.version}: getModel registers once`, () => {
      const a = getModel(conn, "Group", () => groupSchema(mongoose));
      const b = getModel(conn, "Group", () => { throw new Error("should not rebuild"); });
      assert.strictEqual(a, b);
    });
  });
}

test("each app's model files load and share one schema shape", () => {
  const fields = (schema) => Object.keys(schema.paths).filter((p) => p !== "__v").sort();
  const shapes = {};
  for (const [file, name] of [
    ["backend/models/user.js", "User"], ["admin/server/models/user.js", "User"], ["account/server/models/user.js", "User"],
    ["backend/models/system.js", "System"], ["admin/server/models/system.js", "System"],
    ["backend/models/talkgroup.js", "Talkgroup"], ["admin/server/models/talkgroup.js", "Talkgroup"],
    ["backend/models/group.js", "Group"], ["admin/server/models/group.js", "Group"],
  ]) {
    const Model = require(path.join(repo, file));
    assert.strictEqual(Model.modelName, name, file);
    (shapes[name] = shapes[name] || []).push(fields(Model.schema).join(","));
  }
  for (const [name, list] of Object.entries(shapes)) {
    assert.strictEqual(new Set(list).size, 1, `${name} has the same fields in every app`);
  }
});
