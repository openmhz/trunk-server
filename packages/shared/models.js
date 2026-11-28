// Schemas for the collections more than one server uses. Each function takes
// the app's mongoose (the apps run different mongoose versions) and returns a
// new Schema; the app registers the model. Indexes are defined in
// mongo/scripts/maintain.js, not here (the apps run with autoIndex off).
//
// Collections only the backend uses (calls, events, podcasts) stay in
// backend/models.

// Users. Only the account app changes passwords, so it passes `hashPassword`.
// Without it, saving a changed password is refused rather than storing it in
// plain text.
function userSchema(mongoose, { hashPassword } = {}) {
  const schema = new mongoose.Schema({
    // Older accounts keep their email and password hash here too.
    local: {
      name: String,
      email: String,
      password: String,
    },
    // Matched case-insensitively at login; a unique case-insensitive index
    // enforces one account per address.
    email: String,
    password: String,
    screenName: {
      type: String,
      lowercase: true,
    },
    firstName: String,
    lastName: String,
    location: String,
    resetPasswordToken: String,
    resetPasswordTTL: Date,
    confirmEmail: {
      type: Boolean,
      default: false,
    },
    confirmEmailToken: String,
    confirmEmailTTL: Date,
    admin: {
      type: Boolean,
      default: false,
    },
    terms: {
      type: Number,
      default: 0,
    },
    ver: {
      type: Number,
      default: 1.1,
    },
    sysCount: Number,
    lastLogin: { type: Date, default: Date.now },
  });

  schema.pre("save", function (next) {
    if (!this.isModified("password")) {
      return next();
    }
    if (typeof hashPassword !== "function") {
      return next(new Error("Passwords can only be changed by the account app"));
    }
    const hashed = hashPassword(this.password);
    this.password = hashed;
    this.local.password = hashed;
    return next();
  });

  return schema;
}

// Radio systems contributed by users.
function systemSchema(mongoose) {
  return new mongoose.Schema({
    name: String,
    // Uploads find the system (and its API key) by shortName; unique.
    shortName: String,
    systemType: String,
    county: String,
    country: String,
    city: String,
    state: String,
    description: String,
    status: String,
    showScreenName: Boolean,
    allowContact: {
      type: Boolean,
      default: true,
    },
    // Set by the backend's stats job every 15 minutes.
    callAvg: Number,
    callCount: Number,
    active: { type: Boolean, default: false },
    lastActive: Date,
    ignoreUnknownTalkgroup: Boolean,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    key: String,
  });
}

// A system's talkgroups, imported from CSV in the admin app.
function talkgroupSchema(mongoose) {
  return new mongoose.Schema({
    shortName: String,
    userId: String,
    num: Number,
    mode: String,
    alpha: String,
    description: String,
    tag: String,
    group: String,
    priority: Number,
  });
}

// Listener-facing groups of talkgroups, edited in the admin app.
function groupSchema(mongoose) {
  return new mongoose.Schema({
    shortName: String,
    groupName: String,
    groupId: String,
    position: Number,
    talkgroups: [Number],
  });
}

// Register a model once per connection (requiring a model file twice, or from
// two apps' tests in one process, must not throw OverwriteModelError).
function getModel(connection, name, buildSchema) {
  return connection.models[name] || connection.model(name, buildSchema());
}

module.exports = { userSchema, systemSchema, talkgroupSchema, groupSchema, getModel };
