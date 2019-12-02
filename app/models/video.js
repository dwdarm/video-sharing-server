const mongoose = require('mongoose');

var videoSchema = mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, required: true },
  username: { type: String, required: true },
  title: { type: String, required: true },
  caption: { type: String, default: '' },
  createdAt: { type: Date },
  urlToVideo: { type: String, required: true },
  urlToThumbnail: { type: String },
  viewsTotal: { type: Number, default: 0 },
  likesTotal: { type: Number, default: 0 },
  commentsTotal: { type: Number, default: 0 },
  category: { type: String, default: 'general'},
  public: { type: Boolean, default: true }
});

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