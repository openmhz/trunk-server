// OpenMHz database maintenance. Run through ../db.sh, which passes ARGS:
//
//   ./mongo/db.sh report                        read-only health report
//   ./mongo/db.sh prune-inactive [--apply]      delete systems inactive for 6+ months
//   ./mongo/db.sh dedupe-systems [--apply]      keep one document per shortName (the active one)
//   ./mongo/db.sh dedupe [--apply]              remove duplicate/orphaned talkgroups and groups
//   ./mongo/db.sh dedupe-users [--apply]        remove/rename duplicate accounts (emails, screen names)
//   ./mongo/db.sh indexes [--apply]             create the indexes the app needs
//   ./mongo/db.sh remove-system <id> [--apply]  delete one duplicate system document
//   ./mongo/db.sh clean-calls [--apply]         delete calls older than one month
//   ./mongo/db.sh drop-leftovers [--apply]      drop collections nothing uses any more
//
// Run the cleanup commands in the order above: each one's result feeds the next,
// and the unique indexes can only be built once the duplicates are gone.
//
// Everything that writes is a dry run unless --apply is given, and every
// command is safe to run repeatedly. No command deletes a system that is
// currently receiving calls (active: true).

/* global db, print, ObjectId, ARGS */

const args = (typeof ARGS !== "undefined" && ARGS) || {};
const CMD = args.cmd || "report";
const APPLY = args.apply === true;
const scanner = db.getSiblingDB("scanner");

const INACTIVE_MONTHS = 6;
const LEFTOVER_COLLECTIONS = [
  "system_stats", // per-system admin stats, removed from the app; last written 2024-08
  "stats",        // not referenced by any code
  "test",         // not referenced by any code
  "frozencalls",  // FrozenCall model is only used as an embedded schema; always empty
];

// Case-insensitive comparison, for emails.
const CASE_INSENSITIVE = { locale: "en", strength: 2 };

// The indexes the application relies on. This is the only place indexes are
// defined: the apps run Mongoose with autoIndex off. `unique` indexes are only
// built once the data has no duplicates, and `blocker` names the check for them.
const INDEXES = [
  // Call lists by system, newest first; also used by the per-system cleanup.
  { coll: "calls", key: { shortName: 1, time: -1 } },
  // Call lists filtered by talkgroup or group.
  { coll: "calls", key: { shortName: 1, talkgroupNum: 1, time: -1 } },
  // Talkgroup lookups by system, and the per-upload check for systems that
  // ignore unknown talkgroups. A system can't have the same talkgroup twice.
  { coll: "talkgroups", key: { shortName: 1, num: 1 }, unique: true, blocker: "talkgroups", fix: "dedupe" },
  { coll: "talkgroups", key: { shortName: 1 } },
  { coll: "groups", key: { shortName: 1 } },
  // Uploads find the system (and its API key) by shortName.
  { coll: "systems", key: { shortName: 1 }, unique: true, blocker: "systems", fix: "dedupe-systems" },
  { coll: "systems", key: { userId: 1 } },
  { coll: "systems", key: { lastActive: 1 } },
  // One account per email address, ignoring case.
  { coll: "users", key: { email: 1 }, unique: true, collation: CASE_INSENSITIVE, blocker: "emails", fix: "dedupe-users" },
  // One account per screen name; accounts without one are allowed.
  { coll: "users", key: { screenName: 1 }, unique: true, partialFilterExpression: { screenName: { $type: "string" } }, blocker: "screenNames", fix: "dedupe-users" },
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

function inactiveCutoff() {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - INACTIVE_MONTHS);
  return cutoff;
}

// A system counts as active if it is receiving calls now, or has in the last
// six months. This is the same rule prune-inactive uses.
function activeSystemFilter() {
  return { $or: [{ active: true }, { lastActive: { $gte: inactiveCutoff() } }] };
}

function ownsActiveSystem(userId) {
  return scanner.systems.countDocuments({ userId: userId, ...activeSystemFilter() }) > 0;
}

// Emails stored with leading/trailing spaces. Login trims what people type and
// matches exactly, so these accounts can't sign in until they are trimmed.
const SPACED = /^\s|\s$/;
function spacedEmailUsers() {
  return scanner.users.find({ $or: [{ email: SPACED }, { "local.email": SPACED }] }, { email: 1, local: 1 }).toArray();
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function email(user) {
  return user.email || (user.local && user.local.email) || "(no email)";
}

// Deletes system documents. Talkgroups and groups belong to a shortName, not a
// document, so they are deleted only for shortNames no remaining system uses.
function deleteSystems(systemDocs) {
  if (systemDocs.length === 0) return;
  const ids = systemDocs.map((s) => s._id);
  scanner.systems.deleteMany({ _id: { $in: ids }, active: { $ne: true } });
  const names = [...new Set(systemDocs.map((s) => s.shortName))]
    .filter((n) => scanner.systems.countDocuments({ shortName: n }) === 0);
  if (names.length) {
    scanner.talkgroups.deleteMany({ shortName: { $in: names } });
    scanner.groups.deleteMany({ shortName: { $in: names } });
  }
}

// ---------------------------------------------------------------- duplicates

function duplicateSystems() {
  return scanner.systems.aggregate([
    { $group: { _id: "$shortName", n: { $sum: 1 } } },
    { $match: { n: { $gt: 1 } } },
  ]).toArray().map((d) => d._id);
}

function duplicateTalkgroups() {
  return scanner.talkgroups.aggregate([
    { $group: { _id: { shortName: "$shortName", num: "$num" }, ids: { $push: "$_id" }, n: { $sum: 1 } } },
    { $match: { n: { $gt: 1 } } },
  ], { allowDiskUse: true }).toArray();
}

// Groups of user _ids that share a value of `field`, ignoring case and
// surrounding spaces (some older accounts were stored as "name@x.com ").
function duplicateUsers(field) {
  return scanner.users.aggregate([
    { $match: { [field]: { $type: "string", $ne: "" } } },
    { $group: { _id: { $toLower: { $trim: { input: "$" + field } } }, ids: { $push: "$_id" }, n: { $sum: 1 } } },
    { $match: { n: { $gt: 1 } } },
  ]).toArray();
}

const BLOCKERS = {
  talkgroups: () => duplicateTalkgroups().length,
  systems: () => duplicateSystems().length,
  emails: () => duplicateUsers("email").length,
  screenNames: () => duplicateUsers("screenName").length,
};

// shortNames that have talkgroups/groups but no system document.
function orphanShortNames(coll) {
  return scanner.getCollection(coll).aggregate([
    { $group: { _id: "$shortName" } },
    { $lookup: { from: "systems", localField: "_id", foreignField: "shortName", as: "s" } },
    { $match: { s: { $size: 0 } } },
  ]).toArray().map((d) => d._id);
}

// ---------------------------------------------------------------- planning

// Which copy of a duplicated shortName to keep. Uploads and the stats job both
// resolve a shortName to the same document, and that is the one the stats job
// marks active, so keep it. Otherwise keep the most recently active copy.
function planSystemDedupe() {
  return duplicateSystems().map((shortName) => {
    const docs = scanner.systems.find({ shortName }).toArray();
    docs.sort((a, b) =>
      (b.active === true) - (a.active === true) ||
      ((b.lastActive || 0) - (a.lastActive || 0)) ||
      (a._id.toString() < b._id.toString() ? -1 : 1));
    const activeCount = docs.filter((d) => d.active === true).length;
    return { shortName, keep: docs[0], remove: docs.slice(1), ambiguous: activeCount > 1 };
  });
}

function describeUser(u) {
  const systems = scanner.systems.find({ userId: u._id }, { shortName: 1, active: 1, lastActive: 1 }).toArray();
  const active = ownsActiveSystem(u._id);
  return `${u._id} ${email(u)} confirmed=${u.confirmEmail === true} admin=${u.admin === true} ` +
    `systems=${systems.length}${systems.length ? " [" + systems.map((s) => s.shortName).join(",") + "]" : ""} activeSystem=${active}`;
}

// Accounts that share an email (ignoring case). Keep the account with an
// active system (then admin, confirmed, most systems, newest). Remove the
// others if they have no active system and aren't admins; their systems are
// all inactive and are removed with them.
function planEmailDedupe() {
  return duplicateUsers("email").map((group) => {
    const users = scanner.users.find({ _id: { $in: group.ids } }).toArray().map((u) => ({
      user: u,
      active: ownsActiveSystem(u._id),
      systems: scanner.systems.countDocuments({ userId: u._id }),
    }));
    users.sort((a, b) =>
      (b.active - a.active) ||
      ((b.user.admin === true) - (a.user.admin === true)) ||
      ((b.user.confirmEmail === true) - (a.user.confirmEmail === true)) ||
      (b.systems - a.systems) ||
      (a.user._id.toString() < b.user._id.toString() ? 1 : -1));
    const keep = users[0].user;
    const remove = [];
    const blocked = [];
    users.slice(1).forEach((u) => {
      if (u.active || u.user.admin === true) {
        blocked.push(u.user);
      } else {
        remove.push(u.user);
      }
    });
    return { email: group._id, keep, remove, blocked };
  });
}

// Accounts that share a screen name (ignoring case), after the email dedupe
// has removed its accounts. The account with an active system keeps the name
// (then admin, confirmed, oldest); the rest get the name plus a counter:
// bob, bob2, bob3... skipping names that are already taken.
function planScreenNameDedupe(removedIds) {
  const removed = new Set(removedIds.map(String));
  const taken = new Set(scanner.users.distinct("screenName", { screenName: { $type: "string" } })
    .map((n) => n.toLowerCase()));
  const plans = [];
  duplicateUsers("screenName").forEach((group) => {
    const users = scanner.users.find({ _id: { $in: group.ids } }).toArray()
      .filter((u) => !removed.has(String(u._id)))
      .map((u) => ({ user: u, active: ownsActiveSystem(u._id) }));
    if (users.length < 2) return;
    users.sort((a, b) =>
      (b.active - a.active) ||
      ((b.user.admin === true) - (a.user.admin === true)) ||
      ((b.user.confirmEmail === true) - (a.user.confirmEmail === true)) ||
      (a.user._id.toString() < b.user._id.toString() ? -1 : 1));
    const base = group._id;
    let counter = 2;
    const renames = users.slice(1).map((u) => {
      while (taken.has(base + counter)) counter++;
      const name = base + counter;
      taken.add(name);
      counter++;
      return { user: u.user, from: u.user.screenName, to: name };
    });
    plans.push({ screenName: base, keep: users[0].user, renames });
  });
  return plans;
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
    const blocked = want.blocker && state !== "ok" ? BLOCKERS[want.blocker]() : 0;
    print(`  ${want.coll}.${JSON.stringify(want.key)}${want.unique ? " unique" : ""}: ${state}` +
      (blocked ? ` — blocked by ${blocked} duplicate(s), run ${want.fix}` : ""));
  });

  const cutoff = inactiveCutoff();
  header(`Inactive systems (no calls since ${cutoff.toISOString().slice(0, 10)}) — prune-inactive`);
  print(`  ${scanner.systems.countDocuments({ active: { $ne: true }, $or: [{ lastActive: { $lt: cutoff } }, { lastActive: { $exists: false } }] })} system documents`);

  header("Duplicate systems (same shortName) — dedupe-systems");
  const sysPlans = planSystemDedupe();
  if (sysPlans.length === 0) print("  none");
  sysPlans.forEach((p) => {
    print(`  ${p.shortName}: keep ${p.keep._id} (active=${p.keep.active === true}), remove ${p.remove.map((d) => d._id).join(", ")}` +
      (p.ambiguous ? "  ** more than one copy is active; left alone **" : ""));
  });

  header("Duplicate talkgroups and orphans — dedupe");
  const dupTgs = duplicateTalkgroups();
  print(`  duplicate talkgroups: ${dupTgs.length} pairs, ${dupTgs.reduce((t, d) => t + d.n - 1, 0)} extra documents`);
  print(`  talkgroups for missing systems: ${orphanShortNames("talkgroups").join(", ") || "none"}`);
  print(`  groups for missing systems: ${orphanShortNames("groups").join(", ") || "none"}`);

  header("Duplicate accounts — dedupe-users");
  print(`  emails differing only by case or spaces: ${duplicateUsers("email").length}`);
  print(`  emails stored with surrounding spaces (can't sign in): ${spacedEmailUsers().length}`);
  print(`  screen names shared by several accounts: ${duplicateUsers("screenName").length}`);
  print(`  accounts without a screen name (allowed): ${scanner.users.countDocuments({ screenName: { $not: { $type: "string" } } })}`);

  header("Retention");
  const oldest = scanner.calls.find({}, { time: 1 }).sort({ _id: 1 }).limit(1).toArray()[0];
  print(`  oldest call: ${oldest ? oldest.time.toISOString() : "none"} (retention: one month)`);
}

// Replaces remove_old_systems.js, which deleted talkgroups and groups by
// shortName even when another, active document had the same shortName.
function pruneInactive() {
  const cutoff = inactiveCutoff();
  header(`Systems inactive since ${cutoff.toISOString().slice(0, 10)}`);
  const inactive = scanner.systems.find({
    active: { $ne: true },
    $or: [{ lastActive: { $lt: cutoff } }, { lastActive: { $exists: false } }],
  }, { shortName: 1 }).toArray();
  const inactiveIds = new Set(inactive.map((s) => String(s._id)));
  const remaining = new Set(scanner.systems.find({}, { shortName: 1 }).toArray()
    .filter((s) => !inactiveIds.has(String(s._id))).map((s) => s.shortName));
  const names = [...new Set(inactive.map((s) => s.shortName))];
  const freed = names.filter((n) => !remaining.has(n));
  if (names.length) print("  " + names.join(", "));
  action(`delete ${inactive.length} systems, and the talkgroups/groups of ${freed.length} shortNames no remaining system uses`);
  if (APPLY) deleteSystems(inactive);
}

function dedupeSystems() {
  header("Duplicate systems: keep the copy uploads use (the active one)");
  const plans = planSystemDedupe();
  if (plans.length === 0) print("  none");
  plans.forEach((p) => {
    if (p.ambiguous) {
      print(`  SKIPPED  ${p.shortName}: more than one copy is active; resolve with remove-system`);
      return;
    }
    print(`  ${p.shortName}: keep ${p.keep._id} "${p.keep.name}" (active=${p.keep.active === true}, lastActive=${p.keep.lastActive ? p.keep.lastActive.toISOString() : "never"})`);
    p.remove.forEach((d) => {
      action(`delete ${d._id} "${d.name}" (lastActive=${d.lastActive ? d.lastActive.toISOString() : "never"}); talkgroups/groups are shared with the kept copy and stay`);
    });
    if (APPLY) {
      scanner.systems.deleteMany({ _id: { $in: p.remove.map((d) => d._id) }, active: { $ne: true } });
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
}

function dedupeUsers() {
  header("Accounts sharing an email address (ignoring case and surrounding spaces)");
  const emailPlans = planEmailDedupe();
  if (emailPlans.length === 0) print("  none");
  const removedIds = [];
  emailPlans.forEach((p) => {
    print(`  ${p.email}`);
    print(`     keep    ${describeUser(p.keep)}`);
    p.remove.forEach((u) => {
      action(`   remove ${describeUser(u)}`);
      removedIds.push(u._id);
    });
    p.blocked.forEach((u) => {
      print(`     KEPT    ${describeUser(u)}  (has an active system or is an admin; merge by hand)`);
    });
  });

  header("Accounts sharing a screen name (ignoring case)");
  const namePlans = planScreenNameDedupe(removedIds);
  if (namePlans.length === 0) print("  none");
  namePlans.forEach((p) => {
    print(`  ${p.screenName}: kept by ${p.keep._id} ${email(p.keep)}`);
    p.renames.forEach((r) => action(`   rename ${r.user._id} ${email(r.user)}: ${r.from} -> ${r.to}`));
  });

  header("Emails stored with surrounding spaces");
  const removedSet = new Set(removedIds.map(String));
  const trims = spacedEmailUsers().filter((u) => !removedSet.has(String(u._id)));
  if (trims.length === 0) print("  none");
  trims.forEach((u) => {
    action(`   trim ${u._id} ${JSON.stringify(u.email)}` +
      (u.local && typeof u.local.email === "string" && SPACED.test(u.local.email) ? ` (and local.email ${JSON.stringify(u.local.email)})` : ""));
  });

  if (APPLY) {
    // Recompute against the live data rather than trusting the plan printed above.
    emailPlans.forEach((p) => {
      p.remove.forEach((u) => {
        if (ownsActiveSystem(u._id) || u.admin === true) return;
        deleteSystems(scanner.systems.find({ userId: u._id }, { shortName: 1, active: 1 }).toArray());
        scanner.users.deleteOne({ _id: u._id });
      });
    });
    namePlans.forEach((p) => {
      p.renames.forEach((r) => {
        scanner.users.updateOne({ _id: r.user._id, screenName: r.from }, { $set: { screenName: r.to } });
      });
    });
    spacedEmailUsers().forEach((u) => {
      const set = {};
      if (typeof u.email === "string" && SPACED.test(u.email)) set.email = u.email.trim();
      if (u.local && typeof u.local.email === "string" && SPACED.test(u.local.email)) set["local.email"] = u.local.email.trim();
      const target = set.email || u.email;
      const clash = target && scanner.users.findOne({ _id: { $ne: u._id }, email: { $regex: "^\\s*" + escapeRegex(target.trim()) + "\\s*$", $options: "i" } }, { _id: 1 });
      if (clash) {
        print(`  SKIPPED trim of ${u._id}: ${target.trim()} is also used by ${clash._id}; merge by hand`);
        return;
      }
      scanner.users.updateOne({ _id: u._id }, { $set: set });
    });
  }
}

function indexes() {
  header("Indexes");
  INDEXES.forEach((want) => {
    const coll = scanner.getCollection(want.coll);
    const label = `${want.coll}.${JSON.stringify(want.key)}${want.unique ? " unique" : ""}`;
    const have = existingIndex(want.coll, want.key);

    if (have && (!want.unique || have.unique)) {
      print(`  ok       ${label}`);
      return;
    }
    const blocked = want.blocker ? BLOCKERS[want.blocker]() : 0;
    if (want.unique && blocked) {
      print(`  SKIPPED  ${label}: ${blocked} duplicate(s) — run ${want.fix} first`);
      return;
    }
    const options = {};
    if (want.unique) options.unique = true;
    if (want.collation) options.collation = want.collation;
    if (want.partialFilterExpression) options.partialFilterExpression = want.partialFilterExpression;
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
  if (sys.active === true) {
    throw new Error(`${sys.shortName} ${sys._id} is receiving calls (active); refusing`);
  }
  const copies = scanner.systems.countDocuments({ shortName: sys.shortName });
  if (copies < 2) {
    throw new Error(`${sys.shortName} has only this one document; refusing (use the admin app to delete a system)`);
  }
  const owner = sys.userId ? scanner.users.findOne({ _id: sys.userId }, { email: 1 }) : null;
  action(`delete system ${sys._id} (${sys.shortName}, owner ${owner ? email(owner) : "none"}); ${copies - 1} other document(s) with this shortName remain`);
  if (APPLY) scanner.systems.deleteOne({ _id: sys._id, active: { $ne: true } });
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
  "prune-inactive": pruneInactive,
  "dedupe-systems": dedupeSystems,
  dedupe,
  "dedupe-users": dedupeUsers,
  indexes,
  "remove-system": removeSystem,
  "clean-calls": cleanCalls,
  "drop-leftovers": dropLeftovers,
};

if (!COMMANDS[CMD]) {
  throw new Error("unknown command " + CMD + "; one of: " + Object.keys(COMMANDS).join(", "));
}
print(`OpenMHz db: ${CMD}${APPLY ? " --apply" : " (dry run)"} on ${scanner.getName()} at ${new Date().toISOString()}`);
COMMANDS[CMD]();
if (!APPLY && CMD !== "report") print("\nDry run only. Re-run with --apply to make these changes.");
