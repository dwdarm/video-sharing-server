const bcrypt = require('bcrypt');
const token = require('../common/token.js');
const Account = require('../models').account;

function buildResponse(status, data) {
  return {
    status,
    success: (status >= 400) ? false : true,
    data
  }
}

module.exports = {

  /**
   * /POST /auth
   */

  async auth(req, res, next) {
    try {
      if (!req.body) {
        res.send(400, buildResponse(400, { message: 'Empty request body' }));
        return next();
      }

      const account = await Account.findOne({username:req.body.username}).exec();
      if (!account) {
        res.send(401, buildResponse(401, { 
          message: 'Username is not found'
        }));
        return next();
      }
      
      const match = await bcrypt.compare(req.body.password.toString(), account.password);
      if (!match) {
        res.send(401, buildResponse(401, { 
          message: 'Wrong password'
        }));
        return next();
      }
  
      const accessToken = await token.generateToken({
        id: account._id,
        username: account.username,
      }, { expiresIn:'7d' });
  
      res.send(200, { status:200, success:true, data:{accessToken:accessToken} });
      return next();
    } catch(err) { 
      console.log(err);
      res.send(500, buildResponse(500, { message: 'Internal server error' }));
      return next();
     }
  }
}