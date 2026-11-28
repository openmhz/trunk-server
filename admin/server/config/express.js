const path = require("path");
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const MongoStore = require("connect-mongo");
const { baseApp, cors, sessionOptions, siteUrls } = require("@openmhz/shared");
const secrets = require("./secrets");

module.exports = function (app, passport) {
  baseApp(app, { port: 3008, name: "admin" });
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(express.static(path.join(process.cwd(), "public")));

  // The login session is shared by account and admin through the cookie domain.
  app.use(session(sessionOptions({
    secret: secrets.sessionSecret,
    mongoUrl: secrets.db,
    cookieDomain: siteUrls().cookieDomain,
    MongoStore,
  })));
  app.use(passport.initialize());
  app.use(passport.session());

  app.use(cors());
};
