
const BASE = 'http://localhost:8080';
let subscribed = [];

async function getDevices () {
  const response = await fetch(`${BASE}/devices`);
  const data = await response.json();
  return data;
}

async function getReadings (device, opts) {
  const response = await fetch(`${BASE}/device/${device}?${opts && opts.since ? `since=${opts.since}&` : ''}`);
  if (response.status === 404) { return []; }
  const data = await response.json();
  return data;
}

function renderDeviceManager (devices) {
  const container = document.querySelector('#deviceManager ul');
  const template = document.querySelector('#deviceEntryTemplate').innerHTML;
  const rendered = Object.values(devices)
    .sort(({ time: a }, { time: b }) => new Date(b) - new Date(a))
    .map(view => Mustache.render(template, {
      ...view, age: moment(new Date(view.time)).fromNow()
    })).join('\n');
  container.innerHTML = rendered;
}

async function handleSubscribtion (device, unsubscribe) {
  if (unsubscribe) { await fetch(`${BASE}/unsubscribe/${device}`, { method: 'PUT' }); } else { await fetch(`${BASE}/subscribe/${device}`, { method: 'PUT' }); }
  updateDeviceManager();
}
async function updateDeviceManager () {
  const devices = await getDevices();
  console.log(devices);
  renderDeviceManager(devices);
  subscribed = Object.values(devices).filter(item => !!item.subscribed).map(item => item.key);
}

function FtoC (f) {
  return (f - 32) * 5 / 9;
}
let tempGraph, humidGraph;

async function createChart () {
  const data = await Promise.all(subscribed.map(key => getReadings(key)));
  console.log(data);
  const items = { temps: [], humids: [], groups: [] };
  const colors = ['red', 'green', 'blue', 'yellow', 'orange', 'violet']; // should be configurable
  data.forEach((device) => {
    if (device.length > 0) {
      const color = colors.pop();
      items.groups.push({
        id: device[0].key,
        content: device[0].key,
        style: `stroke:${color};fill:${color}`,
        options: {
          drawPoints: { styles: `stroke:${color};fill:${color}` }
        }
      });
    }
    device.forEach(({ time, temperature_C, temperature_F, humidity, key }, index) => {
      const item = { x: new Date(time), group: key };
      const temp = temperature_C || (temperature_F ? FtoC(temperature_F) : null);
      if (!temp && !humidity) {
        console.log(`Bad Reading for ${key}: `, device[index]);
        return;
      }
      if (temp) { items.temps.push({ ...item, y: temp }); }
      if (humidity) { items.humids.push({ ...item, y: humidity }); }
    });
  });
  const temps = new vis.DataSet(items.temps);
  const groups = new vis.DataSet(items.groups);
  const opts = {
    defaultGroup: 'ungrouped',
    legend: true,
    drawPoints: {
      style: 'circle', // square, circle
      size: 3
    },
    dataAxis: {
      showMinorLabels: true
    }
  };
  tempGraph = new vis.Graph2d(document.getElementById('tempChart'), temps, groups, opts);
  tempGraph.setOptions({ dataAxis: { left: { title: { text: 'Temperature in °C)' } } } });
  const humids = new vis.DataSet(items.humids);
  humidGraph = new vis.Graph2d(document.getElementById('humidChart'), humids, groups, opts);
  humidGraph.setOptions({ dataAxis: { left: { title: { text: 'Humidity in %)' } } } });
  return { temps, humids, groups };
}

async function updateChart (datasets, time) {
  const since = Math.ceil((new Date() - time) / 1000) + 1;
  await Promise.all(subscribed.map(
    device => getReadings(device, { since })
      .then(data =>
        data.forEach(({ time, temperature_C, temperature_F, humidity, key }, index) => {
          console.log('New Sample arrived', time, key);
          const item = { x: new Date(time), group: key };
          const temp = temperature_C || (temperature_F ? FtoC(temperature_F) : null);
          if (!temp && !humidity) {
            console.log(`Bad Reading for ${key}: `, device[index]);
            return;
          }
          if (temp) { datasets.temps.add({ ...item, y: temp }); }
          if (humidity) { datasets.humids.add({ ...item, y: humidity }); }
        })
      )
  ));
  console.log('intervall done');
  tempGraph.setWindow(null, moment().add(15, 'seconds'));
  humidGraph.setWindow(null, moment().add(15, 'seconds'));
}

async function main () {
  // await updateDeviceManager();
  // const datasets = await createChart();
  // let lastInvocation = new Date();
  // setInterval(() => {
  //   console.log('intervall', datasets, lastInvocation);
  //   updateChart(datasets, lastInvocation);
  //   lastInvocation = new Date();
  // }, 10 * 1000);
}

window.onload = main;
