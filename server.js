require('dotenv').config();
const config = require('./app/config');

// init cloudinary
const cloudinary = require('cloudinary');
const {cloudName, apiKey, apiSecret} = require('./app/config');
cloudinary.config({ 
  cloud_name: cloudName, 
  api_key: apiKey, 
  api_secret: apiSecret 
});

// init server
const restify = require('restify');
const server = restify.createServer();
const corsMiddleware = require('restify-cors-middleware');

const cors = corsMiddleware({
  origins: ['*']
});
server.pre(cors.preflight);
server.use(cors.actual);
server.use(restify.plugins.throttle({burst:100,rate:50,ip:true}));
server.use(restify.plugins.queryParser({
   mapParams: false 
}));
server.use(restify.plugins.bodyParser({
  keepExtensions: true
}));
require('./app/routes')(server);

// init database
const mongoose = require('mongoose');
mongoose.connect(config.dbHost, {
  useNewUrlParser: true, 
  useUnifiedTopology: true,
  useCreateIndex: true
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

server.listen(config.port, () => {
  console.log(`server listening on ${server.url}`);
});

module.exports = server;
