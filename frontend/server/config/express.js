const path = require("path");
const express = require("express");
const { baseApp, cors } = require("@openmhz/shared");

module.exports = function (app) {
  baseApp(app, { port: 3000, name: "frontend" });
  app.use(express.static(path.join(process.cwd(), "public")));
  app.set("view engine", "ejs");
  app.set("views", "./");
  app.use(cors());
};
