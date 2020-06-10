var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
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
  callAvg: Number,
  callCount: Number,
  active: {type: Boolean, default: false},
  planType: {type: Number, default: 0},
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
