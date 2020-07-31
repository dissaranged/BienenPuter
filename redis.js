const redis = require('redis');
const tsCommands = [
  'ts.create', 'ts.alter',
  'ts.add', 'ts.madd',
  'ts.incrby', 'ts.decrby',
  'ts.createrule', 'ts.deleterule',
  'ts.range', 'ts.revrange', 'ts.mrange', 'ts.mrevrange',
  'ts.get', 'ts.mget',
  'ts.info',
].map( command => {
  redis.add_command(command);
  return command.replace('.', '_');
});
const { NotFoundError } = require('restify-errors');
const { promisify } = require('util');
const { toName, fromRedisResult, toObject, RAW_SENSOR_NAMES } = require('./utils');
let client;

function batch (chain) {
  return new Promise(function (resolve, reject) {
    chain.exec(function (err, replies) {
      if (err) {
        reject(err);
        return;
      }
      resolve(replies); // can this still be failed due to responses?
    });
  });
}

function isString (value) {
  return (typeof value === 'string' || value instanceof String);
}

async function hsetObject (name, obj) {
  const values = Object.entries(obj).reduce((acc, [key, value]) => [
    ...acc,
    key,
    isString(value) ? value : JSON.stringify(value)
  ], []);
  if (values.length === 0) { throw new Error(`object ${name} seems to be empty: `, obj); }
  return db.redis.hmset(name, values);
}

const db = {
  redis: null,
  setup (options) {
    if (!db.redis) {
      client = redis.createClient(options);

      client.on('error', function (error) {
        console.error(error);
      });
      client.on('ready', function () { console.log('Redis says Hi!'); });
      client.on('end', function () {
        db.redis = null;
        console.log('Redis says Bye!');
      });
      client.on('warning', function () { console.log('Warning!', arguments); });
      [ // I do not want to add another dependencie just for promisifyAll
        'keys', 'exists', 'exec',
        'set', 'get', 'mget',
        'hset', 'hmset', 'hget', 'hgetall',
        'zadd', 'zrangebyscore', 'zscan',
        'sadd', 'srem', 'smembers',
        ...tsCommands,
      ].forEach(name => {
        client[`${name}Sync`] = client[name];
        client[name] = promisify(client[name]).bind(client);
      });
      db.redis = client;
    }
    return db.redis;
  },

  async storeReading (data) {
    console.log('storeing :', data);
    const { key } = data;
    const devName = toName(key, 'device');
    const subscribed = await client.hget(devName, 'subscribed');
    if (subscribed === 'true') {
      const fields = RAW_SENSOR_NAMES.reduce((acc, fieldName) => data[fieldName] ? [...acc, toName(key, 'readings', fieldName), Date.parse(data.time), data[fieldName]] : acc, []);
      const result = await db.redis.ts_madd(fields);
      const errors = result.filter( item => (item instanceof Error));
      if(errors.length > 0) { // [TODO] when errors occur for some keys it does not set latest but still the succeeding rest
        console.log();
        const error = new Error(['TS.MADD failed',...errors]);
        error.meta = {errors, data};
        throw error;
      }
    }
    if(subscribed == null) {
      return client.hmset(devName, 'latest', JSON.stringify(data), 'key', key);
    }
    return client.hset(devName, 'latest', JSON.stringify(data));
  },

  async subscribe(key) {
    const latest = await db.redis.hget(toName(key), 'latest').then(JSON.parse);
    const chain = db.redis.multi();
    RAW_SENSOR_NAMES.filter( name => Object.keys(latest).includes(name))
      .forEach( fieldName => chain.ts_create(
          toName(key, 'readings', fieldName),
          'LABELS', 'key', key, 'type', fieldName, 'readings', true
      ));
    return await batch(chain);
  },

  async configureDevice(device, opts) {
    // console.log('configureDevice( ', device, opts, ' )');
    if(!await client.exists(toName(device, 'device'))) {
      throw new NotFoundError(`${device} not known`);
    }
    if(opts.subscribed) {
      db.subscribe(device);
    }
    return client.hmset(
      toName(device),
      Object.entries(opts).reduce(
        (acc, [key, val]) => val ? acc.concat(key, val): acc
        , []
      ));
  },

  async getDevices () {
    const devices = await client.keys('device.*');
    if (devices.length === 0) { return []; }
    const result = await batch(devices.reduce(
      (chain, device) => chain.hgetall(device),
      client.multi()
    ));
    return result.reduce((acc, data, index) => ({
      ...acc,
      [devices[index].slice(7)]: fromRedisResult(data),
    }), {});
  },

  async getReadings(opts) {
    const {since, until, filters, aggregation} = opts;
    const result = await db.redis.ts_mrange(
      Date.parse(since) || 0,
      Date.parse(until) || Date.now(),
      ...(aggregation ? ['AGGREGATION', ...aggregation]: []),
      'WITHLABELS',
      'FILTER', 'readings=true', ...filters,
    );
    return result.reduce((acc, [, labelsList, readingsList]) => {
      const labels = toObject(labelsList);
      return {
        ...acc,
        [labels.key]: {
          ...acc[labels.key],
          key: labels.key,
          [labels.type]: readingsList
        }
      };
    }, {});
  },

  async samples (opts) {
    const {since, until, filters, timeBucket, aggTypes} = opts;
    const chain = db.redis.multi();
    aggTypes.forEach( aggType => {
      chain.ts_mrange(
        Date.parse(since) || 0,
        Date.parse(until) || Date.now(),
        'AGGREGATION', aggType, timeBucket,
        'WITHLABELS',
        'FILTER', 'readings=true', ...filters,
      );
    });
    const result = await batch(chain);
    const errors = result.filter(item => item instanceof Error );
    if(errors.length > 0) {
      throw new Error(errors.join()); // [TODO] this should be done a bit better
    }

    // this code is very confusing
    // tunring a list of the form
    // [
    //   [redings.device1, [...[label1, value]], [ ...[time, value] ]] // min
    //   [redings.device1, [...[label1, value]], [ ...[time, value] ]] // max
    // ]
    // into
    // { deviceKey : [...{time, min, max}]}
    return result[0].reduce( (acc, [, labelsList], deviceIndex) => {
      const labels = toObject(labelsList);
      return result[0][0][2].reduce( (acc, [time], readingIndex) =>(
        {
          ...acc,
          [labels.key]: {
            ...acc[labels.key],
            [labels.type]: [
              ...((acc[labels.key]||{})[labels.type] || []),
              {
                ...toObject(aggTypes.map(
                  (aggType, aggIndex) => [aggType, result[aggIndex][deviceIndex][2][readingIndex][1]]
                )),
                time
              }
            ]
          }}), acc);
    }, {});
  },

  batch,
  hsetObject
};

module.exports = db;
