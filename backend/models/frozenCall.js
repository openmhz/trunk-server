var mongoose = require('mongoose');
const frozenCallSchema = require('./frozenCallSchema');

module.exports = mongoose.model('FrozenCall', frozenCallSchema);