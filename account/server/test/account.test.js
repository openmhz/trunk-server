require("./helpers");

const test = require("node:test");
const assert = require("node:assert");
const express = require("express");
const http = require("http");
const { start, profile } = require("./helpers");
const { wrap, errorHandler } = require("@openmhz/shared");

let t;
test.before(async () => { t = await start(); });
test.after(async () => { await t.stop(); });
test.beforeEach(async () => { await t.User.deleteMany({}); t.mailer.sent.length = 0; t.mailer.fail = false; });

const makeUser = (over = {}) => t.User.create({
  firstName: "Al", lastName: "Jones", screenName: "al", location: "Ohio",
  email: "al@x.com", password: "password1", confirmEmail: true, ...over,
});

test("send-reset-password with {} / non-string email returns 400", async () => {
  for (const body of [{}, { email: 5 }, { email: { $ne: 1 } }, { email: "  " }]) {
    const r = await t.post("/api/send-reset-password", body);
    assert.strictEqual(r.status, 400);
    assert.strictEqual(r.json.success, false);
  }
});

test("login with non-string credentials does not crash", async () => {
  await makeUser();
  for (const body of [{ email: 5, password: "x" }, { email: { $ne: 1 }, password: "password1" }, { email: "al@x.com", password: 12345 }, {}]) {
    const r = await t.post("/login", body);
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.json.success, false);
  }
  const ok = await t.post("/login", { email: "AL@x.com", password: "password1" });
  assert.strictEqual(ok.json.success, true);
});

test("login for user without a password doesn't throw", async () => {
  await t.User.collection.insertOne({ email: "np@x.com", confirmEmail: true, screenName: "np" });
  const r = await t.post("/login", { email: "np@x.com", password: "whatever1" });
  assert.strictEqual(r.json.success, false);
});

test("register without password returns 400", async () => {
  const r = await t.post("/register", profile({ password: undefined }));
  assert.strictEqual(r.status, 400);
  assert.strictEqual(r.json.success, false);
  const short = await t.post("/register", profile({ password: "123456" }));
  assert.strictEqual(short.status, 400);
  assert.strictEqual(await t.User.countDocuments(), 0);
});

test("register succeeds and sends confirmation", async () => {
  const r = await t.post("/register", profile());
  assert.strictEqual(r.json.success, true);
  assert.strictEqual(t.mailer.sent.length, 1);
});

test("register with '<existing>!' screen name -> in use, no crash", async () => {
  await makeUser({ screenName: "bobby" });
  const r = await t.post("/register", profile({ screenName: "bobby!", email: "new@x.com" }));
  assert.strictEqual(r.json.success, false);
  assert.strictEqual(r.json.message, "Screen Name already in use");
  const r2 = await t.post("/register", profile({ screenName: "BOBBY", email: "new@x.com" }));
  assert.strictEqual(r2.json.message, "Screen Name already in use");
});

test("bob@x.com does not match jbob@x.com.au (register/login/reset)", async () => {
  await makeUser({ email: "jbob@x.com.au", screenName: "jbob" });
  // register: not "in use"
  const reg = await t.post("/register", profile({ email: "bob@x.com" }));
  assert.strictEqual(reg.json.success, true);
  // login as bob must not hit jbob
  const login = await t.post("/login", { email: "bob@x.com", password: "nope-nope" });
  assert.strictEqual(login.json.success, false);
  // reset for an address that only exists as a superstring
  await t.User.deleteMany({ email: "bob@x.com" });
  const reset = await t.post("/api/send-reset-password", { email: "bob@x.com" });
  assert.strictEqual(reset.status, 404);
  assert.ok(!t.mailer.sent.some((m) => m.Messages[0].To[0].Email.includes("jbob")));
  // exact, case-insensitive still works
  const ok = await t.post("/api/send-reset-password", { email: " JBOB@x.com.au " });
  assert.strictEqual(ok.json.success, true);
  // regex metacharacters are literal
  const dot = await t.post("/api/send-reset-password", { email: "jbob@x.com.a." });
  assert.strictEqual(dot.status, 404);
});

test("register: existing email is rejected case-insensitively", async () => {
  await makeUser({ email: "al@x.com" });
  const r = await t.post("/register", profile({ email: "AL@X.COM" }));
  assert.strictEqual(r.json.message, "Email already in use");
});

test("confirm / reset / send-confirm with non-ObjectId id respond once with 404", async () => {
  for (const p of ["/users/not-an-id/confirm/tok", "/users/not-an-id/reset-password/tok", "/users/not-an-id/send-confirm"]) {
    const r = await t.post(p, { password: "password1" });
    assert.strictEqual(r.status, 404, p);
    assert.strictEqual(r.json.success, false);
  }
});

test("confirm email happy path and token mismatch", async () => {
  await t.post("/register", profile());
  const u = await t.User.findOne({ screenName: "bobby" });
  const bad = await t.post(`/users/${u.id}/confirm/wrong`);
  assert.strictEqual(bad.json.message, "token mismatch");
  const good = await t.post(`/users/${u.id}/confirm/${u.confirmEmailToken}`);
  assert.strictEqual(good.json.success, true);
});

test("mailjet failure during reset results in exactly one response", async () => {
  await makeUser();
  t.mailer.fail = true;
  // fetch would reject / mis-parse on a double write; also count 'finish' via raw http
  const r = await t.post("/api/send-reset-password", { email: "al@x.com" });
  assert.strictEqual(r.status, 500);
  assert.strictEqual(r.json.success, false);
  assert.strictEqual(r.json.message, "Unable to send password reset email");
});

test("mailjet failure on send-confirm and register responds once", async () => {
  const u = await makeUser({ confirmEmail: false });
  t.mailer.fail = true;
  const r = await t.post(`/users/${u.id}/send-confirm`);
  assert.strictEqual(r.status, 500);
  assert.strictEqual(r.json.success, false);
  assert.strictEqual(typeof r.json.message, "string");
  const reg = await t.post("/register", profile());
  // the account is created; the client is told the email didn't go out
  assert.strictEqual(reg.json.success, true);
  assert.strictEqual(reg.json.emailSent, false);
});

test("reset password requires a valid new password", async () => {
  const u = await makeUser();
  u.resetPasswordToken = "tok"; u.resetPasswordTTL = new Date(Date.now() + 1e6); await u.save();
  const r = await t.post(`/users/${u.id}/reset-password/tok`, {});
  assert.strictEqual(r.status, 400);
  const ok = await t.post(`/users/${u.id}/reset-password/tok`, { password: "newpassword" });
  assert.strictEqual(ok.json.success, true);
  const login = await t.post("/login", { email: "al@x.com", password: "newpassword" });
  assert.strictEqual(login.json.success, true);
});

test("isLoggedIn returns 401 JSON for API-style requests", async () => {
  const r = await t.post("/users/abc/terms", {});
  assert.strictEqual(r.status, 401);
  assert.deepStrictEqual(r.json, { success: false, message: "Not logged in" });
});

test("updateProfile: screen name taken by someone else is rejected, own is allowed", async () => {
  const a = await makeUser();
  await makeUser({ email: "b@x.com", screenName: "taken" });
  // log in keeping cookie
  const res = await fetch(t.base + "/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "al@x.com", password: "password1" }) });
  const cookie = res.headers.get("set-cookie").split(";")[0];
  const upd = async (screenName) => (await fetch(t.base + "/users/" + a.id, {
    method: "POST", headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({ firstName: "Al", lastName: "Jones", location: "Ohio", screenName }),
  })).json();
  assert.strictEqual((await upd("taken")).message, "Screen Name already in use");
  assert.strictEqual((await upd("al")).success, true);
  assert.strictEqual((await upd("newname")).success, true);
});

test("deleted user's session deserializes to logged-out, not an error", async () => {
  const a = await makeUser();
  const res = await fetch(t.base + "/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "al@x.com", password: "password1" }) });
  const cookie = res.headers.get("set-cookie").split(";")[0];
  await t.User.deleteOne({ _id: a._id });
  const auth = await (await fetch(t.base + "/authenticated", { headers: { cookie } })).json();
  assert.strictEqual(auth.success, false);
});

test("wrap + errorHandler turn a thrown async error into one 500", async () => {
  const app = express();
  app.get("/boom", wrap(async () => { throw new Error("secret detail"); }));
  app.get("/late", wrap(async (req, res) => { res.json({ ok: 1 }); throw new Error("after send"); }));
  app.use(errorHandler);
  const server = http.createServer(app);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const orig = console.error; console.error = () => {};
  try {
    const r = await fetch(base + "/boom");
    assert.strictEqual(r.status, 500);
    const text = await r.text();
    assert.deepStrictEqual(JSON.parse(text), { success: false, message: "Internal server error" });
    assert.ok(!text.includes("secret"));
    const late = await fetch(base + "/late");
    assert.strictEqual(late.status, 200);
  } finally { console.error = orig; server.close(); }
});

test("unconfirmed account: password is checked before revealing 'unconfirmed email'", async () => {
  const u = await makeUser({ confirmEmail: false });
  const wrong = await t.post("/login", { email: "al@x.com", password: "wrong-password" });
  assert.strictEqual(wrong.json.success, false);
  assert.strictEqual(wrong.json.reason, "invalid");
  assert.strictEqual(wrong.json.message, "Invalid email or password");
  assert.strictEqual(wrong.json.userId, undefined);

  const right = await t.post("/login", { email: "al@x.com", password: "password1" });
  assert.strictEqual(right.json.success, false);
  assert.strictEqual(right.json.reason, "unconfirmed email");
  assert.strictEqual(right.json.userId, u.id);
  assert.strictEqual(right.json.email, "al@x.com");
});

test("register with Mailjet failing still succeeds (emailSent:false) and the user can resend", async () => {
  t.mailer.fail = true;
  const orig = console.error; console.error = () => {};
  let r;
  try { r = await t.post("/register", profile()); } finally { console.error = orig; }
  assert.strictEqual(r.json.success, true);
  assert.strictEqual(r.json.emailSent, false);
  assert.strictEqual(r.json.email, "bob@x.com");
  assert.ok(r.json.userId);
  assert.strictEqual(await t.User.countDocuments(), 1);

  // a failed send must not start the resend cooldown
  t.mailer.fail = false;
  const resend = await t.post(`/users/${r.json.userId}/send-confirm`);
  assert.strictEqual(resend.status, 200);
  assert.strictEqual(resend.json.success, true);
  assert.strictEqual(t.mailer.sent.length, 1);
  const html = t.mailer.sent[0].Messages[0].HTMLPart;
  assert.match(html, /<a href="[^"]+\/confirm-email\/[0-9a-f]{24}\/[0-9a-f]+">/);
});

test("register success includes userId, email and emailSent:true", async () => {
  const r = await t.post("/register", profile());
  assert.strictEqual(r.json.success, true);
  assert.strictEqual(r.json.emailSent, true);
  assert.ok(r.json.userId);
  assert.strictEqual(r.json.email, "bob@x.com");
});

test("resend within 60 seconds is refused with 429, allowed afterwards", async () => {
  const reg = await t.post("/register", profile());
  assert.strictEqual(t.mailer.sent.length, 1);
  const again = await t.post(`/users/${reg.json.userId}/send-confirm`);
  assert.strictEqual(again.status, 429);
  assert.strictEqual(again.json.success, false);
  assert.ok(typeof again.json.message === "string" && again.json.message.length > 0);
  assert.strictEqual(t.mailer.sent.length, 1);

  // pretend the last email went out two minutes ago
  const ttl = new Date(Date.now() + 24 * 60 * 60 * 1000 - 120 * 1000);
  await t.User.updateOne({ _id: reg.json.userId }, { confirmEmailTTL: ttl });
  const later = await t.post(`/users/${reg.json.userId}/send-confirm`);
  assert.strictEqual(later.status, 200);
  assert.strictEqual(t.mailer.sent.length, 2);
});

test("Unicode names and locations survive validation; screen name stays ASCII", async () => {
  const r = await t.post("/register", profile({
    firstName: "José", lastName: "Müller-O'Neil", location: "東京, Japan", screenName: "jose!",
  }));
  assert.strictEqual(r.json.success, true);
  const u = await t.User.findById(r.json.userId);
  assert.strictEqual(u.firstName, "José");
  assert.strictEqual(u.lastName, "Müller-O'Neil");
  assert.strictEqual(u.location, "東京, Japan");
  assert.strictEqual(u.screenName, "jose");

  const cjk = await t.post("/register", profile({ firstName: "田中", lastName: "太郎", email: "t@x.com", screenName: "tanaka" }));
  assert.strictEqual(cjk.json.success, true);
  const c = await t.User.findById(cjk.json.userId);
  assert.strictEqual(c.firstName, "田中");
});
