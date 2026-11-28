// Keeps one bad request from taking a whole server down.
//
// Express 4 does not catch errors thrown by async handlers, and since Node 15 an
// unhandled promise rejection exits the process. A backend restart drops every
// listener's socket, so a single malformed request was a site-wide outage.

// Route a handler's errors (thrown, or a rejected promise) to Express's error
// middleware.
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

// Last middleware: log, and answer once if nothing has been sent yet. Error
// details never reach the client unless the error carries a 4xx `status`.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error(`Error - ${req.method} ${req.originalUrl || req.url}: ${(err && err.stack) || err}`);
  if (res.headersSent) {
    // A response that is still being written can't be completed; let Express
    // close the connection. A finished one needs nothing more.
    if (!res.writableEnded && typeof next === "function") {
      return next(err);
    }
    return undefined;
  }
  const status = err && Number.isInteger(err.status) && err.status >= 400 && err.status < 600 ? err.status : 500;
  res.status(status).json({
    success: false,
    message: status < 500 ? String(err.message || err) : "Internal server error",
  });
  return undefined;
}

// A rejected promise nobody awaited is almost always a request that failed after
// it had already answered; the process state is fine, so log it and carry on.
// An uncaught exception can leave state half-updated, so exit and let Docker
// restart the container.
function installProcessHandlers(name, { exit = process.exit } = {}) {
  process.on("unhandledRejection", (reason) => {
    console.error(`[${name}] Unhandled promise rejection: ${(reason && reason.stack) || reason}`);
  });
  process.on("uncaughtException", (err) => {
    console.error(`[${name}] Uncaught exception, exiting: ${(err && err.stack) || err}`);
    exit(1);
  });
}

// Query-string and body values can be strings, arrays (?a=1&a=2) or objects
// (?a[b]=1). Return the value only if it is a string.
function str(value) {
  return typeof value === "string" ? value : undefined;
}

module.exports = { wrap, errorHandler, installProcessHandlers, str };
