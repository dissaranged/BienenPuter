const redis = require('redis');
const { NotFoundError } = require('restify-errors');
const { promisify } = require('util');
const { toName, fromRedisResult } = require('./utils');
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
        'sadd', 'srem', 'smembers'
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
      return batch(
        client.multi()
          .zadd(`readings.${data.key}`, Math.floor(new Date(data.time).valueOf() / 1000), JSON.stringify(data))
          .hset(devName, 'latest', JSON.stringify(data))
      );
    }
    if(subscribed == null) {
      return client.hmset(devName, 'latest', JSON.stringify(data), 'key', key);
    }
    return client.hset(devName, 'latest', JSON.stringify(data));
  },

  async configureDevice(device, opts) {
    // console.log('configureDevice( ', device, opts, ' )');
    if(!await client.exists(toName(device, 'device'))) {
      throw new NotFoundError(`${device} not known`);
    }
    return client.hmset(
      toName(device), 
      Object.entries(opts).reduce(
        (acc, [key, val]) => val ? acc.concat(key, val): acc
        , []
      ));
  },

  async devices () {
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

  async getReadings (opts) {
    const { device, since, until } = opts;
    const fieldName = toName(device, 'readings');
    if( !await client.exists(fieldName) ) {
      throw new NotFoundError('device not known');
    }
    const newerThan = since ? since.toString() : 0;
    const olderThan = until ? until.toString() : '+inf';
    const result = await client.zrangebyscore(fieldName, newerThan, olderThan);
    return result.map(item => JSON.parse(item));
  },
  batch,
  hsetObject
};

module.exports = db;
