process.env.NODE_ENV = 'test';
const request = require('supertest');
const expect = require('expect.js');
const server = require('../server.js');
const Account = require('../app/models').account;
const Video = require('../app/models').video;
const Like = require('../app/models').like;
const tkn = require('../app/common/token.js');

describe('Video endpoint test', () => {

  beforeEach(async () => {
    await Account.deleteMany({});
    await Video.deleteMany({});
    await Like.deleteMany({});
  });

  afterEach(async () => {
    await Account.deleteMany({});
    await Video.deleteMany({});
    await Like.deleteMany({});
  });

  describe('/GET /videos', () => {

    it('it should GET all videos', async () => {
      const res = await request(server).get('/videos');
      expect(res.status).to.eql(200);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(true);
      expect(res.body.data).to.be.an('array');
    });

  });

  describe('/GET /videos/:id', () => {

    it('it should GET a video by given ID', async () => {
      const account = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678'
      });
      await account.save();
      const video = new Video({
        accountId: account._id,
        username: account.username,
        title: 'test',
        mediaId: 'test',
        urlToVideo: 'test'
      });
      await video.save();

      const res = await request(server).get(`/videos/${video._id}`);
      expect(res.status).to.eql(200);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(true);
      expect(res.body.data).to.be.an('object');
      expect(res.body.data._id).to.eql(video.id);
    });

    it('it should not GET a video if ID is not exist', async () => {
      const res = await request(server).get('/videos/5d273f9ed58f5e7093b549b0');
      expect(res.status).to.eql(404);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

  });

  describe('/POST /videos', () => {

    it('it should POST a video', async () => {
      const account = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678'
      });
      await account.save();
      const token = await tkn.generateToken({id:account._id,username:account.username,role:account.role});
      const path = `${process.cwd()}/test/sample.mp4`;
      const res = await request(server)
        .post('/videos')
        .type('application/x-www-form-urlencoded')
        .field('title', 'cut bunny')
        .attach('video', path)
        .set('Authorization', `Bearer ${token}`)
        .set('Accept', 'application/json')
      expect(res.status).to.eql(201);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(true);
    });

    it('it should not POST a video if it is not authenticated', async () => {
      const path = `${process.cwd()}/test/sample.mp4`;
      const res = await request(server)
        .post('/videos')
        .type('application/x-www-form-urlencoded')
        .field('title', 'cut bunny')
        .attach('video', path)
        .set('Accept', 'application/json')
      expect(res.status).to.eql(401);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

    it('it should not POST a video if file is not provided', async () => {
      const account = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678'
      });
      await account.save();
      const token = await tkn.generateToken({id:account._id,username:account.username,role:account.role});
      const path = `${process.cwd()}/test/sample.mp4`;
      const res = await request(server)
        .post('/videos')
        .type('application/x-www-form-urlencoded')
        .field('title', 'cut bunny')
        .set('Authorization', `Bearer ${token}`)
        .set('Accept', 'application/json')
      expect(res.status).to.eql(400);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

  });

  describe('/PUT /videos/:id', () => {

    var accountId, username, token;

    beforeEach(async () => {
      const account = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678'
      });
      await account.save();
      accountId = account._id;
      username = account.username;
      token = await tkn.generateToken({id:account._id,username:account.username,role:account.role});
    });

    it('it should UPDATE a video by given ID', async () => {
      const video = new Video({
        accountId: accountId,
        username: username,
        title: 'test',
        mediaId: 'test',
        urlToVideo: 'test'
      });
      await video.save();
      const update = {
        title: 'new title',
        caption: 'new caption',
        public: false
      }
      const res = await request(server)
        .put(`/videos/${video._id}`)
        .set('Authorization', `Bearer ${token}`)
        .set('Accept', 'application/json')
        .send(update);
      expect(res.status).to.eql(200);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(true);
      const updated = await Video.findById(video._id);
      expect(updated.title).to.eql(update.title);
      expect(updated.caption).to.eql(update.caption);
      expect(updated.public).to.eql(update.public);
    });

    it('it should not UPDATE if the video is not exist', async () => {
      const update = {
        title: 'new title',
        caption: 'new caption',
        public: false
      }
      const res = await request(server)
        .put('/videos/5d273f9ed58f5e7093b549b0')
        .set('Authorization', `Bearer ${token}`)
        .set('Accept', 'application/json')
        .send(update);
      expect(res.status).to.eql(404);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

    it('it should not UPDATE a video if it is not authenticated', async () => {
      const video = new Video({
        accountId: accountId,
        username: username,
        title: 'test',
        mediaId: 'test',
        urlToVideo: 'test'
      });
      await video.save();
      const update = {
        title: 'new title',
        caption: 'new caption',
        public: false
      }
      const res = await request(server)
        .put(`/videos/${video._id}`)
        .set('Accept', 'application/json')
        .send(update);
      expect(res.status).to.eql(401);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

    it('it should not UPDATE the video if it is not the owner', async () => {
      const owner = new Account({
        username: 'beta',
        email: 'beta@beta.com',
        password: '12345678'
      });
      await owner.save();
      const video = new Video({
        accountId: owner._id,
        username: owner.username,
        title: 'test',
        mediaId: 'test',
        urlToVideo: 'test'
      });
      await video.save();
      const update = {
        title: 'new title',
        caption: 'new caption',
        public: false
      }
      const res = await request(server)
        .put(`/videos/${video._id}`)
        .set('Authorization', `Bearer ${token}`)
        .set('Accept', 'application/json')
        .send(update);
      expect(res.status).to.eql(403);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

  });

  describe('/DELETE /videos/:id', () => {

    var accountId, username, token;

    beforeEach(async () => {
      const account = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678'
      });
      await account.save();
      accountId = account._id;
      username = account.username;
      token = await tkn.generateToken({id:account._id,username:account.username,role:account.role});
    });

    it('it should DELETE a video by given ID', async () => {
      const video = new Video({
        accountId: accountId,
        username: username,
        title: 'test',
        mediaId: 'test',
        urlToVideo: 'test'
      });
      await video.save();
      const res = await request(server)
        .delete(`/videos/${video._id}`)
        .set('Authorization', `Bearer ${token}`)
        .set('Accept', 'application/json')
      expect(res.status).to.eql(200);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(true);
      const deleted = await Video.findById(video._id);
      expect(deleted).to.eql(null);
    });

    it('it should not DELETE if the video is not exist', async () => {
      const res = await request(server)
        .delete('/videos/5d273f9ed58f5e7093b549b0')
        .set('Authorization', `Bearer ${token}`)
        .set('Accept', 'application/json')
      expect(res.status).to.eql(404);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

    it('it should not DELETE a video if it is not authenticated', async () => {
      const video = new Video({
        accountId: accountId,
        username: username,
        title: 'test',
        mediaId: 'test',
        urlToVideo: 'test'
      });
      await video.save();
      const res = await request(server)
        .delete(`/videos/${video._id}`)
        .set('Accept', 'application/json')
      expect(res.status).to.eql(401);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

    it('it should not DELETE the video if it is not the owner', async () => {
      const owner = new Account({
        username: 'beta',
        email: 'beta@beta.com',
        password: '12345678'
      });
      await owner.save();
      const video = new Video({
        accountId: owner._id,
        username: owner.username,
        title: 'test',
        mediaId: 'test',
        urlToVideo: 'test'
      });
      await video.save();
      const res = await request(server)
        .delete(`/videos/${video._id}`)
        .set('Authorization', `Bearer ${token}`)
        .set('Accept', 'application/json')
      expect(res.status).to.eql(403);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

  });

  describe('/PUT /videos/:id/like', () => {

    var accountId, username, token;

    beforeEach(async () => {
      const account = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678'
      });
      await account.save();
      accountId = account._id;
      username = account.username;
      token = await tkn.generateToken({id:account._id,username:account.username,role:account.role});
    });

    it('it should UPDATE video\'s likes by given ID', async () => {
      const video = new Video({
        accountId: accountId,
        username: username,
        title: 'test',
        mediaId: 'test',
        urlToVideo: 'test'
      });
      await video.save();
      var res = await request(server)
        .put(`/videos/${video._id}/like`)
        .set('Authorization', `Bearer ${token}`)
        .set('Accept', 'application/json')
      expect(res.status).to.eql(200);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(true);
      var updated = await Video.findById(video._id);
      expect(updated.likesTotal).to.eql(1);
      // trying to like again
      res = await request(server)
        .put(`/videos/${video._id}/like`)
        .set('Authorization', `Bearer ${token}`)
        .set('Accept', 'application/json')
      updated = await Video.findById(video._id);
      expect(updated.likesTotal).to.eql(1);
    });

    it('it should not UPDATE video\'s likes if the video is not exist', async () => {
      var res = await request(server)
        .put(`/videos/5d273f9ed58f5e7093b549b0/like`)
        .set('Authorization', `Bearer ${token}`)
        .set('Accept', 'application/json')
      expect(res.status).to.eql(404);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

    it('it should not UPDATE video\'s likes if it is not authenticated', async () => {
      const video = new Video({
        accountId: accountId,
        username: username,
        title: 'test',
        mediaId: 'test',
        urlToVideo: 'test'
      });
      await video.save();
      var res = await request(server)
        .put(`/videos/${video._id}/like`)
        .set('Accept', 'application/json')
      expect(res.status).to.eql(401);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

  });

  describe('/DELETE /videos/:id/unlike', () => {

    var accountId, username, token;

    beforeEach(async () => {
      const account = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678'
      });
      await account.save();
      accountId = account._id;
      username = account.username;
      token = await tkn.generateToken({id:account._id,username:account.username,role:account.role});
    });

    it('it should UPDATE video\'s likes by given ID', async () => {
      const video = new Video({
        accountId: accountId,
        username: username,
        title: 'test',
        mediaId: 'test',
        urlToVideo: 'test',
        likesTotal: 1
      });
      await video.save();
      await new Like({accountId:accountId,videoId:video._id}).save();
      var res = await request(server)
        .delete(`/videos/${video._id}/unlike`)
        .set('Authorization', `Bearer ${token}`)
        .set('Accept', 'application/json')
      expect(res.status).to.eql(200);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(true);
      var updated = await Video.findById(video._id);
      expect(updated.likesTotal).to.eql(0);
      // trying to unlike again
      res = await request(server)
        .delete(`/videos/${video._id}/unlike`)
        .set('Authorization', `Bearer ${token}`)
        .set('Accept', 'application/json')
      updated = await Video.findById(video._id);
      expect(updated.likesTotal).to.eql(0);
    });

    it('it should not UPDATE video\'s likes if the video is not exist', async () => {
      var res = await request(server)
        .delete(`/videos/5d273f9ed58f5e7093b549b0/unlike`)
        .set('Authorization', `Bearer ${token}`)
        .set('Accept', 'application/json')
      expect(res.status).to.eql(404);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

    it('it should not UPDATE video\'s likes if it is not authenticated', async () => {
      const video = new Video({
        accountId: accountId,
        username: username,
        title: 'test',
        mediaId: 'test',
        urlToVideo: 'test'
      });
      await video.save();
      var res = await request(server)
        .delete(`/videos/${video._id}/unlike`)
        .set('Accept', 'application/json')
      expect(res.status).to.eql(401);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

  });

  describe('/GET /videos/:id/comments', () => {

    it('it should GET all video\'s comments by given ID', async () => {
      const account = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678'
      });
      await account.save();
      const video = new Video({
        accountId: account._id,
        username: account.username,
        title: 'test',
        mediaId: 'test',
        urlToVideo: 'test',
      });
      await video.save();
      const res = await request(server)
        .get(`/videos/${video._id}/comments`)
        .set('Accept', 'application/json')
      expect(res.status).to.eql(200);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(true);
      expect(res.body.data).to.be.an('array');
    });

    it('it should not GET all video\'s comments if the video is not exist', async () => {
      const res = await request(server)
        .get(`/videos/5d273f9ed58f5e7093b549b0/comments`)
        .set('Accept', 'application/json')
      expect(res.status).to.eql(404);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

  });

  describe('/POST /videos/:id/comment', () => {

    it('it should POST a video\'s comment', async () => {
      const account = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678',
        verified: true
      });
      await account.save();
      const token = await tkn.generateToken({id:account._id,username:account.username,role:account.role});
      const video = new Video({
        accountId: account._id,
        username: account.username,
        title: 'test',
        mediaId: 'test',
        urlToVideo: 'test',
      });
      await video.save();
      const res = await request(server)
        .post(`/videos/${video._id}/comment`)
        .set('Authorization', `Bearer ${token}`)
        .set('Accept', 'application/json')
        .send({text:'nice video'})
      expect(res.status).to.eql(201);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(true);
      expect(res.body.data).to.be.an('object');
      expect(res.body.data.accountId).to.eql(account.id);
      expect(res.body.data.videoId).to.eql(video.id);
      expect(res.body.data.parentId).to.eql(undefined);
      expect(res.body.data.text).to.eql('nice video');
      expect(res.body.data.childsTotal).to.eql(0);
      const updated = await Video.findById(video._id);
      expect(updated.commentsTotal).to.eql(1);
    });

    it('it should not POST a video\'s comment if the video is not exist', async () => {
      const account = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678',
        verified: true
      });
      await account.save();
      const token = await tkn.generateToken({id:account._id,username:account.username,role:account.role});
      const res = await request(server)
        .post(`/videos/5d273f9ed58f5e7093b549b0/comment`)
        .set('Authorization', `Bearer ${token}`)
        .set('Accept', 'application/json')
        .send({text:'nice video'})
      expect(res.status).to.eql(404);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

    it('it should not POST a video\'s comment if it is not authenticated', async () => {
      const account = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678',
        verified: true
      });
      await account.save();
      const video = new Video({
        accountId: account._id,
        username: account.username,
        title: 'test',
        mediaId: 'test',
        urlToVideo: 'test',
      });
      await video.save();
      const res = await request(server)
        .post(`/videos/${video._id}/comment`)
        .set('Accept', 'application/json')
        .send({text:'nice video'})
      expect(res.status).to.eql(401);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

  });

});