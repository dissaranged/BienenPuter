var udp = require('dgram');

function createId(data) {
  // maybe this is not unique, could use moddel too
  let ret = '';
  if(data.model)
    ret += data.model;
  if(data.id)
    ret += ':'+ data.id;
  if(data.channel)
    ret += '@'+ data.channel;
}

let db = {};
function store(data) {
  const id = createId(data);
  db[id] = [ ...db[id]||[], data];
}

let server = udp.createSocket('udp4');


function start(host = '127.0.0.1', port = 1433) {
  server.bind(port, host);

  server.on('error',function(error){
    console.log('Error: ' + error);
    server.close();
  });

  server.on('message',function(msg,info){
    const raw = msg.toString();
    try {
      let data = JSON.parse(raw.split(' ').slice(7).join());
      store(data);
    } catch(error) {
      console.log('Handling Event failed with', error);
      console.log('Data received from client : ' + msg.toString());
      console.log('Received %d bytes from %s:%d\n',msg.length, info.address, info.port);
      // this is a hack, so that errors will show as device
      store({
        model: 'Error',
        raw, info, error
      });
    }
  });

  server.on('listening',function(){
    var address = server.address();
    var port = address.port;
    var family = address.family;
    var ipaddr = address.address;
    console.log('Server is listening at port' + port);
    console.log('Server ip :' + ipaddr);
    console.log('Server is IP4/IP6 : ' + family);
  });

  server.on('close',function(){
    console.log('Socket is closed !');
  });

}

module.exports = {
  server,
  start,
  db
}
