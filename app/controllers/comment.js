const Account = require('../models').account;
const Comment = require('../models').comment;
const Video = require('../models').video;

function buildResponse(status, data) {
  return {
    status,
    success: (status >= 400) ? false : true,
    data
  }
}

module.exports = {

  /**
   * /GET /comments
   */ 

  async getComments(req, res, next) {
    try {
      var query = {};
      if (req.query.accountid) query.account = req.query.accountid;
      if (req.query.videoid) query.video = req.query.videoid;
      const limit = (req.query.limit) ? parseInt(req.query.limit) : 20;
      const skip = (req.query.page) ? ((parseInt(req.query.page)-1)*limit) : 0;
      const comments = await Comment
        .find(query)
        .populate('account')
        .sort({createdAt:-1})
        .skip(skip)
        .limit(limit)
        .exec();

      if (req.auth) {
        const self = await Account.findById(req.userid).exec();
        res.send(
          200,
          buildResponse(
            200, 
            comments.map(comment => comment ? comment.toJSON(self) : null)
          )
        );
        return next();
      }
  
      res.send(
        200,
        buildResponse(
          200, 
          comments.map(comment => comment ? comment.toJSON() : null)
        )
      );
      return next();
    } catch(err) { 
      console.log(err);
      res.send(500, buildResponse(500, { message: 'Internal server error' }));
      return next();
     }
  },

  /**
   * /GET /comments/:id
   */ 

  async getComment(req, res, next) {
    try {
      const comment = await Comment
        .findById(req.params.id)
        .populate('account')
        .exec();
        
      if (!comment) {
        res.send(404, buildResponse(404, { message: 'Comments is not found' }));
        return next();
      }

      if (req.auth) {
        const self = await Account.findById(req.userid).exec();
        res.send(
          200,
          buildResponse(200, comment.toJSON(self))
        );
        return next();
      }

      res.send(
        200,
        buildResponse(200, comment.toJSON())
      );
      return next();
    } catch(err) { 
      console.log(err);
      res.send(500, buildResponse(500, { message: 'Internal server error' }));
      return next();
     }
  },

  /**
   * /PUT /comments/:id
   */ 

  async updateComment(req, res, next) {
    try {
      if (!req.auth) {
        res.send(401, buildResponse(401, { 
          message: 'This method requires authentication'
        }));
        return next();
      }

      if (!req.body) {
        res.send(400, buildResponse(400, { message: 'Empty request body' }));
        return next();
      }

      const comment = await Comment
        .findById(req.params.id)
        .populate('account')
        .exec();
      
      if (!comment) {
        res.send(404, buildResponse(404, { message: 'Comments is not found' }));
        return next();
      }

      if (req.userid != comment.account._id) {
        res.send(403, buildResponse(403, { message: 'Forbidden action' }));
        return next();
      }

      if (req.body.text) comment.text = req.body.text;
      await comment.save();

      res.send(200, buildResponse(200, comment.toJSON()));
      return next();
    } catch(err) { 
      console.log(err);
      res.send(500, buildResponse(500, { message: 'Internal server error' }));
      return next();
     }
  },

  /**
   * /DELETE /comments/:id
   */ 

  async deleteComment(req, res, next) {
    try {
      if (!req.auth) {
        res.send(401, buildResponse(401, { 
          message: 'This method requires authentication'
        }));
        return next();
      }

      const comment = await Comment.findById(req.params.id).exec();
      if (!comment) {
        res.send(404, buildResponse(404, { message: 'Comments is not found' }));
        return next();
      }

      if (req.userid != comment.account) {
        res.send(403, buildResponse(403, { message: 'Forbidden action' }));
        return next();
      }

      const videoId = comment.video;
      await Comment.deleteOne({_id:req.params.id});
      await Video.updateOne({_id:videoId}, {$inc:{commentsTotal:-1}});

      res.send(200, buildResponse(200));
      return next();
    } catch(err) { 
      console.log(err);
      res.send(500, buildResponse(500, { message: 'Internal server error' }));
      return next();
     }
  },

}