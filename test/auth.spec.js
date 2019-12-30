process.env.NODE_ENV = 'test';
const request = require('supertest');
const expect = require('expect.js');
const server = require('../server.js');
const Account = require('../app/models').account;
const tkn = require('../app/common/token.js');

describe('Auth endpoint test', () => {

  beforeEach(async () => await Account.deleteMany({}));
  afterEach(async () => await Account.deleteMany({}));

  /**
   * /POST /auth
   */

  describe('/POST /auth', () => {

    it('it should get an access token', async () => {
      const account = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678'
      });
      await account.save();
      const res = await request(server)
        .post(`/auth`)
        .set('Accept', 'application/json')
        .send({
          username: 'alpha',
          password: '12345678'
        });
      expect(res.status).to.eql(200);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(true);
      expect(res.body.data).to.be.an('object');
    });

    it('it should get an access token if username is not found', async () => {
      const res = await request(server)
        .post(`/auth`)
        .set('Accept', 'application/json')
        .send({
          username: 'alpha',
          password: '12345678'
        });
      expect(res.status).to.eql(401);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

    it('it should get an access token if password is wrong', async () => {
      const account = new Account({
        username: 'alpha',
        email: 'alpha@alpha.com',
        password: '12345678'
      });
      await account.save();
      const res = await request(server)
        .post(`/auth`)
        .set('Accept', 'application/json')
        .send({
          username: 'alpha',
          password: '11112222'
        });
      expect(res.status).to.eql(401);
      expect(res.body).to.be.an('object');
      expect(res.body.success).to.eql(false);
    });

  });

});