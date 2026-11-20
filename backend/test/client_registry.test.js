// Run with: node --test test/client_registry.test.js
//
// Drives the registry through random socket lifecycles (connect, start with
// each filter type, re-start on another system, stop, disconnect) and checks
// that every upload reaches exactly the sockets the old full-scan
// notify_clients would have chosen, and that per-system counts match.

const test = require("node:test");
const assert = require("node:assert");

// The old implementation, kept verbatim as the reference.
function oldNotify(clients, call, message) {
  var sent = 0;
  for (var key in clients) {
    if (clients.hasOwnProperty(key)) {
      var client = clients[key];
      if (client.active) {
        if ((client.firehose == true) || (client.shortName == call.shortName.toLowerCase())) {
          if ((client.firehose == true) || (client.filterType == "all")) {
            sent++;
            client.socket.emit("new message", message);
          } else if (client.filterType == "unit") {
            var codeArray = client.filterCode.split(',');
            var success = false;
            for (var j = 0; j < codeArray.length; ++j) {
              for (var k = 0; k < call.srcList.length; k++) {
                if (codeArray[j] == call.srcList[k]) {
                  sent++;
                  client.socket.emit("new message", message);
                  success = true;
                  break;
                }
              }
              if (success) break;
            }
          } else {
            var codeArray = client.talkgroupNums;
            for (var j = 0; j < codeArray.length; ++j) {
              if (codeArray[j] == call.talkgroupNum) {
                client.socket.emit("new message", message);
                sent++;
                break;
              }
            }
          }
        }
      }
    }
  }
  return sent;
}

function oldSystemCounts(clients) {
  var systemClients = {};
  for (var key in clients) {
    const client = clients[key];
    // Firehose clients are no longer counted against a system.
    if (client.active && !client.firehose) {
      systemClients[client.shortName] = (systemClients[client.shortName] || 0) + 1;
    }
  }
  return systemClients;
}

// Small deterministic PRNG so failures are reproducible.
function rng(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

test("registry delivers to the same sockets as the old full scan", () => {
  const registry = require("../client_registry");
  const rand = rng(42);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const systems = ["nhpd", "dcfd", "bcem", "risconn", "Mixed"];
  const tgs = [1, 2, 3, 21, 22, "21"];
  const units = ["100", "200", "300"];

  const old = {};          // the reference model: old-style clients object
  const received = new Map(); // socket id -> count, filled by the registry's emits
  const ids = [];
  let next = 0;

  const connect = () => {
    const id = "s" + next++;
    const socket = { id, emit: () => received.set(id, (received.get(id) || 0) + 1) };
    registry.add(id, socket);
    old[id] = { socket: { emit() {} }, active: false };
    ids.push(id);
  };

  // Mirrors a successful 'start' as index.js applies it.
  const start = (id) => {
    const entry = registry.get(id);
    registry.unindex(entry);
    const filterType = pick(["all", "talkgroup", "group", "unit", "firehose"]);
    const fields = {
      active: true,
      shortName: pick(systems).toLowerCase(),
      filterType,
      filterCode: filterType === "unit" ? pick(units) + "," + pick(units) : "",
      talkgroupNums: filterType === "talkgroup" || filterType === "group" ? [pick(tgs), pick(tgs)] : [],
      firehose: filterType === "firehose" && rand() < 0.5,
    };
    Object.assign(entry, fields);
    Object.assign(old[id], fields);
    registry.index(entry);
  };

  const stop = (id) => {
    const entry = registry.get(id);
    entry.active = false;
    registry.unindex(entry);
    old[id].active = false;
  };

  const disconnect = (id) => {
    registry.remove(id);
    delete old[id];
    ids.splice(ids.indexOf(id), 1);
  };

  for (let i = 0; i < 300; i++) connect();

  for (let step = 0; step < 5000; step++) {
    const r = rand();
    if (r < 0.15 || ids.length === 0) connect();
    else if (r < 0.45) start(pick(ids));
    else if (r < 0.55) stop(pick(ids));
    else if (r < 0.65) disconnect(pick(ids));
    else {
      const call = {
        shortName: pick(systems).toUpperCase(),
        talkgroupNum: pick(tgs),
        srcList: [pick(units), pick(units)],
      };
      // Which sockets should get it, per the old code.
      const expected = new Set();
      for (const id of Object.keys(old)) {
        old[id].socket.emit = () => expected.add(id);
      }
      const oldSent = oldNotify(old, call, "m");

      received.clear();
      const newSent = registry.notify(call, "m");

      assert.strictEqual(newSent, oldSent, `sent count differs at step ${step}`);
      assert.deepStrictEqual(new Set(received.keys()), expected, `recipients differ at step ${step}`);
      for (const n of received.values()) assert.strictEqual(n, 1, "a socket got the call twice");
    }

    if (step % 250 === 0) {
      assert.deepStrictEqual(registry.systemCounts(), oldSystemCounts(old), `counts differ at step ${step}`);
      assert.strictEqual(registry.size(), Object.keys(old).length);
    }
  }

  // Draining every socket leaves no empty per-system sets behind.
  for (const id of [...ids]) disconnect(id);
  assert.deepStrictEqual(registry.systemCounts(), {});
  assert.strictEqual(registry.size(), 0);
});

// Two overlapping 'start' events (one waiting on its Group lookup) can each
// call index() without an unindex() in between. The entry must end up in
// exactly one place, under its latest fields.
test("index() moves an entry instead of duplicating it", () => {
  const registry = require("../client_registry");
  let got = 0;
  const entry = registry.add("race", { emit: () => got++ });
  Object.assign(entry, { active: true, shortName: "aaa", filterType: "all", talkgroupNums: [], firehose: false });
  registry.index(entry);
  entry.shortName = "bbb";
  registry.index(entry);
  registry.index(entry);

  assert.deepStrictEqual(registry.systemCounts(), { bbb: 1 });
  assert.strictEqual(registry.notify({ shortName: "AAA", talkgroupNum: 1, srcList: [] }, "m"), 0);
  assert.strictEqual(registry.notify({ shortName: "BBB", talkgroupNum: 1, srcList: [] }, "m"), 1);
  assert.strictEqual(got, 1);

  registry.remove("race");
  assert.deepStrictEqual(registry.systemCounts(), {});
});
