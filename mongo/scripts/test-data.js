// Test-stack data (compose.test.yaml), loaded once into an empty database.
// Never used in production.
//
//   sign in:   test@openmhz.test / openmhz-test   (confirmed, terms accepted, admin)
//   system:    shortName "test", API key "test-api-key"
//   upload:    curl -F call=@call.m4a -F talkgroup_num=101 -F start_time=$(date +%s) \
//                   -F api_key=test-api-key -F source_list='[]' -F freq=851000000 \
//                   http://api.openmhz.test/test/upload
const scanner = db.getSiblingDB("scanner");
const userId = ObjectId();
const hash = "$2b$08$YqJGPrqd1wfnF3ooSu4uFe6l2zNSVg9xndBTzEWFf3OUj9oOdiQlW";

scanner.users.insertOne({
  _id: userId,
  email: "test@openmhz.test",
  local: { email: "test@openmhz.test", password: hash },
  password: hash,
  screenName: "tester",
  firstName: "Test",
  lastName: "Account",
  location: "Test City",
  confirmEmail: true,
  terms: 1.1,
  admin: true,
  ver: 1.1,
  lastLogin: new Date(),
});

scanner.systems.insertOne({
  shortName: "test",
  name: "Test County Public Safety",
  description: "Local test system",
  systemType: "p25",
  city: "Test City",
  state: "DC",
  country: "us",
  key: "test-api-key",
  userId: userId,
  allowContact: true,
  showScreenName: false,
  active: true,
  lastActive: new Date(),
});

scanner.talkgroups.insertMany([
  { shortName: "test", num: 101, alpha: "fire dispatch", description: "Fire Dispatch" },
  { shortName: "test", num: 102, alpha: "ems ops", description: "EMS Operations" },
  { shortName: "test", num: 201, alpha: "police dispatch", description: "Police Dispatch" },
]);

print("Loaded test data: sign in as test@openmhz.test / openmhz-test; system 'test', key 'test-api-key'");
