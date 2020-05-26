const chai = require('chai');
const { expect } = chai;
const db = require('../redis');
const { toName, toRedisResult } = require('../utils.js');

describe('DB controller', () => {
  let redis;
  before(async () => {
    // setup db
    redis = db.setup({ db: 1 });
    expect(await redis.keys('*')).to.have.length(0);
  });

  describe('storeReading', () => {
    const fixtures = {
      'Model1:123@1': {
        latest: {
          time: '2020-05-08,15:14:25',
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
      },
      subscribedDevice: {
        latest: {
          time: '2020-05-08,15:14:25',
          brand: 'OS',
          model: 'Model1',
          id: 123,
          channel: 3,
          battery_ok: 1,
          temperature_C: 16.6,
          key: 'Model1:123@3'
        },
        subscribed: true,
        alias: 'Temp2',
        color: '550000',
        key: 'Model1:123@3'
      },
      reading: {
        time: '2020-05-06,16:25:46',
        brand: 'OS',
        model: 'Model1',
        id: 123,
        channel: 2,
        battery_ok: 1,
        temperature_C: 16.6,
        key: 'Model1:123@2'
      }
    };

    beforeEach(async () => {
      await db.hsetObject(toName('Model1:123@1'), fixtures['Model1:123@1']);
      await db.hsetObject(toName(fixtures.subscribedDevice.latest.key), fixtures.subscribedDevice);
    });

    it('creates a new device enrty when storing a reading of an unknown device', async () => {
      const { reading } = fixtures;
      const { key } = reading;
      expect( await redis.exists(toName(key)) ).to.equal(0);
      await db.storeReading(reading);
      expect(await redis.exists(toName(key))).to.equal(1);
      const result = await redis.hgetall(toName(key));
      expect(result).to.deep.equal({ latest: JSON.stringify(reading), key });
      const readings = await redis.zscan(`readings.${key}`, 0);
      expect(readings).to.deep.equal(['0', []]);
    });

    it('saves new readings to latest', async () => {
      const key = 'Model1:123@1';
      const item = fixtures[key];
      const newReading = {
        ...item.latest,
        time: fixtures.reading.time,
        temperature_C: 15.3
      };
      expect( await redis.hgetall(toName(key)) ).to.deep.equal( toRedisResult(item) );
      await db.storeReading(newReading);
      expect( await redis.exists(toName(key)) ).to.equal(1);
      const result = await redis.hgetall(toName(key));
      expect(result).to.deep.equal(toRedisResult({ ...item, latest: newReading }));
      const readings = await redis.zscan(`reading.${key}`, 0);
      expect(readings).to.deep.equal(['0', []]);
    });

    it('collects readings when subscribed to an deviec', async () => {
      const item = fixtures.subscribedDevice;
      const { key } = item.latest;
      const newReading = {
        ...item.latest,
        time: fixtures.reading.time,
        temperature_C: 15.3
      };
      await db.storeReading(newReading);
      const readings = await redis.zscan(`readings.${key}`, 0);
      expect(readings).to.deep.equal(['0', [JSON.stringify(newReading), JSON.stringify(Date.parse(newReading.time) / 1000)]]);
      const deviceEntry = await redis.hgetall(toName(key));
      expect(deviceEntry).to.deep.equal(toRedisResult({
        ...item, latest: newReading
      }));
    });
  });

  describe('createIndex', () => {
    const latestExample = {
      time: '2020-05-08,15:14:25',
      brand: 'OS',
      model: 'Model1',
      id: 123,
      channel: 1,
      battery_ok: 1,
      temperature_C: 16.6,
      key: 'Model1:123@1'
    };
    const now = 1590232971;

    beforeEach(async () => {
      const commands = [//val|+t
        [10,   0 ],
        [20,  60 ],
        [40,  70 ],
        [40, 360 ],
      ].reduce( (acc, [val, t]) => ([
        ...acc,
        now+t,
        JSON.stringify({
          ...latestExample,
          time: new Date((now+t)*1000),
          temperature_C: val,
          humidity: val*2,
        })
      ]), []);
      await redis.zadd(toName(latestExample.key, 'readings'), commands);
    });

    it('creates 6m samples correctly', async () => {
      await db.createIndex(latestExample.key, {since: now, until: now+360});
      const {data} = await db.getReadings({device: latestExample.key, type: '6m'});
      expect(data).to.deep.equal([{
        temperature_C: {min: 10, max: 40, average: (10*30+20*35+40*295)/360},
        humidity: {min: 20, max: 80, average: 2*(10*30+20*35+40*295)/360},
        time: (now+180)*1000
      }]);
    });
  });
});
