let udp = require('dgram');
let fs = require('fs');
let db = require('./redis');

let server = udp.createSocket('udp4');

function start(host = '127.0.0.1', port = 1433) {
  server.bind(port, host);

  server.on('error',function(error){
    console.log('Error: ' + error);
    server.close();
  });

  server.on('message',async function(msg,info){
    const raw = msg.toString();
    try {
      let data = JSON.parse(raw.split(' ').slice(7).join());
      data.key = createId(data);
      await db.storeReading(data);
    } catch(error) {
      console.error('Handling Event failed with', error);
      console.error('Data received from client : ' + msg.toString());
      console.error('Received %d bytes from %s:%d\n',msg.length, info.address, info.port);
    }
  });

  server.on('listening',function(){
    var address = server.address();
    var port = address.port;
    var family = address.family;
    var ipaddr = address.address;
    console.log(`RTL_433 client ist listening at ${family} ${ipaddr}:${port}`);
  });

  server.on('close',function(){
    console.log('Socket is closed !');
  });

}

const client = {
  server,
  start,
};

function createId(data) {
  let ret = '';
  if(data.model)
    ret += data.model;
  if(data.id)
    ret += ':'+ data.id;
  if(data.channel)
    ret += '@'+ data.channel;
  return ret;
}

// fs.open('./db.json', 'r', (error, file) => {
//   try {
//     if(error){
//       throw error;
//     }
//     client.db = JSON.parse(fs.readFileSync(file));
//   } catch(e) {
//     console.error(e);
//   }
// });  

// function store(data) {
//   const id = createId(data);
//   db[id] = [ ...db[id]||[], data];
//   fs.open('./db.json', 'w', (error, file) => {
//   try {
//     if(error){
//       throw error;
//     }
//     fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
//   } catch(e) {
//     console.error(e);
//   }

//   });  

// }

module.exports = client;
