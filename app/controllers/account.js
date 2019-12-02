const Account = require('../models').account;
const Like = require('../models').like;
const handleError = require('../common/handle-error.js');
const validation = require('../common/validation.js');

module.exports = {

  /**
   * /GET /accounts
   */

  async getAccounts(req, res, next) {
    try {
      const username = (req.query.username) ? {username:req.query.username} : undefined;
      const limit = (req.query.limit) ? parseInt(req.query.limit) : 20;
      const skip = (req.query.page) ? ((parseInt(req.query.page)-1)*limit) : 0;
      const accounts = await Account
        .find(username, '-subscribe -saved -password -role -verified')
        .skip(skip).limit(limit).exec();

      res.send(200, { status:200, success:true, data:accounts });
      return next();
    } catch(err) { handleError(err.message, res, next); }
  },

  /**
   * /GET /accounts/:id
   */

  async getAccount(req, res, next) {
    try {
      var userid = req.params.id;
  
      if (userid == 'me') {
        if (!req.auth) throw new Error('unauthorizedError');
        userid = req.userid;
      }
  
      const account = await Account.findById(userid, '-subscribe -saved -password -role').exec();
      if (!account) throw new Error('notFoundError');
    
      res.send(200, { status:200, success:true, data:account });
      return next();
    } catch(err) { handleError(err.message, res, next); }
  },

  /**
   * /POST /accounts
   */

  async postAccount(req, res, next) {
    try {
      if (!req.body) throw new Error('emptyBodyError');
      if (!req.body.username || 
          !req.body.email || 
          !req.body.password) throw new Error('parametersError');
      if (!validation.isUsername(req.body.username)) throw new Error('validationError');
      if (!validation.isEmail(req.body.email)) throw new Error('validationError');
      if (req.body.password.length < 8) throw new Error('validationError');

      const account = new Account({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password
      });
      await account.save();
      res.send(201, { status:201, success:true });
      return next();
    } catch(err) { handleError(err.message, res, next); }
  },

  /**
   * /PUT /accounts/:id
   */

  async updateAccount(req, res, next) {
    try {
      if (!req.auth) throw new Error('unauthorizedError');
      if (req.userid != req.params.id) throw new Error('forbiddenError');
      if (!req.body) throw new Error('emptyBodyError');

      var update = {};
      if (req.body.about) update.about = req.body.about;
      if (req.body.private !== undefined) update.private = req.body.private;
      if (req.body.urlToAvatar) update.urlToAvatar = req.body.urlToAvatar;

      await Account.updateOne({_id:req.params.id}, {$set: update}).exec();

      res.send(200, { status:200, success:true });
      return next();
    } catch(err) { handleError(err.message, res, next); }
  },

  /**
   * /GET /accounts/:id/subscriptions
   */

  async getAccountSubscriptions(req, res, next) {
    try {
      if (!req.auth) throw new Error('unauthorizedError');
      if (req.userid != req.params.id) throw new Error('forbiddenError');
  
      const subs = await Account
        .findById(req.userid, 'subscribe')
        .populate('subscribe', '-subscribe -saved -password -role')
        .exec();
      if (!subs) throw new Error('notFoundError');
    
      res.send(200, { status:200, success:true, data:subs.subscribe });
      return next();
    } catch(err) { handleError(err.message, res, next); }
  },

  /**
   * /PUT /accounts/:id/subscribe
   */

  async subscribeAccount(req, res, next) {
    try {
      if (!req.auth) throw new Error('unauthorizedError');
      if (req.userid == req.params.id) throw new Error('forbiddenError');
  
      const result = await Account.updateOne({_id:req.userid}, {$addToSet:{subscribe:req.params.id}});
      if (result.nModified) await Account.updateOne({_id:req.params.id}, {$inc:{subscribersTotal:1}});
  
      res.send(200, { status:200, success:true });
      return next();
    } catch(err) { handleError(err.message, res, next); }
  },

  /**
   * /DELETE /accounts/:id/subscribe
   */

  async unsubscribeAccount(req, res, next) {
    try {
      if (!req.auth) throw new Error('unauthorizedError');
      if (req.userid == req.params.id) throw new Error('forbiddenError');
  
      const result = await Account.updateOne({_id:req.userid}, {$pull:{subscribe:req.params.id}});
      if (result.nModified) await Account.updateOne({_id:req.params.id}, {$inc:{subscribersTotal:-1}});
      
      res.send(200, { status:200, success:true });
      return next();
    } catch(err) { handleError(err.message, res, next); }
  },

  /**
   * /GET /accounts/:id/likes
   */

  async getAccountLikes(req, res, next) {
    try {
      if (!req.auth) throw new Error('unauthorizedError');
      if (req.userid != req.params.id) throw new Error('forbiddenError');

      const limit = (req.query.limit) ? parseInt(req.query.limit) : 20;
      const skip = (req.query.page) ? ((parseInt(req.query.page)-1)*limit) : 0;
      const likes = await Like
        .find({accountId:req.params.id})
        .populate('videoId')
        .skip(skip).limit(limit).exec();

      res.send(200, { status:200, success:true, data:likes });
      return next();
    } catch(err) { handleError(err.message, res, next); }
  }

}