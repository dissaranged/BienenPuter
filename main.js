const restify = require('restify');
const routes = require('./routes');
const rtl = require('./rtl_client');
const db = require('./redis');
db.setup();

var server = restify.createServer();
rtl.start();

routes(server, db);

// # configure server
// cors allow all!!
server.opts('*', function optionsRoute (req, res, next) {
  res.send(200);
  return next();
});
server.use(
  function crossOrigin (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Access-Control-Allow-Headers', '*');
    next();
  });

server.listen(8080, function () {
  console.log('%s listening at %s', server.name, server.url);
});
