process.env.NODE_ENV = 'test';
const request = require('supertest');
const expect = require('expect.js');
const server = require('../server.js');
const Account = require('../app/models').account;
const tkn = require('../app/common/token.js');

describe('Account endpoint test', () => {

  beforeEach(async () => await Account.deleteMany({}));
  afterEach(async () => await Account.deleteMany({}));

  /**
   * /GET /accounts
   */

  describe('/GET /accounts', () => {

    it('it should GET all accounts', async () => {
      const res = await request(server).get('/accounts');
      expect(res.status).to.eql(200);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(true);
      expect(res.body.data).to.be.an('array');
    });

  });

  describe('/POST /accounts', () => {

    it('it should POST an account', async () => {
      const account = {
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678'
      }
      const res = await request(server)
        .post('/accounts')
        .send(account)
        .set('Accept', 'application/json');
      expect(res.status).to.eql(201);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(true);
    });

    it('it should not POST an account if body is empty', async () => {
      const res = await request(server)
        .post('/accounts')
        .set('Accept', 'application/json');
      expect(res.status).to.eql(400);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

    it('it should not POST an account if password length less than 8 chars', async () => {
      const account = {
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '1234567'
      }
      const res = await request(server)
        .post('/accounts')
        .send(account)
        .set('Accept', 'application/json');
      expect(res.status).to.eql(400);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

    it('it should not POST an account if username is not acceptable', async () => {
      const account = {
        username: '_alpha',
        email: 'alpha@alpha.com',
        password: '12345678'
      }
      const res = await request(server)
        .post('/accounts')
        .send(account)
        .set('Accept', 'application/json');
      expect(res.status).to.eql(400);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

    it('it should not POST an account if email is not acceptable', async () => {
      const account = {
        username: 'alpha',
        email: 'alpha',
        password: '12345678'
      }
      const res = await request(server)
        .post('/accounts')
        .send(account)
        .set('Accept', 'application/json');
      expect(res.status).to.eql(400);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

    it('it should not POST an account if email is undefined', async () => {
      const account = {
        username: 'alpha',
        password: '1234567'
      }
      const res = await request(server)
        .post('/accounts')
        .send(account)
        .set('Accept', 'application/json');
      expect(res.status).to.eql(400);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

    it('it should not POST an account if username is already used', async () => {
      const account = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678'
      });
      await account.save();
      const res = await request(server)
        .post('/accounts')
        .send({username: 'alpha', email: 'alpha', password: '12345678'})
        .set('Accept', 'application/json');
      expect(res.status).to.eql(400);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

  });

  /**
   * /GET /accounts/:id
   */

  describe('/GET /accounts/:id', () => {

    it('it should GET an account by given ID', async () => {
      const account = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678'
      });
      await account.save();
      const res = await request(server)
        .get(`/accounts/${account._id}`)
        .set('Accept', 'application/json');
      expect(res.status).to.eql(200);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(true);
      expect(res.body.data).to.be.an('object');
      expect(res.body.data._id).to.eql(account.id);
    });

    it('it should GET currently signed account', async () => {
      const account = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678'
      });
      await account.save();
      const token = await tkn.generateToken({id:account._id,username:account.username,role:account.role});
      const res = await request(server)
        .get('/accounts/me')
        .set('Authorization', `Bearer ${token}`)
        .set('Accept', 'application/json');
      expect(res.status).to.eql(200);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(true);
      expect(res.body.data).to.be.an('object');
      expect(res.body.data._id).to.eql(account.id);
    });

    it('it should not GET currently signed account if there is not token', async () => {
      const account = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678'
      });
      await account.save();
      const res = await request(server)
        .get('/accounts/me')
        .set('Accept', 'application/json');
      expect(res.status).to.eql(401);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

    it('it should not GET currently signed account if token is invalid', async () => {
      const res = await request(server)
        .get('/accounts/me')
        .set('Authorization', 'Bearer adasdfwafewafawfafaefafawfaaFAFAFAWF')
        .set('Accept', 'application/json');
      expect(res.status).to.eql(401);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

    it('it should not GET if account ID is not exist', async () => {
      const res = await request(server).get('/accounts/5d273f9ed58f5e7093b549b0');
      expect(res.status).to.eql(404);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

  });

  /**
   * /PUT /accounts/:id
   */

  describe('/PUT /accounts/:id', () => {

    it('it should UPDATE currently signed account', async () => {
      const account = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678'
      });
      const update = {
        about: 'hello world',
        private: true,
        urlToAvatar: 'url_to_avatar'
      }
      await account.save();
      const token = await tkn.generateToken({id:account._id,username:account.username,role:account.role});
      const res = await request(server)
        .put(`/accounts/${account._id}`)
        .set('Authorization', `Bearer ${token}`)
        .set('Accept', 'application/json')
        .send(update);
      expect(res.status).to.eql(200);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(true);
      const updated = await Account.findById(account._id);
      expect(updated.about).to.eql(update.about);
      expect(updated.private).to.eql(update.private);
      expect(updated.urlToAvatar).to.eql(update.urlToAvatar);
    });

    it('it should not UPDATE currently signed account if ID is different', async () => {
      const account = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678'
      });
      const update = {
        about: 'hello world',
        private: true
      }
      await account.save();
      const token = await tkn.generateToken({id:'5d273f9ed58f5e7093b549b0',username:account.username,role:account.role});
      const res = await request(server)
        .put(`/accounts/${account._id}`)
        .set('Authorization', `Bearer ${token}`)
        .set('Accept', 'application/json')
        .send(update);
      expect(res.status).to.eql(403);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

    it('it should not UPDATE currently signed account if there is not token', async () => {
      const account = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678'
      });
      const update = {
        about: 'hello world',
        private: true
      }
      await account.save();
      const res = await request(server)
        .put(`/accounts/${account._id}`)
        .set('Accept', 'application/json')
        .send(update);
      expect(res.status).to.eql(401);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

    it('it should not UPDATE currently signed account if token is invalid', async () => {
      const account = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678'
      });
      const update = {
        about: 'hello world',
        private: true
      }
      await account.save();
      const res = await request(server)
        .put(`/accounts/${account._id}`)
        .set('Authorization', 'Bearer adasdfwafewafawfafaefafawfaaFAFAFAWF')
        .set('Accept', 'application/json')
        .send(update);
      expect(res.status).to.eql(401);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

  });

  /**
   * /GET /accounts/:id/subscriptions
   */

  describe('/GET /accounts/:id/subscriptions', () => {

    it('it should GET subscriptions list', async () => {
      const beta = new Account({
        username: 'beta',
        email: 'beta@beta.com',
        password: '12345678',
        subscribersTotal: 1
      });
      await beta.save();
      const alpha = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678',
        subscribe: [beta._id]
      });
      await alpha.save();
      const token = await tkn.generateToken({id:alpha._id,username:alpha.username,role:alpha.role});
      const res = await request(server)
        .get(`/accounts/${alpha._id}/subscriptions`)
        .set('Authorization', `Bearer ${token}`)
        .set('Accept', 'application/json')
      expect(res.status).to.eql(200);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(true);
    });

  });

  /**
   * /PUT /accounts/:id/subscribe
   */

  describe('/PUT /accounts/:id/subscribe', () => {

    it('it should subscribe given ID', async () => {
      const alpha = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678'
      });
      await alpha.save();
      const beta = new Account({
        username: 'beta',
        email: 'beta@beta.com',
        password: '12345678'
      });
      await beta.save();
      const token = await tkn.generateToken({id:alpha._id,username:alpha.username,role:alpha.role});
      const res = await request(server)
        .put(`/accounts/${beta._id}/subscribe`)
        .set('Authorization', `Bearer ${token}`)
        .set('Accept', 'application/json')
      expect(res.status).to.eql(200);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(true);
      const alphaUpdated = await Account.findById(alpha._id);
      expect(alphaUpdated.subscribe.length).to.eql(1);
      const betaUpdated = await Account.findById(beta._id);
      expect(betaUpdated.subscribersTotal).to.eql(1);
    });

    it('it should not subscribe if there is not token', async () => {
      const alpha = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678'
      });
      await alpha.save();
      const beta = new Account({
        username: 'beta',
        email: 'beta@beta.com',
        password: '12345678'
      });
      await beta.save();
      const res = await request(server)
        .put(`/accounts/${beta._id}/subscribe`)
        .set('Accept', 'application/json')
      expect(res.status).to.eql(401);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

    it('it should not subscribe if ID is not exist', async () => {
      const alpha = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678'
      });
      await alpha.save();
      const token = await tkn.generateToken({id:alpha._id,username:alpha.username,role:alpha.role});
      const res = await request(server)
        .put('/accounts/5d273f9ed58f5e7093b549b0/subscribe')
        .set('Authorization', `Bearer ${token}`)
        .set('Accept', 'application/json')
      expect(res.status).to.eql(200);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(true);
    });

    it('it should not subscribe currently signed ID', async () => {
      const alpha = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678'
      });
      await alpha.save();
      const token = await tkn.generateToken({id:alpha._id,username:alpha.username,role:alpha.role});
      const res = await request(server)
        .put(`/accounts/${alpha._id}/subscribe`)
        .set('Authorization', `Bearer ${token}`)
        .set('Accept', 'application/json')
      expect(res.status).to.eql(403);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

  });

  /**
   * /DELETE /accounts/:id/subscribe
   */

  describe('/DELETE /accounts/:id/subscribe', () => {

    it('it should unsubscribe given ID', async () => {
      const beta = new Account({
        username: 'beta',
        email: 'beta@beta.com',
        password: '12345678',
        subscribersTotal: 1
      });
      await beta.save();
      const alpha = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678',
        subscribe: [beta._id]
      });
      await alpha.save();
      const token = await tkn.generateToken({id:alpha._id,username:alpha.username,role:alpha.role});
      const res = await request(server)
        .delete(`/accounts/${beta._id}/subscribe`)
        .set('Authorization', `Bearer ${token}`)
        .set('Accept', 'application/json')
      expect(res.status).to.eql(200);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(true);
      const alphaUpdated = await Account.findById(alpha._id);
      expect(alphaUpdated.subscribe.length).to.eql(0);
      const betaUpdated = await Account.findById(beta._id);
      expect(betaUpdated.subscribersTotal).to.eql(0);
    });

    it('it should not unsubscribe if there is not token', async () => {
      const beta = new Account({
        username: 'beta',
        email: 'beta@beta.com',
        password: '12345678',
        subscribersTotal: 1
      });
      await beta.save();
      const alpha = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678',
        subscribe: [beta._id]
      });
      await alpha.save();
      const res = await request(server)
        .delete(`/accounts/${beta._id}/subscribe`)
        .set('Accept', 'application/json')
      expect(res.status).to.eql(401);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

    it('it should not unsubscribe if ID is not exist', async () => {
      const alpha = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678'
      });
      await alpha.save();
      const token = await tkn.generateToken({id:alpha._id,username:alpha.username,role:alpha.role});
      const res = await request(server)
        .delete('/accounts/5d273f9ed58f5e7093b549b0/subscribe')
        .set('Authorization', `Bearer ${token}`)
        .set('Accept', 'application/json')
      expect(res.status).to.eql(200);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(true);
    });

    it('it should not unsubscribe currently signed ID', async () => {
      const alpha = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678'
      });
      await alpha.save();
      const token = await tkn.generateToken({id:alpha._id,username:alpha.username,role:alpha.role});
      const res = await request(server)
        .delete(`/accounts/${alpha._id}/subscribe`)
        .set('Authorization', `Bearer ${token}`)
        .set('Accept', 'application/json')
      expect(res.status).to.eql(403);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

  });

  /**
   * /GET /accounts/:id/likes
   */

  describe('/GET /accounts/:id/likes', () => {

    it('it should GET all account\'s likes', async () => {
      const account = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678'
      });
      await account.save();
      const token = await tkn.generateToken({id:account._id,username:account.username,role:account.role});
      const res = await request(server)
        .get(`/accounts/${account._id}/likes`)
        .set('Authorization', `Bearer ${token}`)
        .set('Accept', 'application/json')
      expect(res.status).to.eql(200);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(true);
      expect(res.body.data).to.be.an('array');
    });

    it('it should not GET all account\'s likes it is not authenticated', async () => {
      const account = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678'
      });
      await account.save();
      const res = await request(server)
        .get(`/accounts/${account._id}/likes`)
        .set('Accept', 'application/json')
      expect(res.status).to.eql(401);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

  });

});