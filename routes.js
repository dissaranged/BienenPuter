const { plugins: { queryParser } } = require('restify');
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
    };
    const data = await db.getReadings(opts);
    res.send(200, data);
  }));

}

module.exports = routes;
