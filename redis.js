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

  async readingsInBatches(callback) {
    await Promise.all((await client.keys('readings.*')).map(async key => {
      let cursor = '0';
      do {
        const [newCursor, batch] = await client.zscan([key, cursor]);
        cursor = newCursor;
        await callback(batch
                       .map(raw => JSON.parse(raw))
                       .filter(value => typeof value === 'object'));
      } while (cursor !== '0');
    }));
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
      await batch(chain);
      return db.indexing(key);
    }
    if(subscribed == null) {
      return client.hmset(devName, 'latest', JSON.stringify(data), 'key', key);
    }
    return client.hset(devName, 'latest', JSON.stringify(data));
  },

  async indexing(key) {
    const now = Date.now().valueOf();
    const devName = toName(key, 'device');
    const lastIndexRound = parseInt((await client.zrevrangebyscore(toName(key, '6m'), '+inf', 0, 'LIMIT', 0, 1, 'WITHSCORES') )[1])*1000
          || parseInt((await client.zrangebyscore(toName(key, 'readings'), 0, '+inf', 'LIMIT', 0, 1, 'WITHSCORES') )[1])*1000
          || now;
    if(now >= lastIndexRound + 6*60*1000) { // create Index every full 6m
      const nextIndexRound = now-(now % (6*60*1000)); // round down to last full 6m
      await db.createIndex(key, {since: lastIndexRound/1000, until: nextIndexRound/1000});
      await client.hset(devName, 'lastIndex', nextIndexRound);
    };
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
      throw new NotFoundError(`device not known: ${device}`);
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
      data: result ? result.map(item => JSON.parse(item)) : []};
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
      let sample = readings
            .map(JSON.parse)
            .reduce((sample, reading, index, data) => {
              let weight = 0; // the following code sucks
              if(data.length === 1){
                  weight = 1;
              } else if(index === 0) {
                const start = new Date((since+c)*1000);
                const end = new Date(data[index+1].time);
                const now = new Date(reading.time);
                weight = ((end-now)/2 + (now-start)) /1000 /intervall;
              } else if(index === data.length -1) {
                const start = new Date(data[index-1].time);
                const end = new Date((since+c+intervall)*1000);
                const now = new Date(reading.time);
                weight = ((now-start)/2 + (end-now)) /1000 /intervall;
              } else {
                const start = new Date(data[index-1].time);
                const end = new Date(data[index+1].time);
                weight = (end -start) /2 /1000 /intervall;
              } // until here
              return RAW_SENSOR_NAMES
                .filter((name) => Object.keys(reading).includes(name))
                .reduce( (acc, name) => {
                  const data = sample[name] || {average: 0, min: +Infinity, max: -Infinity};
                  return {
                    ...acc,
                    [name]: {
                      min: data.min < reading[name] ?  data.min : reading[name],
                      max: data.max > reading[name] ? data.max : reading[name],
                      average: data.average + (reading[name] * weight ),
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
