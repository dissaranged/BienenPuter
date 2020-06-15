const db = require('./redis');
const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const utils = require('./utils');

db.setup();

const { url, token, org, bucket } = require('./config/influx');

const precision = 'ms'; // millisecond precision for timestamps

const writeApi = new InfluxDB({ url, token }).getWriteApi(org, bucket, precision);

(async () => {
  let i = 0;
  await db.readingsInBatches(async batch => {
    i++;
    const points = batch.map(reading => {
      const point = new Point('weather')
            .tag('device', reading.key)
            .timestamp(Date.parse(reading.time));
      return utils.RAW_SENSOR_NAMES.reduce((p, name) => reading.hasOwnProperty(name) ? p.floatField(name, reading[name]) : p, point);
    });
    writeApi.writePoints(points);
    await writeApi.flush();
    console.log('Flushed batch', i);
  });

  await writeApi.close();
  console.log('Done!');
  process.exit(0);
})();
