// Schema shared with the other servers: packages/shared/models.js. The account
// app is the only one that sets passwords, so it supplies the hashing here.
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const { userSchema, getModel } = require("@openmhz/shared");

module.exports = getModel(mongoose, "User", () => {
  const schema = userSchema(mongoose, {
    hashPassword: (plaintext) => bcrypt.hashSync(plaintext, 8),
  });

  schema.methods.comparePassword = function (plaintext, callback) {
    const hash = this.local && this.local.password;
    if (typeof plaintext !== "string" || typeof hash !== "string" || !hash) {
      return callback(null, false);
    }
    try {
      return callback(null, bcrypt.compareSync(plaintext, hash));
    } catch (err) {
      return callback(err);
    }
  };

  return schema;
});
