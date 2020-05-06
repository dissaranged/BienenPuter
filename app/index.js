
const BASE = 'http://localhost:8080'
let subscribed = [];

async function getDevices() {
  const response = await fetch(`${BASE}/devices`);
  const data = await response.json();
  return data;
}

async function getReadings(device) {
  const response = await fetch(`${BASE}/device/${device}`);
  if(response.status === 404)
    return [];
  const data = await response.json();
  return data;
}

function renderDeviceManager(devices) {
  const container = document.querySelector('#deviceManager ul');
  const template = document.querySelector('#deviceEntryTemplate').innerHTML;
  const rendered = Object.values(devices).map(view =>   Mustache.render(template, {...view, age: moment(new Date(view.time)).fromNow()}) ).join('\n');
  container.innerHTML = rendered;

}

async function handleSubscribtion(device, unsubscribe) {
  if(unsubscribe)
    await fetch(`${BASE}/unsubscribe/${device}`, {method: 'PUT'});
  else
    await fetch(`${BASE}/subscribe/${device}`, {method: 'PUT'});
  updateDeviceManager();

}
async function updateDeviceManager() {
  const devices = await getDevices();
  console.log(devices)
  renderDeviceManager(devices);
  subscribed = Object.values(devices).filter( item => !!item.subscribed).map( item => item.key);
};

function FtoC(f) {
  return (f- 32) * 5/9;
}

async function updateChart() {
  const data = await Promise.all(subscribed.map( key => getReadings(key) ));
  console.log(data);
  const container = document.getElementById('chart');
  var items = data.reduce((acc, device) => [
    ...acc, ...device.map( ({time, temperature_C:temp, temperature_F, key}) => ({x: new Date(time), y: temp || FtoC(temperature_F), group: key}))
  ], []);
  var dataset = new vis.DataSet(items);
  var graph2d = new vis.Graph2d(container, dataset);
}

async function main() {
  await updateDeviceManager();
  await updateChart();
}

window.onload = main
