const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

const generateToken = (payload, options) => {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, jwtSecret, options, (err, token) => {
      if (err) {
        return reject(err);
      }
      
      return resolve(token);
    });
  });
}

const verifyToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, jwtSecret, (err, decoded) => {
      if (err) {
        return reject(err);
      }
      
      return resolve(decoded);
    });
  });
}

module.exports = {
  generateToken,
  verifyToken
}