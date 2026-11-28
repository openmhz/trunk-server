// Crash-safety helpers: Express 4 does not catch rejections from async handlers.

// Wrap a (possibly async) handler or middleware so thrown errors / rejections reach next(err).
function wrap(fn) {
  return function wrapped(req, res, next) {
    let result;
    try {
      result = fn(req, res, next);
    } catch (err) {
      return next(err);
    }
    return Promise.resolve(result).catch(next);
  };
}

// Final Express error handler. Never leaks error details to the client.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error("Unhandled error in " + req.method + " " + req.originalUrl + ": " + ((err && err.stack) || err));
  if (res.headersSent) {
    // Too late to send a JSON body; let Express close the connection.
    return typeof next === "function" ? next(err) : undefined;
  }
  res.status(500).json({ success: false, message: "Internal server error" });
}

function installProcessHandlers(name) {
  const label = name || "process";
  process.on("unhandledRejection", (reason) => {
    console.error("[" + label + "] unhandledRejection (continuing): " + ((reason && reason.stack) || reason));
  });
  process.on("uncaughtException", (err) => {
    console.error("[" + label + "] uncaughtException (exiting): " + ((err && err.stack) || err));
    process.exit(1);
  });
}

module.exports = { wrap, errorHandler, installProcessHandlers };
