process.env.NODE_ENV = 'test';
const request = require('supertest');
const expect = require('expect.js');
const server = require('../server.js');
const Account = require('../app/models').account;
const Video = require('../app/models').video;
const tkn = require('../app/common/token.js');

describe('Video endpoint test', () => {

  beforeEach(async () => {
    await Account.deleteMany({});
    await Video.deleteMany({});
  });

  afterEach(async () => {
    await Account.deleteMany({});
    await Video.deleteMany({});
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
        account: account._id,
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
      expect(res.body.data.id).to.eql(video.id);
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
      const video = {
        title: 'title of the video',
        urlToVideo: 'url_to_video',
        urlToThumbnail: 'url_to_thumb'
      }
      const res = await request(server)
        .post('/videos')
        .set('Authorization', `Bearer ${token}`)
        .set('Accept', 'application/json')
        .send(video)
      expect(res.status).to.eql(201);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(true);
    });

    it('it should not POST a video if it is not authenticated', async () => {
      const video = {
        title: 'title of the video',
        urlToVideo: 'url_to_video',
        urlToThumbnail: 'url_to_thumb'
      }
      const res = await request(server)
        .post('/videos')
        .set('Accept', 'application/json')
        .send(video)
      expect(res.status).to.eql(401);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

    it('it should not POST a video if required paramaters is not provided', async () => {
      const account = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678'
      });
      await account.save();
      const token = await tkn.generateToken({id:account._id,username:account.username,role:account.role});
      const video = {
        title: 'title of the video'
      }
      const res = await request(server)
        .post('/videos')
        .set('Authorization', `Bearer ${token}`)
        .set('Accept', 'application/json')
      .send(video)
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
        account: accountId,
        username: username,
        title: 'test',
        mediaId: 'test',
        urlToVideo: 'test'
      });
      await video.save();
      const update = {
        title: 'new title',
        caption: 'new caption'
      }
      const res = await request(server)
        .put(`/videos/${video._id}`)
        .set('Authorization', `Bearer ${token}`)
        .set('Accept', 'application/json')
        .send(update);
      expect(res.status).to.eql(200);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(true);
      expect(res.body.data.title).to.eql(update.title);
      expect(res.body.data.caption).to.eql(update.caption);
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
        account: accountId,
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
        account: owner._id,
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
        account: accountId,
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
        account: accountId,
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
        account: owner._id,
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

    it('it should UPDATE video\'s likes by given ID', async () => {
      const account = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678',
      });
      await account.save();
      const video = new Video({
        account: account._id,
        username: account.username,
        title: 'test',
        mediaId: 'test',
        urlToVideo: 'test'
      });
      await video.save();
      token = await tkn.generateToken({id:account._id,username:account.username,role:account.role});
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
      const account = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678',
      });
      await account.save();
      const video = new Video({
        account: account._id,
        username: account.username,
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

  describe('/DELETE /videos/:id/like', () => {

    it('it should UPDATE video\'s likes by given ID', async () => {
      const account = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678',
      });
      await account.save();
      const video = new Video({
        account: account._id,
        username: account.username,
        title: 'test',
        mediaId: 'test',
        urlToVideo: 'test',
        likesTotal: 1
      });
      await video.save();
      account.likes = [video._id];
      await account.save();
      token = await tkn.generateToken({id:account._id,username:account.username,role:account.role});
      var res = await request(server)
        .delete(`/videos/${video._id}/like`)
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
        .delete(`/videos/5d273f9ed58f5e7093b549b0/like`)
        .set('Authorization', `Bearer ${token}`)
        .set('Accept', 'application/json')
      expect(res.status).to.eql(404);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

    it('it should not UPDATE video\'s likes if it is not authenticated', async () => {
      const account = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678',
      });
      await account.save();
      const video = new Video({
        account: account._id,
        username: account.username,
        title: 'test',
        mediaId: 'test',
        urlToVideo: 'test',
        likesTotal: 1
      });
      await video.save();
      account.likes = [video._id];
      await account.save();
      var res = await request(server)
        .delete(`/videos/${video._id}/like`)
        .set('Accept', 'application/json')
      expect(res.status).to.eql(401);
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
        account: account._id,
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
        .send({text:'nice video'});
      expect(res.status).to.eql(201);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(true);
      expect(res.body.data).to.be.an('object');
      expect(res.body.data.account.id).to.eql(account.id);
      expect(res.body.data.text).to.eql('nice video');
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
        account: account._id,
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