const fs = require('fs');
const uuid = require('uuid/v4');
const Video = require('../models').video;
const Account = require('../models').account;
const Like = require('../models').like;
const Comment = require('../models').comment;
const handleError = require('../common/handle-error.js');
const handleUpload = require('../common/handle-upload.js');

module.exports = {

  /**
   * /GET /videos
   */

  async getVideos(req, res, next) {
    try {
      var query = {};
      if (req.query.title) query.title = { $regex: req.query.title, $options: 'i' };
      if (req.query.username) query.username = req.query.username;
      if (req.query.category) query.category = req.query.category;
      const limit = (req.query.limit) ? parseInt(req.query.limit) : 20;
      const skip = (req.query.page) ? ((parseInt(req.query.page)-1)*limit) : 0;
      const videos = await Video.find(query).skip(skip).limit(limit).exec();

      res.send(200, { status:200, success:true, data:videos });
      return next();
    } catch(err) { return handleError(err.message, res, next); }
  },

  /**
   * /GET /videos/:id
   */

  async getVideo(req, res, next) {
    try {
      const video = await Video.findById(req.params.id).exec();
      if (!video) throw new Error('notFoundError');
  
      res.send(200, { status:200, success:true, data:video });
      return next();
    } catch(err) { return handleError(err.message, res, next); }
  },

  /**
   * /POST /videos
   */

  async postVideo(req, res, next) {
    try {
      if (!req.auth) throw new Error('unauthorizedError');

      const self = await Account.findById(req.userid).exec();
      if (!self) throw new Error('unauthorizedError'); 
      if (!self.verified) throw new Error('verifiedError'); 

      // check video
      if (!req.files['video']) throw new Error('validationError');

      // check type
      if (req.files['video'].type !== 'video/mp4') throw new Error('validationError');

      // handle uploaded video
      const mediaId = uuid();
      const result = await handleUpload(req.files['video'].path, 'video', `videos/${mediaId}`);

      let urlToThumbnail;
      if (req.files['thumb'] && req.files['thumb'].type === 'image/jpeg') {
        const result2 = await handleUpload(req.files['thumb'].path, 'image', `thumbs/${mediaId}`);
        urlToThumbnail = result2.url;
      } else {
        const result2 = await handleUpload(result.url.replace('.mp4', '.jpg'), 'image', `thumbs/${mediaId}`);
        urlToThumbnail = result2.url;
      }

      // save video to database
      const video = new Video({
        accountId: req.userid,
        username: req.username,
        title: req.body.title,
        mediaId: result.public_id,
        width: result.width,
        height: result.height,
        urlToVideo: result.url,
        urlToThumbnail: urlToThumbnail
      });
      await video.save();

      if (req.files['thumb']) {
        fs.unlinkSync(req.files['thumb'].path);
      }

      if (req.files['video']) {
        fs.unlinkSync(req.files['video'].path);
      }
    
      res.send(201, { status:201, success:true, data:video });
      return next();
    } catch(err) { 

      if (req.files['thumb']) {
        fs.unlinkSync(req.files['thumb'].path);
      }

      if (req.files['video']) {
        fs.unlinkSync(req.files['video'].path);
      }

      return handleError(err.message, res, next); 
    }
  },

  /**
   * /PUT /videos/:id
   */

   async updateVideo(req, res, next) {
    try {
      if (!req.auth) throw new Error('unauthorizedError');

      const self = await Account.findById(req.userid).exec();
      if (!self) throw new Error('unauthorizedError');

      const video = await Video.findById(req.params.id).exec();
      if (!video) throw new Error('notFoundError');

      if (req.userid != video.accountId) throw new Error('forbiddenError');

      var update = {};
      if (req.body.title) update.title = req.body.title;
      if (req.body.caption) update.caption = req.body.caption;
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
      if (like) {
        res.send(200, { status:200, success:true });
        return next();
      }

      await new Like({accountId:req.userid,videoId:req.params.id}).save();
      await Video.updateOne({_id:req.params.id}, {$inc:{likesTotal:1}});
      await Account.updateOne({_id:req.userid}, {$inc:{likesTotal:1}});

      res.send(200, { status:200, success:true });
      return next();
    } catch(err) { return handleError(err.message, res, next); }
   },

   /**
   * /PUT /videos/:id/unlike
   */

  async unlikeVideo(req, res, next) {
    try {
      if (!req.auth) throw new Error('unauthorizedError');

      const self = await Account.findById(req.userid).exec();
      if (!self) throw new Error('unauthorizedError');

      const video = await Video.findById(req.params.id).exec();
      if (!video) throw new Error('notFoundError');

      const like = await Like.findOne({accountId:req.userid,videoId:req.params.id}).exec();
      if (!like) {
        res.send(200, { status:200, success:true });
        return next();
      }

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
   },

   /**
   * /GET /videos/:id/comments
   */

  async getVideoComments(req, res, next) {
    try {
      const video = await Video.findById(req.params.id).exec();
      if (!video) throw new Error('notFoundError');

      const limit = (req.query.limit) ? parseInt(req.query.limit) : 20;
      const skip = (req.query.page) ? ((parseInt(req.query.page)-1)*limit) : 0;
      const comments = await Comment
        .find({videoId:req.params.id})
        .skip(skip).limit(limit).exec();

      res.send(200, { status:200, success:true, data:comments });
      return next();
    } catch(err) { handleError(err.message, res, next); }
  }

}