const mongoose = require('mongoose');

var commentSchema = mongoose.Schema({
  account: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Account' },
  video: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Video' },
  createdAt: { type: Date },
  text: { type: String, default: '' },
});

commentSchema.methods.toJSON = function(loggedAccount) {
  return {
    id: this._id,
    account: this.account ? this.account.toJSON(loggedAccount) : this.account,
    createdAt: this.createdAt,
    text: this.text
  }
}

commentSchema.pre('save', function(next) {
  if (!this.isNew || !this.isModified) {
    return next();
  }

  this.createdAt = new Date();
  
  return next();
});

module.exports = mongoose.model('Comment', commentSchema);