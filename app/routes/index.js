const init = (server) => {
  //server.use(require('../middlewares/apikey.js'));
  server.use(require('../middlewares/authorise.js'));
  require('./auth.js')(server);
  require('./account.js')(server);
  require('./video.js')(server);
  require('./comment.js')(server);
}

module.exports = init;