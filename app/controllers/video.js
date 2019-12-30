const Video = require('../models').video;
const Account = require('../models').account;
const Comment = require('../models').comment;

function buildResponse(status, data) {
  return {
    status,
    success: (status >= 400) ? false : true,
    data
  }
}

module.exports = {

  /**
   * /GET /videos
   */

  async getVideos(req, res, next) {
    try {
      var query = {};
      if (req.query.title) query.title = { $regex: req.query.title, $options: 'i' };
      if (req.query.accountid) query.account = req.query.accountid;
      if (req.query.category) query.category = req.query.category;
      const limit = (req.query.limit) ? parseInt(req.query.limit) : 20;
      const skip = (req.query.page) ? ((parseInt(req.query.page)-1)*limit) : 0;
      const videos = await Video
        .find(query)
        .populate('account')
        .skip(skip)
        .limit(limit)
        .sort({createdAt:-1})
        .exec();

      if (req.auth) {
        const self = await Account.findById(req.userid).exec();
        res.send(200, buildResponse(200, videos.map(video => video.toJSON(self))));
        return next();
      }

      res.send(200, buildResponse(200, videos.map(video => video.toJSON())));
      return next();
    } catch(err) { 
      console.log(err);
      res.send(500, buildResponse(500, { message: 'Internal server error' }));
      return next();
     }
  },

  /**
   * /GET /videos/:id
   */

  async getVideo(req, res, next) {
    try {
      const video = await Video
        .findById(req.params.id)
        .populate('account')
        .exec();
      if (!video) {
        res.send(404, buildResponse(404, { message: 'Video is not found' }));
        return next();
      }

      if (req.auth) {
        const self = await Account.findById(req.userid).exec();
        res.send(200, buildResponse(200, video.toJSON(self)));
        return next();
      }

      res.send(200, buildResponse(200, video.toJSON()));
      return next();
    } catch(err) { 
      console.log(err);
      res.send(500, buildResponse(500, { message: 'Internal server error' }));
      return next();
     }
  },

  /**
   * /POST /videos
   */

  async postVideo(req, res, next) {
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

      if (!req.body.title || !req.body.urlToVideo) {
        res.send(400, buildResponse(400, { 
          message: 'Required parameters is not found' 
        }));
        return next();
      }

      if (req.body.title.length < 4) {
        res.send(400, buildResponse(400, { 
          message: 'Title must be atleast 4 characters' 
        }));
        return next();
      }

      const self = await Account.findById(req.userid).exec();
      if (!self) {
        res.send(401, buildResponse(401, { 
          message: 'This method requires authentication'
        }));
        return next();
      }

      const video = new Video({
        account: req.userid,
        title: req.body.title,
        caption: req.body.caption || '',
        urlToVideo: req.body.urlToVideo,
        urlToThumbnail: req.body.urlToThumbnail
      });
      await video.save();
      const data = await video.populate('account').execPopulate();
    
      res.send(201, buildResponse(201, data.toJSON(self)));
      return next();
    } catch(err) { 
      res.send(500, buildResponse(500, { message: 'Internal server error' }));
      return next();
     }
  },

  /**
   * /PUT /videos/:id
   */

   async updateVideo(req, res, next) {
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

      const self = await Account.findById(req.userid).exec();
      if (!self) {
        res.send(401, buildResponse(401, { 
          message: 'This method requires authentication'
        }));
        return next();
      }

      const video = await Video
        .findById(req.params.id)
        .populate('account')
        .exec();
      if (!video) {
        res.send(404, buildResponse(404, { message: 'Video is not found' }));
        return next();
      }

      if (req.userid != video.account._id) {
        res.send(403, buildResponse(403, { 
          message: 'Forbidden action'
        }));
        return next();
      }

      if (req.body.title) video.title = req.body.title;
      if (req.body.caption) video.caption = req.body.caption;
      if (req.body.urlToVideo) video.urlToVideo = req.body.urlToVideo;
      if (req.body.urlToThumbnail) video.urlToThumbnail = req.body.urlToThumbnail;
      await video.save();

      res.send(200, buildResponse(200, video.toJSON(self)));
      return next();
    } catch(err) { 
      res.send(500, buildResponse(500, { message: 'Internal server error' }));
      return next();
     }
  },

  /**
   * /DELETE /videos/:id
   */

   async deleteVideo(req, res, next) {
    try {
      if (!req.auth) {
        res.send(401, buildResponse(401, { 
          message: 'This method requires authentication'
        }));
        return next();
      }

      const self = await Account.findById(req.userid).exec();
      if (!self) {
        res.send(401, buildResponse(401, { 
          message: 'This method requires authentication'
        }));
        return next();
      }

      const video = await Video.findById(req.params.id).exec();
      if (!video) {
        res.send(404, buildResponse(404, { message: 'Video is not found' }));
        return next();
      }

      if (req.userid != video.account) {
        res.send(403, buildResponse(403, { 
          message: 'Forbidden action'
        }));
        return next();
      }

      await Video.deleteOne({_id:req.params.id});
      await Comment.deleteMany({video:req.params.id});

      res.send(200, buildResponse(200));
      return next();
    } catch(err) { 
      res.send(500, buildResponse(500, { message: 'Internal server error' }));
      return next();
     }
  },

   /**
   * /PUT /videos/:id/like
   */

   async likeVideo(req, res, next) {
    try {
      if (!req.auth) {
        res.send(401, buildResponse(401, { 
          message: 'This method requires authentication'
        }));
        return next();
      }

      const video = await Video.findById(req.params.id).exec();
      if (!video) {
        res.send(404, buildResponse(404, { message: 'Video is not found' }));
        return next();
      }

      const result = await Account
        .updateOne({_id:req.userid}, {$addToSet:{likes:req.params.id}});

      if (!result.nModified) {
        res.send(403, buildResponse(403, { 
          message: 'Forbidden action'
        }));
        return next();
      }

      await Video.updateOne({_id:req.params.id}, {$inc:{likesTotal:1}});

      res.send(200, buildResponse(200));
      return next();
    } catch(err) { 
      res.send(500, buildResponse(500, { message: 'Internal server error' }));
      return next();
     }
   },

   /**
   * /DELETE /videos/:id/like
   */

  async unlikeVideo(req, res, next) {
    try {
      if (!req.auth) {
        res.send(401, buildResponse(401, { 
          message: 'This method requires authentication'
        }));
        return next();
      }

      const video = await Video.findById(req.params.id).exec();
      if (!video) {
        res.send(404, buildResponse(404, { message: 'Video is not found' }));
        return next();
      }

      const result = await Account
        .updateOne({_id:req.userid}, {$pull:{likes:req.params.id}});
        
      if (!result.nModified) {
        res.send(403, buildResponse(403, { 
          message: 'Forbidden action'
        }));
        return next();
      }

      await Video.updateOne({_id:req.params.id}, {$inc:{likesTotal:-1}});

      res.send(200, buildResponse(200));
      return next();
    } catch(err) { 
      res.send(500, buildResponse(500, { message: 'Internal server error' }));
      return next();
     }
   },

   /**
   * /POST /videos/:id/comment
   */

  async commentVideo(req, res, next) {
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

      const self = await Account.findById(req.userid).exec();
      if (!self) {
        res.send(401, buildResponse(401, { 
          message: 'This method requires authentication'
        }));
        return next();
      } 

      const video = await Video.findById(req.params.id).exec();
      if (!video) {
        res.send(404, buildResponse(404, { message: 'Video is not found' }));
        return next();
      }

      const comment = new Comment({
        account: self._id,
        video: req.params.id,
        text: (req.body.text) ? req.body.text : ''
      });
      await comment.save();
      await Video.updateOne({_id:req.params.id}, {$inc:{commentsTotal:1}});
      const data = await comment.populate('account').execPopulate();

      res.send(201, buildResponse(201, data.toJSON(self)));
      return next();
    } catch(err) { 
      console.log(err)
      res.send(500, buildResponse(500, { message: 'Internal server error' }));
      return next();
     }
   }

}