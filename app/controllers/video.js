const Video = require('../models').video;
const Account = require('../models').account;
const Like = require('../models').like;
const Comment = require('../models').comment;
const handleError = require('../common/handle-error.js');

module.exports = {

  /**
   * /GET /videos
   */

  async getVideos(req, res, next) {
    try {
      var query = {};
      if (req.query.title) query.title = { $regex: req.query.title, $options: 'i' };
      if (req.query.accountid) query.accountId = req.query.accountid;
      if (req.query.category) query.category = req.query.category;
      const limit = (req.query.limit) ? parseInt(req.query.limit) : 20;
      const skip = (req.query.page) ? ((parseInt(req.query.page)-1)*limit) : 0;
      const videos = await Video
        .find(query)
        .populate('accountId', '-subscribe -saved -password -role')
        .skip(skip)
        .limit(limit)
        .sort({createdAt:-1})
        .exec();

      if (req.auth) {
        const self = await Account.findById(req.userid);
        if (self) {
          var results = [];
          const accounts = videos.accountId._doc;
          accounts.forEach(account => {
            if (req.userid != account._id) {
              results.push({
                ...account,
                isSubscribed: self.subscribe.indexOf(account._id) != -1
              })
            } else {
              results.push(account);
            }
          });
          res.send(200, { 
            status:200, 
            success:true, 
            data: Object.assign({}, videos._doc, {accountId:results})
          });
          return next();
        }
      }

      res.send(200, { status:200, success:true, data:videos });
      return next();
    } catch(err) { return handleError(err.message, res, next); }
  },

  /**
   * /GET /videos/:id
   */

  async getVideo(req, res, next) {
    try {
      const video = await Video
        .findById(req.params.id)
        .populate('accountId', '-subscribe -saved -password -role')
        .exec();
      if (!video) throw new Error('notFoundError');

      if (!req.auth) {
        res.send(200, { status:200, success:true, data:video });
        return next();
      }

      const self = await Account.findById(req.userid).exec();
      if(!self) {
        res.send(200, { status:200, success:true, data:video });
        return next();
      }

      const account = {
        ...video.accountId._doc,
        isSubscribed: self.subscribe.indexOf(video.accountId._id) != -1
      }
      const like = await Like.findOne({accountId:req.userid, videoId:req.params.id}).exec();
      const isLiked = (like) ? true : false;

      res.send(200, { 
        status: 200, 
        success: true, 
        data: Object.assign({}, video._doc, {
          accountId: account,
          isLiked
        })
      });
      return next();
    } catch(err) { return handleError(err.message, res, next); }
  },

  /**
   * /POST /videos
   */

  async postVideo(req, res, next) {
    try {
      if (!req.auth) throw new Error('unauthorizedError');
      if (!req.body) throw new Error('emptyBodyError');
      if (!req.body.title || !req.body.urlToVideo) throw new Error('parametersError');
      if (req.body.title.length < 4) throw new Error('parametersError');

      const self = await Account.findById(req.userid).exec();
      if (!self) throw new Error('unauthorizedError'); 
      if (!self.verified) throw new Error('verifiedError'); 

      const video = new Video({
        accountId: req.userid,
        title: req.body.title,
        caption: req.body.caption,
        urlToVideo: req.body.urlToVideo,
        urlToThumbnail: req.body.urlToThumbnail
      });
      await video.save();
    
      res.send(201, { status:201, success:true, data:video });
      return next();

    } catch(err) { return handleError(err.message, res, next); }
  },

  /**
   * /PUT /videos/:id
   */

   async updateVideo(req, res, next) {
    try {
      if (!req.auth) throw new Error('unauthorizedError');
      if (!req.body) throw new Error('emptyBodyError');

      const self = await Account.findById(req.userid).exec();
      if (!self) throw new Error('unauthorizedError');

      const video = await Video.findById(req.params.id).exec();
      if (!video) throw new Error('notFoundError');

      if (req.userid != video.accountId) throw new Error('forbiddenError');

      var update = {};
      if (req.body.title) update.title = req.body.title;
      if (req.body.caption) update.caption = req.body.caption;
      if (req.body.urlToVideo) update.urlToVideo = req.body.urlToVideo;
      if (req.body.urlToThumbnail) update.urlToThumbnail = req.body.urlToThumbnail;
      if (req.body.public !== undefined) update.public = req.body.public;
      await Video.updateOne({_id:req.params.id}, {$set:update});

      res.send(200, { status:200, success:true });
      return next();
    } catch(err) { return handleError(err.message, res, next); }
  },

  /**
   * /DELETE /videos/:id
   */

   async deleteVideo(req, res, next) {
    try {
      if (!req.auth) throw new Error('unauthorizedError');

      const self = await Account.findById(req.userid).exec();
      if (!self) throw new Error('unauthorizedError');

      const video = await Video.findById(req.params.id).exec();
      if (!video) throw new Error('notFoundError');

      if (req.userid != video.accountId) {
        if (req.role > 1) throw new Error('forbiddenError');
      }

      await Video.deleteOne({_id:req.params.id});
      res.send(200, { status:200, success:true });
      return next();
    } catch(err) { return handleError(err.message, res, next); }
  },

   /**
   * /PUT /videos/:id/like
   */

   async likeVideo(req, res, next) {
    try {
      if (!req.auth) throw new Error('unauthorizedError');

      const self = await Account.findById(req.userid).exec();
      if (!self) throw new Error('unauthorizedError');

      const video = await Video.findById(req.params.id).exec();
      if (!video) throw new Error('notFoundError');

      const like = await Like.findOne({accountId:req.userid,videoId:req.params.id}).exec();
      if (like) throw new Error('forbiddenError');

      await new Like({accountId:req.userid,videoId:req.params.id}).save();
      await Video.updateOne({_id:req.params.id}, {$inc:{likesTotal:1}});
      await Account.updateOne({_id:req.userid}, {$inc:{likesTotal:1}});

      res.send(200, { status:200, success:true });
      return next();
    } catch(err) { return handleError(err.message, res, next); }
   },

   /**
   * /DELETE /videos/:id/like
   */

  async unlikeVideo(req, res, next) {
    try {
      if (!req.auth) throw new Error('unauthorizedError');

      const self = await Account.findById(req.userid).exec();
      if (!self) throw new Error('unauthorizedError');

      const video = await Video.findById(req.params.id).exec();
      if (!video) throw new Error('notFoundError');

      const like = await Like.findOne({accountId:req.userid,videoId:req.params.id}).exec();
      if (!like) throw new Error('forbiddenError');

      await Like.deleteOne({_id:like._id});
      await Video.updateOne({_id:req.params.id}, {$inc:{likesTotal:-1}});
      await Account.updateOne({_id:req.userid}, {$inc:{likesTotal:-1}});

      res.send(200, { status:200, success:true });
      return next();
    } catch(err) { return handleError(err.message, res, next); }
   },

   /**
   * /POST /videos/:id/comment
   */

  async commentVideo(req, res, next) {
    try {
      if (!req.auth) throw new Error('unauthorizedError');
      if (!req.body) throw new Error('emptyBodyError');

      const self = await Account.findById(req.userid).exec();
      if (!self) throw new Error('unauthorizedError');
      if (!self.verified) throw new Error('verifiedError'); 

      const video = await Video.findById(req.params.id).exec();
      if (!video) throw new Error('notFoundError');

      const comment = new Comment({
        accountId: self._id,
        videoId: req.params.id,
        text: (req.body.text) ? req.body.text : ''
      });
      await comment.save();
      await Video.updateOne({_id:req.params.id}, {$inc:{commentsTotal:1}});

      res.send(201, { status:201, success:true, data:comment });
      return next();
    } catch(err) { return handleError(err.message, res, next); }
   }

}