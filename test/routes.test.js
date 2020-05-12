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
});
