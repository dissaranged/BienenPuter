const redis = require('redis');
const { NotFoundError } = require('restify-errors');
const { promisify } = require('util');
const { toName, fromRedisResult, RAW_SENSOR_NAMES } = require('./utils');
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
      const chain = client.multi()
            .zadd(toName(key, 'readings'), Math.floor(new Date(data.time).valueOf() / 1000), JSON.stringify(data))
            .hset(devName, 'latest', JSON.stringify(data));
      const now = Date.now().valueOf();
      const lastIndexRound = parseInt(await client.hget(devName, 'lastIndex')) || parseInt((await client.zrangebyscore(toName(key, 'readings'), 0, '+inf', 'LIMIT', 0, 1, 'WITHSCORES') )[1])*1000 || now;
      if(now >= lastIndexRound + 6*60*1000) { // create Index every full 6m
        const nextIndexRound = now-(now % (6*60*1000));
        chain.hset(devName, 'lastIndex', nextIndexRound);
        await batch(chain);
        await db.createIndex(key, {since: lastIndexRound/1000, until: nextIndexRound/1000});
      } else {
        return batch(chain);
      };
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
    const { device, since, until, type, perPage, pageOffset } = opts;
    const fieldName = toName(device, type || 'readings');
    if( !await client.exists(fieldName) ) {
      throw new NotFoundError('device not known');
    }
    const newerThan = since ? since.toString() : 0;
    const olderThan = until ? until.toString() : '+inf';

    const offset = pageOffset ? pageOffset.toString() : 0;
    const count = perPage ? perPage.toString() : 100;

    const chain = client.multi();
    chain.zcount(fieldName, newerThan, olderThan);
    chain.zrevrangebyscore(fieldName,  olderThan, newerThan, 'LIMIT', offset, count);
    const [total, result] = await batch(chain);
    return {
      total,
      perPage: count,
      pageOffset: offset,
      data: result.map(item => JSON.parse(item))};
  },

  async createIndex(device, {since, until}) {
    const readingsFname = toName(device, 'readings');
    const sampleFname = toName(device, '6m');
    const chain = client.multi();
    const intervall = 6*60; // sample intervall in secconds (6m)
    for(let c = 0; since + c < until; c += intervall) {
      const readings = await client.zrangebyscore(readingsFname, since + c, since + c +intervall);
      if(readings.length === 0) {
        const error = new NotFoundError(`try to index nonexisting readings: ${readingsFname} ${since+c} ${since+c+intervall}`);
        console.log(error);
        continue;
      }
      const sample = readings
            .map(JSON.parse)
            .reduce((sample, reading, index, data) => {
              const start = index > 0 ? new Date(data[index-1].time) : new Date((since +c)*1000);
              const end = index < data.length-1 ? new Date(data[index+1].time) : new Date((since+ c + intervall)*1000);
              const weight = (end -start) /1000 /2 / intervall;
              return RAW_SENSOR_NAMES
                .filter((name) => Object.keys(reading).includes(name))
                .reduce( (acc, name) => {
                  const data = sample[name] || {average: 0, min: +Infinity, max: -Infinity};
                  return {
                    ...acc,
                    [name]: {
                      min: data.min > reading[name] ? reading[name] : data.min,
                      max: data.max < reading[name] ? reading[name] : data.max,
                      average: data.average + (reading[name] * weight),
                    }, 
                  };
                }, sample);
            },  {});
      chain.zadd(sampleFname, since+c+intervall/2, JSON.stringify({ ...sample, time: (since+c+intervall/2.0)*1000}));
    }
    await batch(chain);
  },

  batch,
  hsetObject
};

module.exports = db;
