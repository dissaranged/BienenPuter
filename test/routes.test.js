const chai = require('chai');
const { expect } = chai;
const restify = require('restify');
const routes = require('../routes');
const db = require('../redis');
const { toRedisResult } = require('../utils.js');

describe('Routes', () => {
    let redis, server;
    before(async () => {
    // setup db
        redis = db.setup({ db: 1 });
        expect(await redis.keys('*')).to.have.length(0);
        // setup routes
        server = restify.createServer();
        routes(server);
    });
    after(done => {
        server.close(
            () => redis.quit(done)
        );
    });

    afterEach(async () => {
        await redis.flushdb();
    });

    describe('/devices', () => {
        const devices = {
            'Model1:123@1': {
                latest: {
                    time: '2020-05-06,16:25:46',
                    brand: 'OS',
                    model: 'Model1',
                    id: 123,
                    channel: 1,
                    battery_ok: 1,
                    temperature_C: 16.6,
                    key: 'Model1:123@1'
                },
                subscribed: true,
                alias: 'Temp1',
                color: '005500'
            },
            'Model1:123@2': {
                latest: {}
            },
            Model2: {
                subscribed: true
            },
            'Modle2@1': {
                alias: 'empty'
            }
        };
        beforeEach(async () => {
            await Promise.all(Object.entries(devices).map(([name, values]) => db.hsetObject(`device.${name}`, values)));
        });

        it('should return a list of all devices with stats', async () => {
            const response = await chai.request(server).get('/devices');
            expect(response).to.have.status(200);
            expect(response.body).to.deep.equal(
                Object.entries(devices).reduce((acc, [key, val]) => ({
                    ...acc,
                    [key]: toRedisResult(val)
                }), {})
            );
        });

        it('should return empty list whitout devices', async () => {
            await redis.flushdb();
            const response = await chai.request(server).get('/devices');
            expect(response).to.have.status(200);
            expect(response.body).to.have.length(0);
        });
    });
});
