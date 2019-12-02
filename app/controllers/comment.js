const Account = require('../models').account;
const Comment = require('../models').comment;
const Video = require('../models').video;
const handleError = require('../common/handle-error.js');

module.exports = {

  /**
   * /GET /comments
   */ 

  async getComments(req, res, next) {
    try {
      var query = {};
      if (req.query.accountid) query.accountId = req.query.accountid;
      if (req.query.videoid) query.videoId = req.query.videoid;
      if (req.query.root) query.isRoot = req.query.root;
      if (req.query.parentid) query.parentId = req.query.parentid;
      const limit = (req.query.limit) ? parseInt(req.query.limit) : 20;
      const skip = (req.query.page) ? ((parseInt(req.query.page)-1)*limit) : 0;
      const comments = await Comment.find(query).skip(skip).limit(limit).exec();

      res.send(200, { status:200, success:true, data:comments });
      return next();
    } catch(err) { return handleError(err.message, res, next); }
  },

  /**
   * /GET /comments/:id
   */ 

  async getComment(req, res, next) {
    try {
      const comment = await Comment.findById(req.params.id).exec();
      if (!comment) throw new Error('notFoundError');

      res.send(200, { status:200, success:true, data:comment });
      return next();
    } catch(err) { return handleError(err.message, res, next); }
  },

  /**
   * /PUT /comments/:id
   */ 

  async updateComment(req, res, next) {
    try {
      if (!req.auth) throw new Error('unauthorizedError');
      if (!req.body) throw new Error('emptyBodyError');

      const comment = await Comment.findById(req.params.id).exec();
      if (!comment) throw new Error('notFoundError');
      if (req.userid != comment.accountId) throw new Error('forbiddenError');

      var update = {};
      if (req.body.text) update.text = req.body.text;
      await Comment.updateOne({_id:req.params.id}, {$set:update});

      res.send(200, { status:200, success:true });
      return next();
    } catch(err) { return handleError(err.message, res, next); }
  },

  /**
   * /DELETE /comments/:id
   */ 

  async deleteComment(req, res, next) {
    try {
      if (!req.auth) throw new Error('unauthorizedError');

      const comment = await Comment.findById(req.params.id).exec();
      if (!comment) throw new Error('notFoundError');
      if (req.userid != comment.accountId) {
        if (req.role > 1) throw new Error('forbiddenError');
      }

      const videoID = comment.videoId;
      await Comment.deleteOne({_id:req.params.id});
      await Comment.deleteMany({parentId:req.params.id});
      await Video.updateOne({_id:videoID}, {$inc:{commentsTotal:-1}});

      res.send(200, { status:200, success:true });
      return next();
    } catch(err) { return handleError(err.message, res, next); }
  },

  /**
   * /POST /comments/:id/reply
   */ 

  async replyComment(req, res, next) {
    try {
      if (!req.auth) throw new Error('unauthorizedError');
      if (!req.body) throw new Error('emptyBodyError');

      const self = await Account.findById(req.userid).exec();
      if (!self) throw new Error('unauthorizedError'); 
      if (!self.verified) throw new Error('verifiedError'); 

      const parent = await Comment.findById(req.params.id).exec();
      if (!parent) throw new Error('notFoundError');

      const comment = new Comment({
        accountId: self._id,
        videoId: parent.videoId,
        isRoot: false,
        parentId: parent._id,
        text: (req.body.text) ? req.body.text : ''
      });
      await comment.save();

      await Comment.updateOne({_id:parent._id}, {$inc:{childsTotal:1}});

      res.send(201, { status:201, success:true, data:comment });
      return next();
    } catch(err) { return handleError(err.message, res, next); }
  }

}