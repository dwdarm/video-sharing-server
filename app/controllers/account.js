const Account = require('../models').account;
const validation = require('../common/validation.js');

function buildResponse(status, data) {
  return {
    status,
    success: (status >= 400) ? false : true,
    data
  }
}

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
        .find(username)
        .skip(skip)
        .limit(limit)
        .exec(); 

      if (req.auth) {
        const self = await Account.findById(req.userid).exec();
        res.send(
          200,
          buildResponse(200, accounts.map(account => account.toJSON(self)))
        );
        return next();
      }

      res.send(200, { 
        status: 200, 
        success: true, 
        data: accounts.map(account => account.toJSON())
      });
      return next();
    } catch(err) { 
      console.log(err);
      res.send(500, buildResponse(500, { message: 'Internal server error' }));
      return next();
     }
  },

  /**
   * /GET /accounts/:id
   */

  async getAccount(req, res, next) {
    try {
      const account = await Account.findById(req.params.id).exec();
      if (!account) {
        res.send(404, buildResponse(404, { message: 'Account is not found' }));
        return next();
      }

      if (req.auth) {
        const self = await Account.findById(req.userid).exec();
        res.send(
          200,
          buildResponse(200, account.toJSON(self))
        );
        return next();
      }

      res.send(200, {status: 200, success: true, data: account.toJSON()});
      return next();
    } catch(err) { 
      console.log(err);
      res.send(500, buildResponse(500, { message: 'Internal server error' }));
      return next();
    }
  },

  /**
   * /POST /accounts
   */

  async postAccount(req, res, next) {
    try {
      if (!req.body) {
        res.send(400, buildResponse(400, { message: 'Empty request body' }));
        return next();
      }

      if (!req.body.username || 
          !req.body.email || 
          !req.body.password) {
          res.send(400, buildResponse(400, { 
            message: 'Required parameters is not found' 
          }));
          return next();
        }
      
      if (!validation.isUsername(req.body.username)) {
        res.send(400, buildResponse(400, { message: 'Invalid username' }));
        return next();
      }

      if (!validation.isEmail(req.body.email)) {
        res.send(400, buildResponse(400, { message: 'Invalid E-mail' }));
        return next();
      }

      if (req.body.password.toString().length < 8) {
        res.send(400, buildResponse(400, { 
          message: 'Invalid password. Must be atleast 8 characters'
        }));
        return next();
      }

      const account = new Account({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password.toString()
      });
      await account.save();

      res.send(201, buildResponse(201, account.toJSON()));
      return next();
    } catch(err) { 
      if (err.code === 11000) {
        res.send(403, buildResponse(403, { 
          message: 'Username or E-mail is already used' 
        }));
        return next();
      }

      console.log(err);
      res.send(500, buildResponse(500, { message: 'Internal server error' }));
      return next();
     }
  },

  /**
   * /PUT /accounts/:id
   */

  async updateAccount(req, res, next) {
    try {
      if (!req.auth) {
        res.send(401, buildResponse(401, { 
          message: 'This method requires authentication'
        }));
        return next();
      }

      if (req.userid != req.params.id) {
        res.send(403, buildResponse(403, { 
          message: 'Forbidden action'
        }));
        return next();
      }

      if (!req.body) {
        res.send(400, buildResponse(400, { message: 'Empty request body' }));
        return next();
      }

      const account = await Account.findById(req.params.id).exec();
      if (!account) {
        res.send(400, buildResponse(400, { message: 'Account is not found' }));
        return next();
      }

      if (req.body.about) { account.about = req.body.about; }
      if (req.body.urlToAvatar) { account.urlToAvatar = req.body.urlToAvatar; }
      await account.save();

      res.send(200, buildResponse(200, account.toJSON()));
      return next();
    } catch(err) { 
      console.log(err);
      res.send(500, buildResponse(500, { message: 'Internal server error' }));
      return next();
     }
  },

  /**
   * /GET /accounts/:id/subscriptions
   */

  async getAccountSubscriptions(req, res, next) {
    try {
      if (!req.auth) {
        res.send(401, buildResponse(401, { 
          message: 'This method requires authentication'
        }));
        return next();
      }

      if (req.userid != req.params.id) {
        res.send(403, buildResponse(403, { 
          message: 'Forbidden accesss'
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
  
      const account = await Account
        .findById(req.userid)
        .populate('subscribes')
        .exec();

      if (!account) {
        res.send(404, buildResponse(404, { 
          message: 'Account is not found'
        }));
        return next();
      }
    
      res.send(
        200, 
        buildResponse(
          200, 
          account.subscribes.map(item => item ? item.toJSON(self) : null)
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
   * /PUT /accounts/:id/subscribe
   */

  async subscribeAccount(req, res, next) {
    try {
      if (!req.auth) {
        res.send(401, buildResponse(401, { 
          message: 'This method requires authentication'
        }));
        return next();
      }

      if (req.userid == req.params.id) {
        res.send(403, buildResponse(403, { 
          message: 'Forbidden action'
        }));
        return next();
      }
  
      const result = await Account
        .updateOne({_id:req.userid}, {$addToSet:{subscribes:req.params.id}});

      if (!result.nModified) {
        res.send(403, buildResponse(403, { 
          message: 'Forbidden action'
        }));
        return next();
      }

      await Account.updateOne({_id:req.params.id}, {$inc:{subscribersTotal:1}});
  
      res.send(200, buildResponse(200));
      return next();
    } catch(err) { 
      console.log(err);
      res.send(500, buildResponse(500, { message: 'Internal server error' }));
      return next();
     }
  },

  /**
   * /DELETE /accounts/:id/subscribe
   */

  async unsubscribeAccount(req, res, next) {
    try {
      if (!req.auth) {
        res.send(401, buildResponse(401, { 
          message: 'This method requires authentication'
        }));
        return next();
      }

      if (req.userid == req.params.id) {
        res.send(403, buildResponse(403, { 
          message: 'Forbidden action'
        }));
        return next();
      }
  
      const result = await Account
        .updateOne({_id:req.userid}, {$pull:{subscribes:req.params.id}});

      if (!result.nModified) {
        res.send(403, buildResponse(403, { 
          message: 'Forbidden action'
        }));
        return next();
      }

      await Account.updateOne({_id:req.params.id}, {$inc:{subscribersTotal:-1}});
      
      res.send(200, buildResponse(200));
      return next();
    } catch(err) { 
      console.log(err);
      res.send(500, buildResponse(500, { message: 'Internal server error' }));
      return next();
     }
  },

  /**
   * /GET /accounts/:id/likes
   */

  async getAccountLikes(req, res, next) {
    try {
      if (!req.auth) {
        res.send(401, buildResponse(401, { 
          message: 'This method requires authentication'
        }));
        return next();
      }

      if (req.userid != req.params.id) {
        res.send(403, buildResponse(403, { 
          message: 'Forbidden action'
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

      const limit = (req.query.limit) ? parseInt(req.query.limit) : 20;
      const skip = (req.query.page) ? ((parseInt(req.query.page)-1)*limit) : 0;
      const account = await Account
        .findById(req.params.id)
        .populate({
          path: 'likes',
          options: { limit, skip },
          populate: 'account'
        })
        .exec();

      res.send(
        200, 
        buildResponse(
          200,
          account.likes.map(item => item ? item.toJSON(self) : null)
        )
      );
      return next();
    } catch(err) { 
      console.log(err);
      res.send(500, buildResponse(500, { message: 'Internal server error' }));
      return next();
     }
  }

}