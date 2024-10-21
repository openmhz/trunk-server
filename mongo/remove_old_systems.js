// inactive-systems.js
// This script finds inactive systems and removes them along with their related groups and talkgroups
// Run with: mongosh scanner inactive-systems.js

// Switch to scanner database
db = db.getSiblingDB('scanner');

// Calculate date 6 months ago
const sixMonthsAgo = new Date();
sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

// Print the date we're using as threshold
print("Finding systems inactive since: " + sixMonthsAgo.toISOString());

// Run the aggregation to get inactive systems
const result = db.systems.aggregate([
  {
    $match: {
      $or: [
        { lastActive: { $lt: sixMonthsAgo } },
        { lastActive: { $exists: false } }
      ]
    }
  },
  {
    $project: {
      _id: 0,
      shortName: 1
    }
  },
  {
    $group: {
      _id: null,
      inactiveShortNames: { $push: "$shortName" }
    }
  },
  {
    $project: {
      _id: 0,
      inactiveShortNames: 1
    }
  }
]).toArray();

// If we found inactive systems, process them
if (result.length > 0) {
  const inactiveShortNames = result[0].inactiveShortNames;
  print("\nInactive systems found: " + inactiveShortNames.length);
  print("\nShort names of inactive systems:");
  print(JSON.stringify(inactiveShortNames, null, 2));

  // Remove groups associated with inactive systems
  const deleteGroupsResult = db.groups.deleteMany({
    shortName: { $in: inactiveShortNames }
  });

  // Remove talkgroups associated with inactive systems
  const deleteTalkgroupsResult = db.talkgroups.deleteMany({
    shortName: { $in: inactiveShortNames }
  });

  // Remove the inactive systems themselves
  const deleteSystemsResult = db.systems.deleteMany({
    $or: [
      { lastActive: { $lt: sixMonthsAgo } },
      { lastActive: { $exists: false } }
    ]
  });

  print("\nCleanup results:");
  print(`Deleted ${deleteGroupsResult.deletedCount} groups associated with inactive systems`);
  print(`Deleted ${deleteTalkgroupsResult.deletedCount} talkgroups associated with inactive systems`);
  print(`Deleted ${deleteSystemsResult.deletedCount} inactive systems`);
} else {
  print("No inactive systems found");
}