process.env.NODE_ENV = 'test';
const request = require('supertest');
const expect = require('expect.js');
const server = require('../server.js');
const Account = require('../app/models').account;
const Video = require('../app/models').video;
const Comment = require('../app/models').comment;
const tkn = require('../app/common/token.js');

describe('Comment endpoints test', () => {

  beforeEach(async () => {
    await Account.deleteMany({});
    await Video.deleteMany({});
    await Comment.deleteMany({});
  });

  afterEach(async () => {
    await Account.deleteMany({});
    await Video.deleteMany({});
    await Comment.deleteMany({});
  });

  describe('/GET /comments', () => {

    it('it should GET all comments', async () => {
      const res = await request(server).get('/comments');
      expect(res.status).to.eql(200);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(true);
      expect(res.body.data).to.be.an('array');
    });

  });

  describe('/GET /comments/:id', () => {

    it('it should GET a comment by given ID', async () => {
      const account = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678'
      });
      await account.save();
      const comment = new Comment({
        account: account._id,
        video: '5d273f9ed58f5e7093b549b1',
        text: 'comment text'
      });
      await comment.save();
      const res = await request(server).get(`/comments/${comment._id}`);
      expect(res.status).to.eql(200);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(true);
    });

    it('it should not GET a comment if the ID is not exist', async () => {
      const res = await request(server).get(`/comments/5d273f9ed58f5e7093b549b0`);
      expect(res.status).to.eql(404);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

  });

  describe('/PUT /comments/:id', () => {

    it('it should UPDATE a comment by given ID', async () => {
      const account = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678'
      });
      await account.save();
      const token = await tkn.generateToken({id:account._id,username:account.username,role:account.role});
      const comment = new Comment({
        account: account._id,
        video: '5d273f9ed58f5e7093b549b1',
        text: 'comment text'
      });
      await comment.save();
      const res = await request(server)
        .put(`/comments/${comment._id}`)
        .set('Authorization', `Bearer ${token}`)
        .set('Accept', 'application/json')
        .send({text:'hello world!'});
      expect(res.status).to.eql(200);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(true);
      const updated = await Comment.findById(comment._id);
      expect(updated.text).to.eql('hello world!');
    });

    it('it should not UPDATE if the ID is not exist', async () => {
      const account = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678'
      });
      await account.save();
      const token = await tkn.generateToken({id:account._id,username:account.username,role:account.role});
      const res = await request(server)
        .put(`/comments/5d273f9ed58f5e7093b549b1`)
        .set('Authorization', `Bearer ${token}`)
        .set('Accept', 'application/json')
        .send({text:'hello world!'});
      expect(res.status).to.eql(404);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

    it('it should not UPDATE a comment if it is not authenticated', async () => {
      const comment = new Comment({
        account: '5d273f9ed58f5e7093b549b0',
        video: '5d273f9ed58f5e7093b549b1',
        text: 'comment text'
      });
      await comment.save();
      const res = await request(server)
        .put(`/comments/${comment._id}`)
        .set('Accept', 'application/json')
        .send({text:'hello world!'});
      expect(res.status).to.eql(401);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

    it('it should not UPDATE a comment if it is not the owner', async () => {
      const account = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678'
      });
      await account.save();
      const account2 = new Account({
        username: 'beta',
        email: 'beta@beta.com',
        password: '12345678'
      });
      await account2.save();
      const token = await tkn.generateToken({id:account._id,username:account.username,role:account.role});
      const comment = new Comment({
        account: account2._id,
        video: '5d273f9ed58f5e7093b549b1',
        text: 'comment text'
      });
      await comment.save();
      const res = await request(server)
        .put(`/comments/${comment._id}`)
        .set('Authorization', `Bearer ${token}`)
        .set('Accept', 'application/json')
        .send({text:'hello world!'});
      expect(res.status).to.eql(403);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

  });

  describe('/DELETE /comments/:id', () => {

    it('it should DELETE a comment by given ID', async () => {
      const account = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678'
      });
      await account.save();
      const token = await tkn.generateToken({id:account._id,username:account.username,role:account.role});
      const comment = new Comment({
        account: account._id,
        video: '5d273f9ed58f5e7093b549b1',
        text: 'comment text'
      });
      await comment.save();
      const res = await request(server)
        .delete(`/comments/${comment._id}`)
        .set('Authorization', `Bearer ${token}`)
        .set('Accept', 'application/json')
        .send({text:'hello world!'});
      expect(res.status).to.eql(200);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(true);
      const deleted = await Comment.findById(comment._id);
      expect(deleted).to.eql(null);
    });

    it('it should not DELETE if the ID is not exist', async () => {
      const account = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678'
      });
      await account.save();
      const token = await tkn.generateToken({id:account._id,username:account.username,role:account.role});
      const res = await request(server)
        .delete(`/comments/5d273f9ed58f5e7093b549b1`)
        .set('Authorization', `Bearer ${token}`)
        .set('Accept', 'application/json')
      expect(res.status).to.eql(404);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

    it('it should not DELETE a comment if it is not authenticated', async () => {
      const comment = new Comment({
        account: '5d273f9ed58f5e7093b549b0',
        video: '5d273f9ed58f5e7093b549b1',
        text: 'comment text'
      });
      await comment.save();
      const res = await request(server)
        .delete(`/comments/${comment._id}`)
        .set('Accept', 'application/json')
      expect(res.status).to.eql(401);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

    it('it should not DELETE a comment if it is not the owner', async () => {
      const account = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678'
      });
      await account.save();
      const account2 = new Account({
        username: 'beta',
        email: 'beta@beta.com',
        password: '12345678'
      });
      await account2.save();
      const token = await tkn.generateToken({id:account._id,username:account.username,role:account.role});
      const comment = new Comment({
        account: account2._id,
        video: '5d273f9ed58f5e7093b549b1',
        text: 'comment text'
      });
      await comment.save();
      const res = await request(server)
        .delete(`/comments/${comment._id}`)
        .set('Authorization', `Bearer ${token}`)
        .set('Accept', 'application/json')
      expect(res.status).to.eql(403);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

  });

});