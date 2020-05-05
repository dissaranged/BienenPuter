const redis = require("redis");
const client = redis.createClient();

client.on("error", function(error) {
  console.error(error);
});

const { promisify } = require("util");
const set = promisify(client.set).bind(client);
const get = promisify(client.get).bind(client);
const zadd = promisify(client.zadd).bind(client);
const sadd = promisify(client.sadd).bind(client);
const smembers = promisify(client.smembers).bind(client);
const exists = promisify(client.exists).bind(client);
const zrangebyscore = promisify(client.zrangebyscore).bind(client);
const exec = promisify(client.exec).bind(client);
const db = {
  redis: client,
  storeReading: function(data) {
    console.log('storeing :', data);
    return new Promise( function(resolve, reject) {
      client.multi()
        .zadd(`readings.${data.key}`, new Date(data.time).valueOf(), JSON.stringify(data))
        .sadd('devices', data.key)
        .set(`latest.${data.key}`, JSON.stringify(data))
        .exec(function(err, replies) {
          if(err) {
            reject(err);
            return;
          }
          resolve(replies);  // can this still be failed due to responses?
        });
    });
  },
  zadd, sadd, smembers, exists, zrangebyscore,
};

module.exports = db;
