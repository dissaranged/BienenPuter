const { plugins: { queryParser, serveStaticFiles } } = require('restify');
const db = require('./redis');
const measurements = require('./measurements');

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
    const result = await db.devices();
    res.send(result);
  }));

  server.put('/device/:name', queryParser(), finalize(async function (req, res, next) {
    const device = req.params.name.toString();
    const { alias, subscribed, color } = req.query;
    await db.configureDevice(device, { alias, subscribed, color });
    res.send(200);
  }));

  server.get('/device/:name', queryParser(), finalize(async function (req, res, next) {
    const opts = {
      device: req.params.name,
      since: req.query.since,
      until: req.query.until,
      type: req.query.type,
      perPage: req.query.perPage,
      pageOffset: req.query.pageOffset,
    };
    const result = await db.getReadings(opts);
    res.send(200, result.data, {'x-total': result.total, 'x-per-page': result.perPage, 'x-page-offset': result.pageOffset}); // do not like this, default perPage is now here and in db.getReadings
  }));

  server.get('/measurements/:device/:field/:since/:until/:window', finalize(async function(req, res, next) {
    res.send(200, await measurements.query(req.params));
  }));

  server.get('/frontend/*', serveStaticFiles('./frontend/build/'));
}

module.exports = routes;
