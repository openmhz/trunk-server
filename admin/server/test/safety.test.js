const test = require("node:test");
const assert = require("node:assert");
const http = require("node:http");
const express = require("express");
const { wrap, errorHandler } = require("@openmhz/shared");

test("wrap + errorHandler turn a thrown async error into a single 500", async () => {
  const app = express();
  app.get("/boom", wrap(async (req, res) => {
    res.locals.x = 1;
    throw new Error("secret detail");
  }));
  app.get("/sync", wrap(() => { throw new Error("sync secret"); }));
  app.use(errorHandler);
  const origErr = console.error;
  console.error = () => {};
  const server = http.createServer(app);
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  try {
    const base = "http://127.0.0.1:" + server.address().port;
    for (const path of ["/boom", "/sync"]) {
      const r = await fetch(base + path);
      assert.strictEqual(r.status, 500);
      const text = await r.text();
      assert.deepStrictEqual(JSON.parse(text), { success: false, message: "Internal server error" });
      assert.ok(!text.includes("secret"));
    }
  } finally {
    console.error = origErr;
    server.close();
  }
});

test("errorHandler does not respond again when headers already sent", () => {
  const origErr = console.error;
  console.error = () => {};
  let nextErr;
  const res = { headersSent: true, status() { throw new Error("must not respond"); } };
  errorHandler(new Error("x"), { method: "GET", originalUrl: "/" }, res, (e) => { nextErr = e; });
  console.error = origErr;
  assert.ok(nextErr);
});
