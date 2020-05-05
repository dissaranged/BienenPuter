
const BASE = 'http://localhost:8080'

async function getDevices() {
  const response = await fetch(`${BASE}/devices`);
  const data = await response.json();
  return data;
}

async function getReadings(device) {
  const response = await fetch(`${BASE}/device/${device}`);
  const data = await response.json();
  return data;
}

function renderDeviceManager(devices) {
  const container = document.querySelector('#deviceManager ul');
  const template = document.querySelector('#deviceEntryTemplate').innerHTML;
  const rendered = Object.values(devices).map(view =>   Mustache.render(template, view) ).join('\n');
  container.innerHTML = rendered;
  
}

function handleSubscribtion(device, unsubscribe) {
  if(unsubscribe)
    return fetch(`${BASE}/unsubscribe/${device}`, {method: 'PUT'});
  return fetch(`${BASE}/subscribe/${device}`, {method: 'PUT'});
  
}

window.onload = async function() {
  const devices = await getDevices();
  renderDeviceManager(devices);
  // const datasets = await Promise.all(devices.map( async device => {
  //   const data = await getReadings(device);
  //   return  {
  //     label: device,
  //     data: data.reduce((acc, reading, index) => [...acc, {
  //       y: reading.temperature_C,
  //       x: new Date(reading.time)
  //     }], []),
  //   };
  // }));
  // drawChart(datasets, [1,2,3,4,5,6,7,8], );
  
};
