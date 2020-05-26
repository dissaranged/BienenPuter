const chai = require('chai');
const { expect } = chai;
const chaiHttp = require('chai-http');
const db = require('../redis');

chai.use(chaiHttp);
let redis;
before(async () => {
  // setup db
  redis = db.setup({ db: 1 });
  const keys = await redis.keys('*');
  if (keys.length > 0) {
    console.log('Found following keys in DB');
    console.log(keys);
    console.log('flushdb?');
    throw new Error('test DB not empty');
    // have some interactive thingy here to flushdb
  }
});
after((done) => redis.quit(done));

afterEach(async () => {
  await redis.flushdb();
});
