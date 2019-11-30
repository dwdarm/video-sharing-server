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
  private: { type: Boolean, default: false },
  about: { type: String, default: '' },
  subscribe: [{type: mongoose.Schema.Types.ObjectId, ref: 'Account'}],
  subscribersTotal: { type: Number, default: 0 },
  likesTotal: { type: Number, default: 0 },
  saved:[{type: mongoose.Schema.Types.ObjectId, ref: 'Video'}],
  verified: { type: Boolean, default: true },
});

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

accountSchema.post('save', function(err, doc, next) {
  if (err.name === 'MongoError' && err.code === 11000) {
    return next(new Error('duplicateKeyError'));
  }

  return next();
});

module.exports = mongoose.model('Account', accountSchema);