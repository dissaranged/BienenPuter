const restify = require('restify');
const { InternalServerError }  = require( 'restify-errors');
const rtl = require('./rtl_client');
const db = require('./redis');

var server = restify.createServer();
rtl.start();

// # routes
server.put('/subscribe/:device', async function(req, res, next) {
  try {
    const result = await db.subscribe(req.params.device);
    res.send(200);
    next();
  } catch(e){
    console.error(e);
    next(e);
  }
});

server.put('/unsubscribe/:device', async function(req, res, next) {
  try {
    const result = await db.unsubscribe(req.params.device);
    res.send(200);
    next();
  } catch(e){
    console.error(e);
    next(e);
  }
});

server.get('/devices', async function(req, res, next) {
  try {
    const result = await db.devices();
    res.send(result);
    next();
  } catch(e) {
    console.error(e);
    next(e);
  }
});

server.get('/device/:name', restify.plugins.queryParser(), async function(req, res, next) {
  try {
    const opts = {
      device: req.params.name,
      since: req.query.since,
      until: req.query.until,
    };
    if(await db.exists(`readings.${opts.device}`)) {
      const data = await db.getReadings(opts);
      res.send(data);

    } else {
      res.send(404, 'Device Not Known');
    }
    next();
  } catch(e) {
    console.error(e);
    next(new InternalServerError(e));
  }
});

// # configure server
// cors allow all!!
server.opts('*', function optionsRoute(req, res, next) {
  res.send(200);
  return next();
});
server.use(
  function crossOrigin(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Access-Control-Allow-Headers', '*');
    next();
});

server.listen(8080, function() {
  console.log('%s listening at %s', server.name, server.url);
});
