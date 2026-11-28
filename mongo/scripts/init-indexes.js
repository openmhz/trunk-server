// Runs once when the mongo container starts with an empty /data/db
// (via /docker-entrypoint-initdb.d), so dev, test and new deployments get the
// same indexes as production.
globalThis.ARGS = { cmd: "indexes", apply: true };
load("/app/scripts/maintain.js");
