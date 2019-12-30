const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const {saltRounds} = require('../config');

var accountSchema = mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date },
  role: { type: Number, default: 3 },
  email: { type: String, required: true, unique: true },
  urlToAvatar: { type: String },
  about: { type: String, default: '' },
  likes: [{type: mongoose.Schema.Types.ObjectId, ref: 'Video'}],
  subscribes: [{type: mongoose.Schema.Types.ObjectId, ref: 'Account'}],
  subscribersTotal: { type: Number, default: 0 },
});

accountSchema.methods.toJSON = function(loggedAccount) {
  return {
    id: this._id,
    username: this.username,
    createdAt: this.createdAt,
    urlToAvatar: this.urlToAvatar,
    about: this.about,
    subscribersTotal: this.subscribersTotal,
    isSubscribed: loggedAccount ? loggedAccount.isSubscribed(this._id) : false
  }
}

accountSchema.methods.isLiked = function(id) {
  return this.likes.indexOf(id) !== -1;
}

accountSchema.methods.isSubscribed = function(id) {
  return this.subscribes.indexOf(id) !== -1;
}

accountSchema.pre('save', function(next) {
  if (!this.isNew || !this.isModified) {
    return next();
  }

  var account = this;
  bcrypt.hash(account.password, saltRounds, function(err, hash) {
    if (err) {
      return next(new Error('internalServerError'));
    };

    account.password = hash;
    account.createdAt = new Date();
    return next ();
  });
});

module.exports = mongoose.model('Account', accountSchema);