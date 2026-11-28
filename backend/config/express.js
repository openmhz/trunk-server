const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const { baseApp, cors, isVercelOrigin } = require("@openmhz/shared");

module.exports = function (app) {
  baseApp(app, { port: 3005, name: "backend" });
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(express.static(path.join(process.cwd(), "public")));
  // The public API answers any origin; copies of the site on Vercel are refused.
  app.use(cors({ blockOrigin: isVercelOrigin }));
};
