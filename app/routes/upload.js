const {upload} = require('../controllers');

const init = (server) => {
  server.get('/upload', upload.upload);
}

module.exports = init;