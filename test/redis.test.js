const chai = require('chai');
const { expect } = chai;
const db = require('../redis');

describe('redis setup', () => {
  let redis;
  before(async () => {
    // setup db
    redis = db.setup({ db: 1 });
  });

  describe('RedisTimeSeries', () => {
    it('supports ts', async () => {
      expect(
        await redis.ts_create('example', 'LABELS', 'name', 'sensorName', 'unit', 'C')
      ).to.equal('OK');
      expect(
        await redis.ts_info('example')
      ).to.deep.equal([
        "totalSamples", 0,
        "memoryUsage", 4239,
        "firstTimestamp", 0,
        "lastTimestamp", 0,
        "retentionTime", 0,
        "chunkCount", 1,
        "maxSamplesPerChunk", 256,
        "labels", [
          [ "name", "sensorName" ],
          [ "unit", "C" ]
        ],
        "sourceKey", null,
        "rules", [],
      ]);
    });

    it('can do some basic add functionality', async () => {
      const time = new Date();
      expect(
        await redis.ts_add('example1', time.valueOf(), 20.3)
      ).to.equal(time.valueOf()); // will create keys
      expect(
        await redis.ts_create('example2', 'LABELS', 'name', 'sensorName', 'unit', 'C')
      ).to.equal('OK');
      expect(
        await redis.ts_madd('example1',  time.valueOf()+1, '1', 'example2', time.valueOf(), '2')
      ).to.deep.equal([time.valueOf()+1, time.valueOf()]); // with ts_madd keys must exists
      expect(
        await redis.keys('*')
      ).to.have.members(['example1', 'example2']);
    });
  });
});
