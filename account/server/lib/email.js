const User = require("../models/user");

// https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex/6969486#6969486
const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Exact (anchored), case-insensitive email match over email and local.email.
const emailQuery = (email) => {
  const re = { $regex: "^" + escapeRegExp(email.trim()) + "$", $options: "i" };
  return { $or: [{ email: re }, { "local.email": re }] };
};

// Returns the first matching user (or null); warns if the address is ambiguous.
const findUserByEmail = async (email) => {
  const users = await User.find(emailQuery(email)).limit(2);
  if (users.length > 1) {
    console.warn("WARNING: more than one user matches email: " + email.trim());
  }
  return users[0] || null;
};

module.exports = { escapeRegExp, emailQuery, findUserByEmail };
