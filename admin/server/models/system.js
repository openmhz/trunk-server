var mongoose = require('mongoose');
var bcrypt   = require('bcrypt');
var User = require('./user');

var systemSchema = mongoose.Schema({
  name: String,
  shortName: String,
  systemType: String,
  county: String,
  country: String,
  city: String,
  state: String,
  description: String,
  showScreenName: Boolean,
  ignoreUnknownTalkgroup : Boolean,
  active: {type: Boolean, default: false},
  lastActive: Date,
  userId:  {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  key: String
});

systemSchema.methods.generateHash = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

systemSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.local.password);
};

module.exports = mongoose.model('System', systemSchema);
