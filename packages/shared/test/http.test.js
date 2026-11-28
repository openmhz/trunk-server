// Run with: npm test --workspace @openmhz/shared   (no database needed)
const test = require("node:test");
const assert = require("node:assert");
const { siteUrls, firstPartyOrigins, cors, isVercelOrigin, rateLimitedOriginLog, sessionOptions, ALLOW_HEADERS } = require("..");

function run(mw, headers) {
  const res = {
    headers: {}, statusCode: 200, body: undefined,
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    status(c) { this.statusCode = c; return this; },
    send(b) { this.body = b; return this; },
  };
  let nexted = false;
  mw({ headers, originalUrl: "/x" }, res, () => { nexted = true; });
  return { res, nexted };
}

test("siteUrls defaults to production and follows REACT_APP_*", () => {
  assert.deepStrictEqual(siteUrls({}), {
    backend: "https://api.openmhz.com", frontend: "https://openmhz.com", account: "https://account.openmhz.com",
    admin: "https://admin.openmhz.com", cookieDomain: ".openmhz.com",
  });
  assert.strictEqual(siteUrls({ REACT_APP_ADMIN_SERVER: "http://admin.openmhz.test" }).admin, "http://admin.openmhz.test");
});

test("first-party origins cover every site, www and the dev server", () => {
  const prod = firstPartyOrigins(siteUrls({}));
  for (const o of ["https://openmhz.com", "https://www.openmhz.com", "https://api.openmhz.com", "https://account.openmhz.com", "https://admin.openmhz.com", "https://openmhz.com:3000"]) {
    assert.ok(prod.has(o), o);
  }
  assert.ok(!prod.has("http://openmhz.com"), "scheme must match");
  assert.ok(!prod.has("https://evil.com"));
  // The test stack's dev servers, which used to be hard-coded.
  const testEnv = firstPartyOrigins(siteUrls({ REACT_APP_ADMIN_SERVER: "http://admin.openmhz.test", REACT_APP_ACCOUNT_SERVER: "http://account.openmhz.test" }));
  assert.ok(testEnv.has("http://admin.openmhz.test:3000") && testEnv.has("http://account.openmhz.test:3000"));
});

test("CORS: first-party origin gets itself back, with the same headers as before", () => {
  const { res, nexted } = run(cors({ logUnknown: () => {} }), { origin: "https://admin.openmhz.com" });
  assert.ok(nexted);
  assert.deepStrictEqual(res.headers, {
    "access-control-allow-origin": "https://admin.openmhz.com",
    "access-control-allow-methods": "GET,PUT,POST,DELETE,OPTIONS,WEBSOCKET",
    "access-control-allow-credentials": "true",
    "access-control-allow-headers": ALLOW_HEADERS,
    "access-control-max-age": "600",
  });
});

test("CORS: other origins, no origin and the recorder get *", () => {
  const logged = [];
  const mw = cors({ logUnknown: (o) => logged.push(o) });
  assert.strictEqual(run(mw, { origin: "https://someones-scanner.app" }).res.headers["access-control-allow-origin"], "*");
  assert.strictEqual(run(mw, {}).res.headers["access-control-allow-origin"], "*");
  assert.strictEqual(run(mw, { origin: "x", "user-agent": "TrunkRecorder1.0" }).res.headers["access-control-allow-origin"], "*");
  assert.deepStrictEqual(logged, ["https://someones-scanner.app"], "only a real unknown origin is logged");
});

test("CORS: a blocked origin gets 403 and stops", () => {
  const { res, nexted } = run(cors({ blockOrigin: isVercelOrigin, logUnknown: () => {} }), { origin: "https://copy.vercel.app" });
  assert.strictEqual(res.statusCode, 403);
  assert.strictEqual(nexted, false);
  assert.strictEqual(run(cors({ blockOrigin: isVercelOrigin, logUnknown: () => {} }), { origin: "https://openmhz.com" }).nexted, true);
});

test("unknown-origin log: once per origin per hour, then a count", () => {
  let t = 0;
  const lines = [];
  const log = rateLimitedOriginLog({ log: (l) => lines.push(l), now: () => t });
  for (let i = 0; i < 5; i++) log("https://a.example", { originalUrl: "/x" });
  log("https://b.example", { originalUrl: "/y" });
  t = 61 * 60 * 1000;
  log("https://a.example", { originalUrl: "/x" });
  assert.strictEqual(lines.length, 3);
  assert.match(lines[2], /4 more requests/);
});

test("sessionOptions keep the cookie settings login depends on", () => {
  const MongoStore = { create: (o) => ({ store: o }) };
  const s = sessionOptions({ secret: "s", mongoUrl: "mongodb://m/scanner", cookieDomain: ".openmhz.com", MongoStore });
  assert.deepStrictEqual(s.cookie, { httpOnly: true, secure: false, domain: ".openmhz.com" });
  assert.strictEqual(s.name, "sessionId");
  assert.strictEqual(s.proxy, true);
  assert.strictEqual(s.store.store.mongoUrl, "mongodb://m/scanner");
});
