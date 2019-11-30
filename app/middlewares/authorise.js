const {verifyToken} = require('../common/token.js');

const authorise = async (req, res, next) => {
  const auth = req.header('Authorization');
  req.auth = false;

  if (!auth) return next();

  const token = auth.split(' ');
  if (!token[1]) return next();

  try {
    const decoded = await verifyToken(token[1]);
    req.auth = true;
    req.userid = decoded.id;
    req.username = decoded.username;
    req.role = decoded.role;
    return next();
  }
  catch(err) { return next(); }
}

module.exports = authorise;