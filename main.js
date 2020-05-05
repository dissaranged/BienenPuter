const restify = require('restify');
const { InternalServerError }  = require( 'restify-errors');
const rtl = require('./rtl_client');
const db = require('./redis');

var server = restify.createServer();
rtl.start();

// # routes
server.get('/devices', async function(req, res, next) {
  try {
    const result = await db.devices();
    res.send(result);
    next();
  } catch(e) {
    console.error(e);
    next(new InternalServerError(e));
  }
});
server.get('/device/:name', async function(req, res, next) {
  try {
    const opts = {
      device: req.params.name,
      since: req.path.since,
      until: req.path.until,
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
server.use(
  function crossOrigin(req,res,next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    return next();
  }
);

server.listen(8080, function() {
  console.log('%s listening at %s', server.name, server.url);
});
