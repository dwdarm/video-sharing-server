const mongoose = require('mongoose');

var likeSchema = mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Account' },
  videoId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Video' },
  startedAt: Date
});

likeSchema.pre('save', function(next) {
  if (!this.isNew || !this.isModified) return next();
  this.startedAt = new Date();
  return next ();
});

module.exports = mongoose.model('Like', likeSchema);