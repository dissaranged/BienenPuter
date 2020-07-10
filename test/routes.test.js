const chai = require('chai');
const qs = require('qs');
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

    it('creates ts series on subscription');
  });

  describe('store', ()=> {
    const devices = {
      [exampleDevice.latest.key]: exampleDevice,
      'Model1:123@2': {
        latest: {
          temperature_C: 23,
          humidity: 12,
        }
      },
      Model2: {
        subscribed: true,
        latest: {
          temperature_C: 44
        }
      },
      'Model2@1': {
        alias: 'empty',
        latest: {
          humidity: 80
        }
      }
    };
    const time = new Date();

    beforeEach(async ()=> {
      expect(
        await Promise.all(Object.entries(devices).map(
          ([name, values]) => db.hsetObject(toName(name, 'device'), values)
        ))
      ).to.deep.equal(['OK', 'OK', 'OK', 'OK']);
      expect(
        await chai.request(server).put('/device/Model2@1?subscribed=true')
      ).to.have.status(200);
      expect(
        await chai.request(server).put('/device/Model1:123@2?subscribed=true')
      ).to.have.status(200);
    });
    it('will store subscribed devices', async () => {
      expect(
        await chai.request(server).post('/store').send({
          time: time,
          temperature_C: 23,
          humidity: 12,
          key: 'Model1:123@2'
        })
      ).to.have.status(200);
      expect(
        await db.redis.ts_mrange(0, Date.now(), 'FILTER', 'readings=true')
      ).to.deep.equal([
        ["readings.Model1%3A123@2.humidity", [],
          [
            [time.valueOf(),"12",]
          ]
        ],
        [
          "readings.Model1%3A123@2.temperature_C",  [],
          [
            [time.valueOf(), "23"]
          ]
        ],
        [ "readings.Model2@1.humidity", [], [] ]
      ]);
    });
  });

  describe('readings', () => {
    async function createDevice(key, obj) {
      await db.hsetObject(toName(key, 'device'), obj);
      await chai.request(server).put(`/device/${key}?subscribed=true`);
    }
    const devices = {
      sensor1: {latest: {key: 'sensor1', temperature_C: 0}},
      sensor2: {latest: {key: 'sensor2', temperature_C: 0, humidity: 0}},
      sensor3: {latest: {key: 'sensor3', humidity: 0}},
    };
    const time = new Date('1-1-2000');
    beforeEach(async () => {
      await Promise.all(
        Object.entries(devices).map(
          ([key, obj]) => createDevice(key,obj)
        ));
      const promises = [];
      for( let i = 0; i <= 50; i++) {
        Object.keys(devices).slice(0,2).map(
          (key, index) => promises.push(
            chai.request(server).post('/store').send({
              time: new Date(Date.parse(time)+i*1000), key,
              temperature_C: 20+10*Math.sin(i +index *2),
            }))
        );
        Object.keys(devices).slice(1).forEach(
            (key, index) => promises.push(
              chai.request(server).post('/store').send({
                time: new Date(Date.parse(time)+i*1000), key,
                humidity: 50+ 50* Math.cos(i +index *2),
              }))
        );
      }
      await Promise.all(promises);
    });

    it('will return some data', async () => {
      const response = await chai.request(server).get(`/readings`);
      expect(response).to.have.status(200);
      expect(response.body).to.have.keys('sensor1', 'sensor2', 'sensor3');

    });
    it('will apply a filter', async () => {
      const response = await chai.request(server).get(`/readings?${qs.stringify({
        filters:'key=sensor1'
       })}`);
      expect(response).to.have.status(200);
      expect(response.body).to.have.keys('sensor1');
    });
    it('will apply two filters', async () => {
      const response = await chai.request(server).get(`/readings?${qs.stringify({
        filters:['key=sensor2', 'type=humidity']
      })}`);
      expect(response).to.have.status(200);
      expect(response.body).to.have.keys('sensor2');
      expect(response.body.sensor2).to.have.keys('humidity', 'key');

    });

    it('can do aggregations', async () => {
      const response = await chai.request(server).get(`/readings?${qs.stringify({
        aggregation: ['avg', 5000],
        filter: ['key=sensor2']
       })}`);
      expect(response).to.have.status(200);
      expect(response.body.sensor2.humidity).to.have.length(11);
    });

    it('can produce samples', async () => {
      const response = await chai.request(server).get(`/samples?${qs.stringify({
        timeBucket: 50000,
       })}`);
      expect(response).to.have.status(200);
      expect(response.body).to.have.keys('sensor1', 'sensor2', 'sensor3');
      expect(response.body.sensor2).to.have.keys('humidity', 'temperature_C');
      expect(response.body.sensor2.humidity).to.have.keys('min', 'max', 'avg');
    });

    it('can produce samples and filter', async () => {
      const response = await chai.request(server).get(`/samples?${qs.stringify({
        timeBucket: 5000,
        aggTypes: ['min', 'max', 'avg'],
        filters: 'type=humidity'
       })}`);
      expect(response).to.have.status(200);
      expect(response.body).to.have.keys('sensor2', 'sensor3');
      expect(response.body.sensor2).to.have.keys('humidity');
      expect(response.body.sensor2.humidity).to.have.keys('min', 'max', 'avg');
    });

  });
});
