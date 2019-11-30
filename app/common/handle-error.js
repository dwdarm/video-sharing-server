const errorCode = require('./error-code.js');

function handleError(code, res, next) {
  const error = errorCode[code];
  if (error) {
    res.send(error.status, { status:error.status, success:false, data:{message:error.message} });
  } else {
    res.send(500, { success:false, data:{message:'Internal server error'} });
  }

  return next();
}

module.exports = handleError;