// Registry of connected socket.io clients.
//
// Every connected socket has an entry. Active entries are also indexed by
// system (or in the firehose set) so that fanning out an uploaded call only
// visits the listeners of that call's system, instead of every socket on the
// server. At peak that is the difference between ~5,000 iterations per upload
// and a few dozen.
//
// The index has to mirror each entry's active/firehose/shortName fields, so
// call index() after changing them and unindex() before an entry stops
// receiving calls.

const entries = new Map();        // socket id -> entry
const activeBySystem = new Map(); // shortName -> Set<entry>
const firehose = new Set();       // entries that receive every call

function add(id, socket) {
  const entry = { socket: socket, active: false, timestamp: new Date() };
  entries.set(id, entry);
  return entry;
}

function get(id) {
  return entries.get(id);
}

function unindex(entry) {
  const set = entry.indexedIn;
  if (!set) return;
  set.delete(entry);
  if (set !== firehose && set.size === 0) {
    activeBySystem.delete(entry.indexedShortName);
  }
  entry.indexedIn = null;
  entry.indexedShortName = null;
}

// (Re)index an entry from its current fields. Safe to call repeatedly.
function index(entry) {
  unindex(entry);
  if (!entry.active) return;
  let set;
  if (entry.firehose === true) {
    set = firehose;
  } else {
    set = activeBySystem.get(entry.shortName);
    if (!set) {
      set = new Set();
      activeBySystem.set(entry.shortName, set);
    }
  }
  set.add(entry);
  entry.indexedIn = set;
  entry.indexedShortName = entry.shortName;
}

function remove(id) {
  const entry = entries.get(id);
  if (!entry) return;
  unindex(entry);
  entries.delete(id);
}

// Same matching rules the old full-scan notify_clients used.
function wantsCall(entry, call) {
  if (entry.filterType == "all") return true;
  if (entry.filterType == "unit") {
    const codeArray = entry.filterCode.split(',');
    for (let j = 0; j < codeArray.length; ++j) {
      for (let k = 0; k < call.srcList.length; k++) {
        if (codeArray[j] == call.srcList[k]) return true;
      }
    }
    return false;
  }
  const codeArray = entry.talkgroupNums;
  for (let j = 0; j < codeArray.length; ++j) {
    if (codeArray[j] == call.talkgroupNum) return true;
  }
  return false;
}

// Send a call to every interested client. Returns how many were sent.
function notify(call, message) {
  let sent = 0;
  for (const entry of firehose) {
    entry.socket.emit("new message", message);
    sent++;
  }
  const listeners = activeBySystem.get(call.shortName.toLowerCase());
  if (listeners) {
    for (const entry of listeners) {
      if (wantsCall(entry, call)) {
        entry.socket.emit("new message", message);
        sent++;
      }
    }
  }
  return sent;
}

// Active listeners per system, e.g. { nhpd: 1428, dcfd: 19 }.
// Firehose clients are not counted against any system.
function systemCounts() {
  const counts = {};
  for (const [shortName, set] of activeBySystem) {
    counts[shortName] = set.size;
  }
  return counts;
}

module.exports = {
  add,
  get,
  index,
  unindex,
  remove,
  notify,
  systemCounts,
  size: () => entries.size,
  values: () => entries.values(),
};
