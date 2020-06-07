const udp = require('dgram');
const db = require('./redis');

const server = udp.createSocket('udp4');

function tryParsePayload(payload) {
  let string = payload.reduce((s, byte) => s + String.fromCharCode(byte), '');
  try {
    return JSON.parse(string);
  } catch(e) {
    return null;
  }
}

function preprocess(data) {
  data.key = createId(data);
  if (data.payload && Array.isArray(data.payload)) {
    let parsed = tryParsePayload(data.payload);
    if (parsed) {
      Object.assign(data, parsed);
    }
  }
}

function start (host = '127.0.0.1', port = 1433) {
  server.bind(port, host);

  server.on('error', function (error) {
    console.log('Error: ' + error);
    server.close();
  });

  server.on('message', async function (msg, info) {
    const raw = msg.toString();
    try {
      const data = JSON.parse(raw.split(' ').slice(7).join());
      preprocess(data);
      await db.storeReading(data);
    } catch (error) {
      console.error('Handling Event failed with', error);
      console.error('Data received from client : ' + msg.toString());
      console.error('Received %d bytes from %s:%d\n', msg.length, info.address, info.port);
    }
  });

  server.on('listening', function () {
    var address = server.address();
    var port = address.port;
    var family = address.family;
    var ipaddr = address.address;
    console.log(`RTL_433 client ist listening at ${family} ${ipaddr}:${port}`);
  });

  server.on('close', function () {
    console.log('Socket is closed !');
  });
}

const client = {
  server,
  start
};

function createId (data) {
  let ret = '';
  if (data.model) { ret += data.model; }
  if (data.id) { ret += ':' + data.id; }
  if (data.channel) { ret += '@' + data.channel; }
  return ret;
}

module.exports = client;
