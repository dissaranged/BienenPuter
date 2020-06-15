const { InfluxDB, escape } = require('@influxdata/influxdb-client');
const { BadRequestError } = require('restify-errors');

const { url, token, org, bucket } = require('./config/influx');

const MEASUREMENT = 'weather';
const SUPPORTED_FIELDS = [
  'temperature_C',
  'temperature_F',
  'humidity',
];

let queryApi;

module.exports = {
  setup() {
    queryApi = new InfluxDB({ url, token }).getQueryApi(org);
  },

  query({ device, field, since, until, window }) {
    if (!SUPPORTED_FIELDS.includes(field)) {
      throw new BadRequestError(`Unsupported field '${field}'. Supported fields are: ${JSON.stringify(SUPPORTED_FIELDS)}`);
    }
    const sinceISO = new Date(since).toISOString();
    const untilISO = new Date(until).toISOString();
    const fluxQuery = `
      import "math"
      from(bucket: ${escape.quoted(bucket)})
      |> range(start: time(v: ${escape.quoted(sinceISO)}), stop: time(v: ${escape.quoted(untilISO)}))
      |> filter(fn:(r) =>
          r._measurement == ${escape.quoted(MEASUREMENT)} and
          r._field == ${escape.quoted(field)} and
          r.device == ${escape.quoted(device)}
      )
      |> window(every: duration(v: ${escape.quoted(window)}))
      |> reduce(fn: (r, accumulator) => ({
           min: math.mMin(x: r._value, y: accumulator.min),
           sum: accumulator.sum + r._value,
           count: accumulator.count + 1.0,
           max: math.mMax(x: r._value, y: accumulator.max),
      }), identity: { min: 100000000.0, max: -10000000.0, sum: 0.0, count: 0.0 })
      |> map(fn: (r) => ({
          r with
          _time: time(v: int(v: r._start) + (int(v: r._stop) - int(v: r._start)) / 2),
          mean: r.sum / r.count
      }))
      |> window(every: inf)
      |> duplicate(column: "_time", as: "time")
      |> drop(columns: ["count", "sum", "_measurement", "_start", "_stop", "_field", "device", "_time"])
    `;
    return new Promise((resolve, reject) =>  {
      const results = [];
      let indices = null;
      queryApi.queryRows(fluxQuery, {
        next(row, tableMeta) {
          const { time, min, max, mean } = tableMeta.toObject(row);
          results.push({ time, min, max, mean });
        },
        complete() {
          resolve(results);
        },
        error: reject,
      });
    });
  }
};
