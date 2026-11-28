// Dummy keys so the Mailjet client can be constructed; it is stubbed before use.
process.env.MAILJET_KEY = process.env.MAILJET_KEY || "test";
process.env.MAILJET_SECRET = process.env.MAILJET_SECRET || "test";

const http = require("http");
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const mongoose = require("mongoose");

const MONGO_URL = process.env.TEST_MONGO_URL || "mongodb://127.0.0.1:27119/account_test";

const users = require("../controllers/users");
const configurePassport = require("../config/passport");
const registerRoutes = require("../lib/routes");
const { errorHandler } = require("../lib/safety");
const User = require("../models/user");

// Mailjet stub: records sends; set .fail to reject.
const makeMailer = () => {
  const mailer = {
    sent: [],
    fail: false,
    post() {
      return {
        request: async (payload) => {
          if (mailer.fail) throw Object.assign(new Error("mailjet down"), { statusCode: 500 });
          mailer.sent.push(payload);
          return { body: {} };
        },
      };
    },
  };
  return mailer;
};

async function start() {
  await mongoose.connect(MONGO_URL);
  await mongoose.connection.dropDatabase();
  await User.init();
  const mailer = makeMailer();
  users._setMailjet(mailer);

  const app = express();
  app.use(express.json());
  app.use(session({ secret: "test", resave: false, saveUninitialized: false }));
  app.use(passport.initialize());
  app.use(passport.session());
  configurePassport(app, passport);
  registerRoutes(app);
  app.use(errorHandler);

  const server = http.createServer(app);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`;

  const post = async (path, body) => {
    const res = await fetch(base + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body === undefined ? {} : body),
    });
    let json = null;
    try { json = await res.json(); } catch (e) { /* non-json */ }
    return { status: res.status, json };
  };
  const stop = async () => {
    await new Promise((r) => server.close(r));
    await mongoose.disconnect();
  };
  return { app, base, post, mailer, stop, User };
}

const profile = (over = {}) => ({
  firstName: "Bob", lastName: "Smith", screenName: "bobby", location: "Ohio",
  email: "bob@x.com", password: "password1", ...over,
});

module.exports = { start, profile };
