// OpenMHz database maintenance. Run through ../db.sh, which passes ARGS:
//
//   ./mongo/db.sh report                      read-only health report
//   ./mongo/db.sh indexes [--apply]           create the indexes the app needs
//   ./mongo/db.sh dedupe [--apply]            remove duplicate/orphaned talkgroups and groups
//   ./mongo/db.sh drop-leftovers [--apply]    drop collections nothing uses any more
//   ./mongo/db.sh remove-system <id> [--apply]  delete one duplicate system document
//   ./mongo/db.sh prune-inactive [--apply]    delete systems inactive for 6+ months
//   ./mongo/db.sh clean-calls [--apply]       delete calls older than the retention period
//
// Everything that writes is a dry run unless --apply is given, and every
// command is safe to run repeatedly.

/* global db, print, ObjectId, ARGS */

const args = (typeof ARGS !== "undefined" && ARGS) || {};
const CMD = args.cmd || "report";
const APPLY = args.apply === true;
const scanner = db.getSiblingDB("scanner");

// Calls are kept for one calendar month, the same as the backend's nightly job.
const INACTIVE_MONTHS = 6;
const LEFTOVER_COLLECTIONS = [
  "system_stats", // per-system admin stats, removed from the app; last written 2024-08
  "stats",        // not referenced by any code
  "test",         // not referenced by any code
  "frozencalls",  // FrozenCall model is only used as an embedded schema; always empty
];

// The indexes the application relies on. `unique` indexes are only built once
// the data has no duplicates; `replaces` names a non-unique index on the same
// key that must be dropped first (MongoDB won't hold two indexes on one key).
const INDEXES = [
  // Call lists by system, newest first; also used by the per-system cleanup.
  { coll: "calls", key: { shortName: 1, time: -1 } },
  // Call lists filtered by talkgroup or group.
  { coll: "calls", key: { shortName: 1, talkgroupNum: 1, time: -1 } },
  // Talkgroup lookups by system, and the per-upload check for systems that
  // ignore unknown talkgroups. Unique: a system can't have the same talkgroup twice.
  { coll: "talkgroups", key: { shortName: 1, num: 1 }, unique: true },
  { coll: "talkgroups", key: { shortName: 1 } },
  { coll: "groups", key: { shortName: 1 } },
  // Uploads find the system (and its API key) by shortName.
  { coll: "systems", key: { shortName: 1 }, unique: true, replaces: "shortName_1" },
  { coll: "systems", key: { userId: 1 } },
  { coll: "systems", key: { lastActive: 1 } },
  // Expired sessions are removed by MongoDB (connect-mongo also creates this).
  { coll: "sessions", key: { expires: 1 }, expireAfterSeconds: 0 },
];

function header(text) {
  print("\n== " + text);
}

function action(text) {
  print((APPLY ? "  APPLY  " : "  DRY-RUN ") + text);
}

function sameKey(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function existingIndex(coll, key) {
  // getIndexes() throws on a collection that doesn't exist yet (e.g. a new database).
  if (!scanner.getCollectionNames().includes(coll)) return undefined;
  return scanner.getCollection(coll).getIndexes().find((i) => sameKey(i.key, key));
}

// ---------------------------------------------------------------- duplicates

function duplicateSystems() {
  return scanner.systems.aggregate([
    { $group: { _id: "$shortName", docs: { $push: { _id: "$_id", userId: "$userId", name: "$name", lastActive: "$lastActive" } }, n: { $sum: 1 } } },
    { $match: { n: { $gt: 1 } } },
  ]).toArray();
}

function duplicateTalkgroups() {
  return scanner.talkgroups.aggregate([
    { $group: { _id: { shortName: "$shortName", num: "$num" }, ids: { $push: "$_id" }, n: { $sum: 1 } } },
    { $match: { n: { $gt: 1 } } },
  ], { allowDiskUse: true }).toArray();
}

function duplicateUsers(field) {
  return scanner.users.aggregate([
    { $match: { [field]: { $type: "string", $ne: "" } } },
    { $group: { _id: { $toLower: "$" + field }, ids: { $push: "$_id" }, n: { $sum: 1 } } },
    { $match: { n: { $gt: 1 } } },
  ]).toArray();
}

// shortNames that have talkgroups/groups but no system document.
function orphanShortNames(coll) {
  return scanner.getCollection(coll).aggregate([
    { $group: { _id: "$shortName" } },
    { $lookup: { from: "systems", localField: "_id", foreignField: "shortName", as: "s" } },
    { $match: { s: { $size: 0 } } },
  ]).toArray().map((d) => d._id);
}

// ---------------------------------------------------------------- commands

function report() {
  header("Collections");
  scanner.getCollectionNames().sort().forEach((name) => {
    if (name.startsWith("system.")) return;
    const s = scanner.getCollection(name).stats();
    const leftover = LEFTOVER_COLLECTIONS.includes(name) ? "  (leftover: drop-leftovers)" : "";
    print(`  ${name.padEnd(14)} docs=${String(s.count).padStart(10)}  data=${(s.size / 2 ** 20).toFixed(0)}MB  indexes=${(s.totalIndexSize / 2 ** 20).toFixed(0)}MB${leftover}`);
  });

  header("Indexes (wanted by the app)");
  INDEXES.forEach((want) => {
    const have = existingIndex(want.coll, want.key);
    let state = "missing";
    if (have) {
      state = (want.unique && !have.unique) ? "present but not unique" : "ok";
    }
    print(`  ${want.coll}.${JSON.stringify(want.key)}${want.unique ? " unique" : ""}: ${state}`);
  });

  header("Duplicate systems (same shortName) — need a decision; see remove-system");
  const dupSystems = duplicateSystems();
  if (dupSystems.length === 0) print("  none");
  dupSystems.forEach((d) => {
    print(`  ${d._id}:`);
    d.docs.forEach((doc) => {
      const owner = doc.userId ? scanner.users.findOne({ _id: doc.userId }, { email: 1 }) : null;
      print(`     ${doc._id}  owner=${owner ? owner.email : "(none)"}  name="${doc.name}"`);
    });
  });

  header("Duplicate talkgroups (same shortName + num) — fixed by dedupe");
  const dupTgs = duplicateTalkgroups();
  print(`  ${dupTgs.length} pairs, ${dupTgs.reduce((t, d) => t + d.n - 1, 0)} extra documents`);

  header("Orphans — fixed by dedupe");
  print(`  talkgroups for missing systems: ${orphanShortNames("talkgroups").join(", ") || "none"}`);
  print(`  groups for missing systems: ${orphanShortNames("groups").join(", ") || "none"}`);

  header("Duplicate users — need manual merging; not changed by any command");
  const emails = duplicateUsers("email");
  print(`  emails differing only by case: ${emails.length}`);
  emails.forEach((d) => {
    print(`     ${d._id}: ` + d.ids.map((id) => {
      const u = scanner.users.findOne({ _id: id }, { confirmEmail: 1 });
      return `${id} (confirmed=${u.confirmEmail}, systems=${scanner.systems.countDocuments({ userId: id })})`;
    }).join(", "));
  });
  print(`  screen names shared by several accounts: ${duplicateUsers("screenName").length}`);
  print(`  accounts without a screen name: ${scanner.users.countDocuments({ $or: [{ screenName: { $exists: false } }, { screenName: null }, { screenName: "" }] })}`);

  header("Retention");
  const oldest = scanner.calls.find({}, { time: 1 }).sort({ _id: 1 }).limit(1).toArray()[0];
  print(`  oldest call: ${oldest ? oldest.time.toISOString() : "none"} (retention: one month)`);
  const cutoff = new Date(Date.now() - INACTIVE_MONTHS * 30 * 864e5);
  print(`  systems inactive ${INACTIVE_MONTHS}+ months: ${scanner.systems.countDocuments({ $or: [{ lastActive: { $lt: cutoff } }, { lastActive: { $exists: false } }] })} (prune-inactive)`);
}

function indexes() {
  header("Indexes");
  const blockers = {
    systems: duplicateSystems().length,
    talkgroups: duplicateTalkgroups().length,
  };
  INDEXES.forEach((want) => {
    const coll = scanner.getCollection(want.coll);
    const label = `${want.coll}.${JSON.stringify(want.key)}${want.unique ? " unique" : ""}`;
    const have = existingIndex(want.coll, want.key);

    if (have && (!want.unique || have.unique)) {
      print(`  ok       ${label}`);
      return;
    }
    if (want.unique && blockers[want.coll]) {
      const fix = want.coll === "systems" ? "resolve them with remove-system (see report)" : "run dedupe first";
      print(`  SKIPPED  ${label}: ${blockers[want.coll]} duplicate(s) — ${fix}`);
      return;
    }
    const options = {};
    if (want.unique) options.unique = true;
    if (want.expireAfterSeconds !== undefined) options.expireAfterSeconds = want.expireAfterSeconds;

    if (have && want.unique && !have.unique) {
      action(`drop non-unique ${want.coll}.${have.name}, then build ${label}`);
      if (APPLY) {
        coll.dropIndex(have.name);
        coll.createIndex(want.key, options);
      }
      return;
    }
    action(`build ${label} (${coll.estimatedDocumentCount()} docs)`);
    if (APPLY) {
      coll.createIndex(want.key, options);
    }
  });
}

function dedupe() {
  header("Duplicate talkgroups: keep the oldest document of each (shortName, num)");
  const dups = duplicateTalkgroups();
  const remove = [];
  dups.forEach((d) => {
    const ids = d.ids.slice().sort((a, b) => (a.toString() < b.toString() ? -1 : 1));
    remove.push(...ids.slice(1));
  });
  action(`delete ${remove.length} duplicate talkgroups across ${dups.length} pairs`);
  if (APPLY && remove.length) {
    for (let i = 0; i < remove.length; i += 1000) {
      scanner.talkgroups.deleteMany({ _id: { $in: remove.slice(i, i + 1000) } });
    }
  }

  header("Talkgroups and groups whose system no longer exists");
  ["talkgroups", "groups"].forEach((coll) => {
    const names = orphanShortNames(coll);
    if (names.length === 0) {
      print(`  ${coll}: none`);
      return;
    }
    const n = scanner.getCollection(coll).countDocuments({ shortName: { $in: names } });
    action(`delete ${n} ${coll} for ${names.join(", ")}`);
    if (APPLY) {
      scanner.getCollection(coll).deleteMany({ shortName: { $in: names } });
    }
  });
  print("\n  Duplicate systems and users are not changed here; see report.");
}

function dropLeftovers() {
  header("Leftover collections");
  const present = scanner.getCollectionNames();
  LEFTOVER_COLLECTIONS.forEach((name) => {
    if (!present.includes(name)) {
      print(`  gone     ${name}`);
      return;
    }
    action(`drop ${name} (${scanner.getCollection(name).estimatedDocumentCount()} docs)`);
    if (APPLY) scanner.getCollection(name).drop();
  });
}

// Deletes one system document that shares its shortName with another. Its
// talkgroups and groups are keyed by shortName and shared with the copy that
// stays, so they are left alone.
function removeSystem() {
  header("Remove duplicate system");
  if (!args.id || !/^[0-9a-f]{24}$/.test(args.id)) {
    throw new Error("usage: remove-system <24-character system _id> [--apply]");
  }
  const sys = scanner.systems.findOne({ _id: ObjectId(args.id) });
  if (!sys) throw new Error("no system with _id " + args.id);
  const copies = scanner.systems.countDocuments({ shortName: sys.shortName });
  if (copies < 2) {
    throw new Error(`${sys.shortName} has only this one document; refusing (use the admin app to delete a system)`);
  }
  const owner = sys.userId ? scanner.users.findOne({ _id: sys.userId }, { email: 1 }) : null;
  action(`delete system ${sys._id} (${sys.shortName}, owner ${owner ? owner.email : "none"}); ${copies - 1} other document(s) with this shortName remain`);
  if (APPLY) scanner.systems.deleteOne({ _id: sys._id });
}

// Replaces remove_old_systems.js, which deleted talkgroups and groups by
// shortName even when another, active document had the same shortName.
function pruneInactive() {
  header(`Systems inactive for ${INACTIVE_MONTHS}+ months`);
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - INACTIVE_MONTHS);
  const inactive = scanner.systems.find({ $or: [{ lastActive: { $lt: cutoff } }, { lastActive: { $exists: false } }] }, { shortName: 1 }).toArray();
  const stillUsed = new Set(scanner.systems.distinct("shortName", { lastActive: { $gte: cutoff } }));
  const names = [...new Set(inactive.map((s) => s.shortName))].filter((n) => !stillUsed.has(n));
  print(`  inactive since ${cutoff.toISOString()}: ${inactive.length} system documents`);
  if (names.length) print("  " + names.join(", "));
  action(`delete ${inactive.length} systems, and talkgroups/groups for ${names.length} shortNames no active system uses`);
  if (APPLY) {
    scanner.systems.deleteMany({ _id: { $in: inactive.map((s) => s._id) } });
    scanner.talkgroups.deleteMany({ shortName: { $in: names } });
    scanner.groups.deleteMany({ shortName: { $in: names } });
  }
}

// One delete per system, so each uses the { shortName, time } index. A single
// deleteMany on time alone scanned the whole collection (64M documents, ~6 min).
function cleanCalls() {
  header("Calls older than one month");
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 1);
  let total = 0;
  scanner.calls.distinct("shortName").forEach((shortName) => {
    const filter = { shortName, time: { $lt: cutoff } };
    if (APPLY) {
      total += scanner.calls.deleteMany(filter).deletedCount;
    } else {
      total += scanner.calls.countDocuments(filter);
    }
  });
  action(`delete ${total} calls older than ${cutoff.toISOString()}`);
}

const COMMANDS = {
  report,
  indexes,
  dedupe,
  "drop-leftovers": dropLeftovers,
  "remove-system": removeSystem,
  "prune-inactive": pruneInactive,
  "clean-calls": cleanCalls,
};

if (!COMMANDS[CMD]) {
  throw new Error("unknown command " + CMD + "; one of: " + Object.keys(COMMANDS).join(", "));
}
print(`OpenMHz db: ${CMD}${APPLY ? " --apply" : " (dry run)"} on ${scanner.getName()} at ${new Date().toISOString()}`);
COMMANDS[CMD]();
if (!APPLY && CMD !== "report") print("\nDry run only. Re-run with --apply to make these changes.");
