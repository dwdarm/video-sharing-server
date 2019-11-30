const {auth} = require('../controllers');

const init = (server) => {
  server.post('/auth', auth.auth);
}

module.exports = init;