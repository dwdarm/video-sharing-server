const {video} = require('../controllers');

const init = (server) => {
  server.get('/videos', video.getVideos);
  server.get('/videos/:id', video.getVideo);
  server.post('/videos', video.postVideo);
  server.put('/videos/:id', video.updateVideo);
  server.del('/videos/:id', video.deleteVideo);

  server.put('/videos/:id/like', video.likeVideo);
  server.del('/videos/:id/unlike', video.unlikeVideo);

  server.get('/videos/:id/comments', video.getVideoComments);
  server.post('/videos/:id/comment', video.commentVideo);
}

module.exports = init;