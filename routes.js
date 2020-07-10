const { plugins: { queryParser, bodyParser, serveStaticFiles } } = require('restify');
const db = require('./redis');

function finalize(f) {
  return async function(req, res, next) {
    try {
      await f.apply(null, arguments);
      next();
    } catch (e) {
      console.error(e);
      next(e);
    }
  };
}

function routes (server) {
  server.get('/devices', finalize(async function (req, res, next) {
    const result = await db.getDevices();
    res.send(result);
  }));

  server.put('/device/:name', queryParser(), finalize(async function (req, res, next) {
    const device = req.params.name.toString();
    const { alias, subscribed, color } = req.query;
    await db.configureDevice(device, { alias, subscribed, color });
    res.send(200);
  }));

  server.post('/store', bodyParser(), finalize(async function(req, res, next) {
    await db.storeReading(req.body); // [TODO] this will need some safeguards
    res.send(200);
  }));


  server.get('/readings', queryParser(), finalize(async function (req, res, next) {
    const opts = {
      since: req.query.since,
      until: req.query.until,
      filters: req.query.filters instanceof Array ? req.query.filters :
        req.query.filters ? [req.query.filters] : [],
      aggregation: req.query.aggregation instanceof Array ? req.query.aggregation :
        req.query.aggregation ? [req.query.aggregation] : undefined,
    };
    const result = await db.getReadings(opts);
    res.send(result);
  }));

  server.get('/samples', queryParser(), finalize(async function (req, res, next) {
    const opts = {
      since: req.query.since,
      until: req.query.until,
      filters: req.query.filters instanceof Array ? req.query.filters :
        req.query.filters ? [req.query.filters] : [],
      timeBucket: req.query.timeBucket,
      aggTypes: req.query.aggTypes instanceof Array ? req.query.aggTypes :
        req.query.aggTypes ? [req.query.aggTypes] : ['min', 'max', 'avg'],
    };
    const result = await db.samples(opts);
    res.send(result);
  }));

  server.get('/frontend/*', serveStaticFiles('./frontend/build/'));
}

module.exports = routes;
