const http = require('restify');
const rtl = require('./rtl_client');
const db = require('./redis');
rtl.start();

var restify = require('restify');

var server = restify.createServer();
server.get('/devices', async function(req, res, next) {
  const result = await db.smembers('devices')
  console.log(result);
  res.send(result);
  next();
});
server.get('/device/:name', async function(req, res, next) {
  const name = req.params.name;
  const since = req.path.since || 24*60; // newer than since in minutes
  if(await db.exists(`readings.${name}`)) {
    if(since) {
      const newerThan = new Date(Date.now()-since*60*1000).valueOf(); // timestamp is in millieseconds here
      const data = await db.zrangebyscore(`readings.${name}`, since, '+inf');
      res.send(data);
    }
  } else {
    res.send(404, 'Device Not Known');
  }
  next();
});

server.use(
  function crossOrigin(req,res,next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    return next();
  }
);
server.listen(8080, function() {
  console.log('%s listening at %s', server.name, server.url);
});
