const { plugins: { queryParser } } = require('restify');
const db = require('./redis');

function routes (server) {
    server.put('/subscribe/:device', async function (req, res, next) {
        try {
            await db.subscribe(req.params.device); // what happens to the result here can this fail ?
            res.send(200);
            next();
        } catch (e) {
            console.error(e);
            next(e);
        }
    });

    server.put('/unsubscribe/:device', async function (req, res, next) {
        try {
            await db.unsubscribe(req.params.device);
            res.send(200);
            next();
        } catch (e) {
            console.error(e);
            next(e);
        }
    });

    server.get('/devices', async function (req, res, next) {
        try {
            const result = await db.devices();
            res.send(result);
            next();
        } catch (e) {
            console.error(e);
            next(e);
        }
    });

    server.put('/device/:name', queryParser(), async function (req, res, next) {
        const device = req.param.name;
        const { alias, subscribed, color } = req.query;
        db.configureDevice(device, { alias, subscribed, color });
        res.send(500);
        next();
    });

    server.get('/device/:name', queryParser(), async function (req, res, next) {
        try {
            const opts = {
                device: req.params.name,
                since: req.query.since,
                until: req.query.until
            };
            if (await db.exists(`readings.${opts.device}`)) {
                const data = await db.getReadings(opts);
                res.send(data);
            } else {
                res.send(404, 'Device Not Known');
            }
            next();
        } catch (e) {
            console.error(e);
            next(e);
        }
    });
}

module.exports = routes;
