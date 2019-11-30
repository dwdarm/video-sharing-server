const mongoose = require('mongoose');

var savedSchema = mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
  saved: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }]
});

module.exports = mongoose.model('Saved', savedSchema);