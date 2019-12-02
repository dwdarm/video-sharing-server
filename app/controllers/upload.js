const sha1 = require('sha1');
const handleError = require('../common/handle-error.js');
const Account = require('../models/account.js');
const { baseCloudUrl, cloudName, apiKey, apiSecret } = require('../config');

module.exports = {

  /**
   * /GET /upload
   */

  async upload(req, res, next) {
    try {
      if (!req.auth) throw new Error('unauthorizedError');

      const self = await Account.findById(req.userid).exec();
      if (!self) throw new Error('unauthorizedError'); 
      if (!self.verified) throw new Error('verifiedError');

      const timestamp = Math.floor(new Date() / 1000);
      const payload = `timestamp=${timestamp}`;
      const signature = sha1(payload + apiSecret);
      const params = `api_key=${apiKey}&timestamp=${timestamp}&signature=${signature}`;
      const url = `${baseCloudUrl}/${cloudName}/auto/upload?${params}`;

      res.send(200, { status:200, success:true, data: { url: url } });
      return next();

    } catch(err) {  console.log(err); handleError(err.message, res, next); }
  }

}