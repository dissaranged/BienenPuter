const chai = require('chai');
const { expect } = chai;
const restify = require('restify');
const routes = require('../routes');
const db = require('../redis');
const { toName, toRedisResult } = require('../utils.js');

const exampleDevice = {
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
  subscribed: false,
  alias: 'Temp1',
  color: '005500',
  key: 'Model1:123@1',
};


describe('Routes', () => {
  let redis, server;
  before(async () => {
    // setup db
    redis = db.setup({ db: 1 });
    // setup routes
    server = restify.createServer();
    routes(server);
  });
  after(done => {
    server.close(
      () => redis.quit(done)
    );
  });

  describe('GET /devices', () => {
    const devices = {
      [exampleDevice.latest.key]: exampleDevice,
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
          [key]: val
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

  describe('PUT /device/:name', () => {

    beforeEach(async () => {
      await db.hsetObject(toName(exampleDevice.key), exampleDevice);
    });

    it('returns 404 when device not known', async () => {
      const response = await chai.request(server).put('/device/Unknown?subscribed=true');
      expect(response).to.have.status(404);
      expect(await redis.hgetall(toName('Unknown'))).to.equal(null);
    });

    it('alters an existing device', async () => {
      expect(await redis.hget(toName(exampleDevice.key), 'subscribed')).to.equal('false');
      const response = await chai.request(server).put(`/device/${exampleDevice.key}?subscribed=true`);
      expect(response).to.have.status(200);
      expect(await redis.hgetall(toName(exampleDevice.key))).to.deep.equal(toRedisResult({
        ...exampleDevice,
        subscribed: true
      }));
    });
  });

  describe('GET /device/:key', () => {
    let readings, now;
    beforeEach(async () => {
      readings = [];
      const commands = [];
      now = Math.floor(Date.now()/1000);
      for(let c = 0; c < 1000; c++) {
        const item = {
          ...exampleDevice.latest,
          time: (new Date((now-c*6)*1000)).toISOString(),
          temperature_C: c%80,
        };
        readings.push(item);
        commands.push(
          now-c*6,
          JSON.stringify(item),
        );
      }
      await redis.zadd(toName(exampleDevice.key, 'readings'), commands);
    });

    describe('raw', () => {
      describe('with pagination disabled', () => {
        it('should return all raw readings', async () => {
          const response = await chai.request(server).get(`/device/${exampleDevice.key}?perPage=-1`);
          expect(response).to.have.status(200);
          expect(response.body).to.have.deep.members(readings);
        });

        it('should return all raw readings after since', async () => {
          const response = await chai.request(server).get(`/device/${exampleDevice.key}?since=${now-60}&perPage=-1`);
          expect(response).to.have.status(200);
          expect(response.body).to.have.length(11);
          expect(response.body).to.have.deep.members(readings.filter(
            item => Math.floor((new Date(item.time)).valueOf() / 1000) >= now - 60
          ));
        });

        it('should return all raw readings older until', async () => {
          const response = await chai.request(server).get(`/device/${exampleDevice.key}?until=${now-60}&perPage=-1`);
          expect(response).to.have.status(200);
          expect(response.body).to.have.length(990);
          expect(response.body).to.have.deep.members(readings.filter(
            item => Math.floor((new Date(item.time)).valueOf() / 1000) <= now - 60
          ));
        });

        it('should return all raw readings between until and since', async () => {
          const response = await chai.request(server).get(`/device/${exampleDevice.key}?since=${now-120}&until=${now-60}&perPage=-1`);
          expect(response).to.have.status(200);
          expect(response.body).to.have.length(11);
          expect(response.body).to.have.deep.members(readings.filter(
            item => Math.floor((new Date(item.time)).valueOf() / 1000) <= now - 60
              && Math.floor((new Date(item.time)).valueOf() / 1000) >= now - 120
          ));
        });
      });
      describe('pagination', () => {
        it('should be able to return paginated data', async () => {
          const response = await chai.request(server).get(`/device/${exampleDevice.key}?perPage=100`);
          expect(response).to.have.status(200);
          expect(response.body).to.have.length(100);
          expect(response.body).to.have.deep.members(readings.slice(0, 100));
          expect(response.headers).to.deep.include({'x-total': '1000', 'x-per-page': '100', 'x-page-offset': '0'});
        });

        it('should return the correct data for the offset', async () => {
          const response = await chai.request(server).get(`/device/${exampleDevice.key}?perPage=100&pageOffset=30`);
          expect(response).to.have.status(200);
          expect(response.body).to.have.length(100);
          expect(response.body).to.have.deep.members(readings.slice(30, 130));
          expect(response.headers).to.deep.include({'x-total': '1000', 'x-per-page': '100', 'x-page-offset': '30'});
        });

        it('should return all readings correctly', async () => {
          const results = [];
          for(let c = 0; c < 1000; c+=100) {
            const response = await chai.request(server).get(`/device/${exampleDevice.key}?perPage=100&pageOffset=${c}`);
            results.push.apply(results, response.body);
          }
          expect(results).to.have.length(1000);
          expect(results).to.have.deep.members(readings);

        });
      });
    });

    describe('6m smaples', () => {
      beforeEach(async () => {
        await db.createIndex(exampleDevice.key, {since: now-6000, until: now});
      });
      it('should be able to return summaries', async () => {
        const response = await chai.request(server).get(`/device/${exampleDevice.key}?type=6m`);
        expect(response).to.have.status(200);
        expect(response.body).to.have.length(Math.ceil(readings.length*6/360));
        console.log(JSON.stringify(response.body[10], null,2), 'propper integrity check missing');
        // expect(response.body).to.have.deep.members([]);
      });
    });
  });
});
