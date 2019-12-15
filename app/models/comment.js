const mongoose = require('mongoose');

var commentSchema = mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Account' },
  videoId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Video' },
  isRoot: { type: Boolean, default: true },
  parentId: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date },
  text: { type: String, default: '' },
  childsTotal: { type: Number, default: 0 }
});

commentSchema.pre('save', function(next) {
  if (!this.isNew || !this.isModified) {
    return next();
  }

  this.createdAt = new Date();
  
  return next();
});

module.exports = mongoose.model('Comment', commentSchema);