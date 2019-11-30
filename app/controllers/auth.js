const bcrypt = require('bcrypt');
const token = require('../common/token.js');
const Account = require('../models').account;
const handleError = require('../common/handle-error.js');

module.exports = {

  /**
   * /POST /auth
   */

  async auth(req, res, next) {
    try {
      if (!req.body) throw new Error('emptyBodyError');

      const account = await Account.findOne({username:req.body.username}).exec();
      if (!account) throw new Error('notFoundError');
      
      const match = await bcrypt.compare(req.body.password, account.password);
      if (!match) throw new Error('notFoundError');
  
      const accessToken = await token.generateToken({
        id: account._id,
        username: account.username,
        role: account.role
      }, { expiresIn:'7d' });
  
      res.send(200, { status:200, success:true, data:{accessToken:accessToken} });
      return next();
    } catch(err) { handleError(err.message, res, next); }
  }
}