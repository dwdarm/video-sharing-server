const Account = require('../models').account;
const Apikey = require('../models').apikey;
const handleError = require('../common/handle-error.js');

module.exports = {

  /**
   * /GET /apikey
   */

  async getApikey(req, res, next) {
    try {
      if (!req.auth) throw new Error('unauthorizedError');

      const account = await Account.findById(req.userid).exec();
      if (!account) throw new Error('notFoundError');
      if (!account.verified) throw new Error('forbiddenError');
      
      var apikey = await Apikey.findOne({accountId:req.userid}).exec();
      if (apikey) {
        res.send(200, { status:200, success:true, data:{apikey:apikey._id} });
        return next();
      }
      
      apikey = new Apikey({accountId:req.userid});
      await apikey.save();

      res.send(200, { status:200, success:true, data:{apikey:apikey._id} });
      return next();
    } catch(err) { handleError(err.message, res, next); }
  }
}