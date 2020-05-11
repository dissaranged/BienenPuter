const redis = require('redis');
const { promisify } = require('util');

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
    subscribe (device) {
        console.log(`subscribing : ${device}`);
        return client.sadd('devices', device);
    },

    unsubscribe (device) {
        console.log(`unsubscribing : ${device}`);
        return client.srem('devices', device);
    },

    async storeReading (data) {
        console.log('storeing :', data);
        const subscribed = await client.hget(`device.${data.key}`, 'subscribed');
        if (subscribed === 'true') {
            return batch(
                client.multi()
                    .zadd(`readings.${data.key}`, Math.floor(new Date(data.time).valueOf() / 1000), JSON.stringify(data))
                    .hset(`device.${data.key}`, 'latest', JSON.stringify(data))
            );
        }
        return client.hset(`device.${data.key}`, 'latest', JSON.stringify(data));
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
            [devices[index].slice(7)]: data
        }), {});
    },

    async getReadings (opts) {
        const { device, since, until } = opts;
        const newerThan = since ? Math.floor(new Date(Date.now() - since * 1000).valueOf() / 1000) : 0;
        const olderThan = until ? new Date(Date.now() - until * 60 * 1000).valueOf() : '+inf';
        const result = await client.zrangebyscore(`readings.${device}`, newerThan, olderThan);
        return result.map(item => JSON.parse(item));
    },
    batch,
    hsetObject
};

module.exports = db;
