module.exports = {

  internalServerError: {
    status: 500,
    errorCode: 'internalServerError',
    message: 'Internal server error'
  },

  unauthorizedError: {
    status: 401,
    errorCode: 'unauthorizedError',
    message: 'This method requires authentication'
  },

  forbiddenError: {
    status: 403,
    errorCode: 'forbiddenError',
    message: 'Forbidden method'
  },

  validationError: {
    status: 400,
    errorCode: 'validationError',
    message: 'The value of the paramaters is not acceptable'
  },

  duplicateKeyError: {
    status: 400,
    errorCode: 'duplicateKeyError',
    message: 'One of the key parameters is already used'
  },

  emptyBodyError: {
    status: 400,
    errorCode: 'emptyBodyError',
    message: 'Body is empty'
  },

  parametersError: {
    status: 400,
    errorCode: 'parametersError',
    message: 'Required paramaters is not supplied'
  },

  notFoundError: {
    status: 404,
    errorCode: 'notFoundError',
    message: 'Resource not found'
  },

  credentialError: {
    status: 404,
    errorCode: 'credentialError',
    message: 'Invalid credential'
  },

  verifiedError: {
    status: 403,
    errorCode: 'verifiedError',
    message: 'Account is not verified'
  }

}