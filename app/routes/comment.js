const {comment} = require('../controllers')

const init = (server) => {
  server.get('/comments', comment.getComments);
  server.get('/comments/:id', comment.getComment);
  server.put('/comments/:id', comment.updateComment);
  server.del('/comments/:id', comment.deleteComment);
  server.post('/comments/:id/reply', comment.replyComment);
}

module.exports = init;