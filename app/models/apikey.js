const mongoose = require('mongoose');

var apikeySchema = mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Account' },
  internal: { type: Boolean, default: false },
  createdAt: Date
});

apikeySchema.pre('save', function(next) {
  if (!this.isNew || !this.isModified) return next();
  this.createdAt = new Date();
  return next ();
});

module.exports = mongoose.model('Apikey', apikeySchema);