/**
 * Rate limits on the endpoints that are worth attacking.
 *
 * There were none before this. /login could be guessed at as fast as the
 * network allowed, and /users/:userId/send-confirm takes no authentication at
 * all, so anyone who knew an account id could send that address as much mail as
 * they liked.
 *
 * Counting is in memory, so each account container counts on its own. That is
 * fine at one container and would need a shared store if this is ever scaled
 * out - the limits are a brake on automation, not a security boundary.
 */
const rateLimit = require("express-rate-limit");

const MINUTE = 60 * 1000;

function limiter(options) {
  return rateLimit({
    standardHeaders: "draft-7",
    legacyHeaders: false,
    // The JSON shape every client here already understands. Without this,
    // express-rate-limit answers with plain text and the browser shows nothing
    // useful.
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: options.message,
        reason: "rate limited"
      });
    },
    ...options
  });
}

// Ten attempts per quarter hour is generous for someone who has forgotten which
// password they used, and useless for guessing.
//
// Every attempt counts, successful or not. skipSuccessfulRequests looks at the
// HTTP status, and a rejected login here answers 200 with success:false in the
// body - so it would treat every failure as a success and never limit anything.
exports.loginLimiter = limiter({
  windowMs: 15 * MINUTE,
  limit: 10,
  message: "Too many sign-in attempts. Wait fifteen minutes and try again."
});

exports.registerLimiter = limiter({
  windowMs: 60 * MINUTE,
  limit: 5,
  message: "Too many accounts created from this address. Try again in an hour."
});

exports.resetPasswordLimiter = limiter({
  windowMs: 60 * MINUTE,
  limit: 5,
  message: "Too many password reset requests. Try again in an hour."
});

// Keyed on the account being emailed rather than on the caller's IP. The abuse
// this stops is mailing one person over and over, which a botnet could do from
// a different address each time; and keying this way means the admin portal
// resending confirmations for many different people is never mistaken for it.
exports.confirmEmailLimiter = limiter({
  windowMs: 60 * MINUTE,
  limit: 3,
  keyGenerator: (req) => `confirm:${req.params.userId}`,
  message: "That address has been sent several confirmation emails already. Try again in an hour."
});
