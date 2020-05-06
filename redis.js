const redis = require("redis");
const client = redis.createClient();

client.on("error", function(error) {
  console.error(error);
});

const { promisify } = require("util");
const set = promisify(client.set).bind(client);
const keys = promisify(client.keys).bind(client);
const get = promisify(client.get).bind(client);
const mget = promisify(client.mget).bind(client);
const zadd = promisify(client.zadd).bind(client);
const sadd = promisify(client.sadd).bind(client);
const srem = promisify(client.srem).bind(client);
const smembers = promisify(client.smembers).bind(client);
const exists = promisify(client.exists).bind(client);
const zrangebyscore = promisify(client.zrangebyscore).bind(client);
const exec = promisify(client.exec).bind(client);

function batch(chain) {
    return new Promise( function(resolve, reject) {
      chain.exec(function(err, replies) {
        if(err) {
          reject(err);
          return;
        }
        resolve(replies);  // can this still be failed due to responses?
      });
    });
}

const db = {
  redis: client,

  subscribe(device) {
    console.log(`subscribing : ${device}`);
    return sadd('devices', device);
  },

  unsubscribe(device) {
    console.log(`unsubscribing : ${device}`);
    return srem('devices', device);
  },

  async storeReading(data) {
    console.log('storeing :', data);
    const subscribed = await smembers('devices');
    if(subscribed.includes(data.key))
      return batch(
        client.multi()
          .zadd(`readings.${data.key}`, Math.floor(new Date(data.time).valueOf()/1000), JSON.stringify(data))
          .set(`latest.${data.key}`, JSON.stringify(data))
      );
    return set(`latest.${data.key}`, JSON.stringify(data));
  },

  async devices() {
    const devices = await keys('latest.*');
    const subscribed = await smembers('devices');
    const result = await mget.apply(null, devices);
    const data = result
          .filter( item => !!item)
          .map( item => JSON.parse(item))
          .reduce((acc, item) => ({
            ...acc,
            [item.key]: {
              ...item,
              subscribed: subscribed.includes(item.key)
            }}), {});
    return data;
  },

  async getReadings(opts) {
    const {device, since, until} = opts;
    const newerThan = since ? Math.floor(new Date(Date.now()-since*1000).valueOf()/1000) : 0;
    const olderThan = until ? new Date(Date.now()-until*60*1000).valueOf() : '+inf';
    const result = await zrangebyscore(`readings.${device}`, newerThan, olderThan);
    return result.map(item => JSON.parse(item));
  },
  zadd, sadd, smembers, exists, zrangebyscore, batch
};

module.exports = db;
