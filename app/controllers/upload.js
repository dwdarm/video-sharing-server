const sha1 = require('sha1');
const Account = require('../models/account.js');
const { baseCloudUrl, cloudName, apiKey, apiSecret } = require('../config');

function buildResponse(status, data) {
  return {
    status,
    success: (status >= 400) ? false : true,
    data
  }
}

module.exports = {

  /**
   * /GET /upload
   */

  async upload(req, res, next) {
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

      const timestamp = Math.floor(new Date() / 1000);
      const payload = `timestamp=${timestamp}`;
      const signature = sha1(payload + apiSecret);
      const params = `api_key=${apiKey}&timestamp=${timestamp}&signature=${signature}`;
      const url = `${baseCloudUrl}/${cloudName}/auto/upload?${params}`;

      res.send(200, { status:200, success:true, data: { url: url } });
      return next();

    } catch(err) { 
      res.send(500, buildResponse(500, { message: 'Internal server error' }));
      return next();
     }
  }

}