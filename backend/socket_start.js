// Handles a socket client's 'start' message: validates the requested filter and
// indexes the client so it receives matching calls. Kept separate from index.js
// so it can be tested without starting the server.
const { ObjectId } = require('mongodb');

function makeStartHandler({ clients, Group, firehoseKey }) {
  // Rejects a client whose subscription is malformed, the same as before.
  function rejectClient(client, ipAddress, reason, data) {
    const d = (data && typeof data === "object") ? data : {};
    console.error("Error - Socket - " + reason + " ShortName: " + d.shortName + " Filter Type: " + d.filterType + " Filter Code: " + d.filterCode + " ClientID: " + client.id + " IP: " + ipAddress);
    clients.remove(client.id);
  }

  async function handleStart(client, ipAddress, data) {
    const entry = clients.get(client.id);
    if (!entry) {
      console.error("Error - Socket.io [Start] client not found ClientID: " + client.id + " IP: " + ipAddress);
      return;
    }
    // Stop delivering under any previous filter; re-indexed once this one validates.
    clients.unindex(entry);

    if (!data || typeof data !== "object") {
      return rejectClient(client, ipAddress, "Invalid start payload", data);
    }

    // A client can send a second 'start' while the first is still waiting on a
    // group lookup (the web app does this when moving between systems). Only the
    // newest one may change the entry; an older one finishing late used to
    // remove the client and silently stop its live feed.
    const seq = (entry.startSeq || 0) + 1;
    entry.startSeq = seq;

    const filterType = String(data.filterType);
    const isFirehose = filterType === "firehose";
    if (!isFirehose && (typeof data.shortName !== "string" || data.shortName === "")) {
      return rejectClient(client, ipAddress, "Invalid ShortName", data);
    }
    const shortName = typeof data.shortName === "string" ? data.shortName.toLowerCase() : null;

    let talkgroupNums = [];
    let firehose = false;

    if (isFirehose) {
      if (firehoseKey && typeof data.filterCode === "string" && data.filterCode === firehoseKey) {
        console.log("Enabling Firehose mode for Client: " + client.id + " IP: " + ipAddress);
        firehose = true;
      } else {
        console.error("Error - Socket - Invalid Firehose Key ClientID: " + client.id + " IP: " + ipAddress);
        clients.remove(client.id);
        return;
      }
    } else if (filterType === "group") {
      if (typeof data.filterCode !== "string" || data.filterCode.indexOf(',') !== -1 || !ObjectId.isValid(data.filterCode) || data.filterCode.length !== 24) {
        return rejectClient(client, ipAddress, "Invalid Group ID", data);
      }
      const group = await Group.findOne({ 'shortName': shortName, '_id': ObjectId.createFromHexString(data.filterCode) });
      if (!clients.get(client.id) || entry.startSeq !== seq) {
        return; // disconnected, or superseded by a newer 'start'
      }
      if (!group) {
        return rejectClient(client, ipAddress, "Invalid group", data);
      }
      talkgroupNums = group.talkgroups;
    } else if (filterType === "talkgroup" && Array.isArray(data.filterCode)) {
      talkgroupNums = data.filterCode;
    } else if (filterType === "all" && data.filterCode == "") {
      talkgroupNums = [];
    } else {
      return rejectClient(client, ipAddress, "Invalid Filter Type", data);
    }

    entry.active = true;
    entry.shortName = shortName;
    entry.filterCode = String(data.filterCode);
    entry.filterName = data.filterName;
    entry.filterStarred = data.filterStarred;
    entry.filterType = filterType;
    entry.talkgroupNums = talkgroupNums;
    entry.timestamp = new Date();
    entry.firehose = firehose;
    entry.ipAddress = ipAddress;
    // All checks passed: start delivering calls under the new filter.
    clients.index(entry);
  }

  return handleStart;
}

module.exports = { makeStartHandler };
