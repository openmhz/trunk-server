// Safety net for Express 4 async handlers and process-level failures.

// Wrap a (possibly async) route handler so rejections reach Express's error chain.
const wrap = (fn) => (req, res, next) => {
  Promise.resolve().then(() => fn(req, res, next)).catch(next);
};

// Final error handler. Logs details server-side, never leaks error objects.
const errorHandler = (err, req, res, next) => {
  console.error(`Unhandled error in ${req.method} ${req.originalUrl || req.url}:`, (err && err.stack) || err);
  if (res.headersSent) {
    return;
  }
  res.status(500).json({ success: false, message: "Internal server error" });
};

const installProcessHandlers = (name) => {
  process.on("unhandledRejection", (reason) => {
    console.error(`[${name}] unhandledRejection:`, (reason && reason.stack) || reason);
  });
  process.on("uncaughtException", (err) => {
    console.error(`[${name}] uncaughtException:`, (err && err.stack) || err);
    process.exit(1);
  });
};

module.exports = { wrap, errorHandler, installProcessHandlers };
