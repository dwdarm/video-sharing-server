const mongoose = require('mongoose');

var videoSchema = mongoose.Schema({
  account: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Account' },
  title: { type: String, required: true },
  caption: { type: String, default: '' },
  createdAt: { type: Date },
  urlToVideo: { type: String, required: true },
  urlToThumbnail: { type: String },
  viewsTotal: { type: Number, default: 0 },
  likesTotal: { type: Number, default: 0 },
  category: { type: String, default: 'general'},
  commentsTotal: { type: Number, default: 0 }
});

videoSchema.methods.toJSON = function(loggedAccount) {
  return {
    id: this._id,
    account: this.account ? this.account.toJSON(loggedAccount) : this.account,
    title: this.title,
    caption: this.caption,
    createdAt: this.createdAt,
    urlToVideo: this.urlToVideo,
    urlToThumbnail: this.urlToThumbnail,
    viewsTotal: this.viewsTotal,
    likesTotal: this.likesTotal,
    category: this.category,
    commentsTotal: this.commentsTotal,
    isLiked: loggedAccount ? loggedAccount.isLiked(this._id) : false
  }
}

videoSchema.pre('save', function(next) {
  if (!this.isNew || !this.isModified) return next();

  this.createdAt = new Date();

  switch(this.category.toLowerCase()) {
    case 'bussiness':
    case 'education':
    case 'entertainment':
    case 'news':
    case 'science-tech':
    case 'sport':
      break;
    default:
      this.category = 'general'
      break;
  }

  return next ();
});

module.exports = mongoose.model('Video', videoSchema);