// Keeps one bad request from taking the whole API down.
//
// Express 4 does not catch errors thrown by async handlers, and since Node 15 an
// unhandled promise rejection exits the process. A restart drops every listener's
// socket, so a single malformed request was a site-wide outage.

// Route an async handler's errors to Express's error middleware.
function wrap(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Last middleware: log, and answer once if nothing has been sent yet.
function errorHandler(err, req, res, next) {
  console.error(`Error - ${req.method} ${req.originalUrl}: ${(err && err.stack) || err}`);
  if (res.headersSent) {
    return;
  }
  const status = err && Number.isInteger(err.status) && err.status >= 400 && err.status < 600 ? err.status : 500;
  res.status(status).json({
    success: false,
    message: status === 500 ? "Internal server error" : String(err.message || err),
  });
}

// A rejected promise nobody awaited is almost always a request that failed after
// it had already answered; the process state is fine, so log it and carry on.
// An uncaught exception can leave state half-updated, so exit and let Docker
// restart us.
function installProcessHandlers(name) {
  process.on("unhandledRejection", (reason) => {
    console.error(`[${name}] Unhandled promise rejection: ${(reason && reason.stack) || reason}`);
  });
  process.on("uncaughtException", (err) => {
    console.error(`[${name}] Uncaught exception, exiting: ${(err && err.stack) || err}`);
    process.exit(1);
  });
}

// Query-string and body values can be strings, arrays (?a=1&a=2) or objects
// (?a[b]=1). Return the value only if it is a string.
function str(value) {
  return typeof value === "string" ? value : undefined;
}

module.exports = { wrap, errorHandler, installProcessHandlers, str };
