const {account} = require('../controllers');

const init = (server) => {
  server.get('/accounts', account.getAccounts);
  server.get('/accounts/:id', account.getAccount);
  server.post('/accounts', account.postAccount);
  server.put('/accounts/:id', account.updateAccount);
  server.get('/accounts/:id/likes', account.getAccountLikes);
  server.put('/accounts/:id/subscribe', account.subscribeAccount);
  server.del('/accounts/:id/unsubscribe', account.unsubscribeAccount);
  server.put('/accounts/:id/avatar', account.updateAccountAvatar);
}

module.exports = init;