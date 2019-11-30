const Apikey = require('../models').apikey;

const apikey = async (req, res, next) => {
  try {
    const apikey = req.header('X-Api-Key');
    if (!apikey) {
      res.send(403);
      return next(false);
    }

    const data = await Apikey.findById(apikey).exec();
    if (!data) {
      res.send(403);
      return next(false);
    }

    return next();
  }
  catch(err) { 
    res.send(403);
    return next(false); 
  }
}

module.exports = apikey;