let Devices;

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

function renderDeviceManager () {
  const handlers = {
    handleSubscribe: (view) => () => handleSubscribtion(view.key, !view.subscribed),
    saveOpts: (view) => (a,b,c) => {  
      a.preventDefault();
      handleSaveOpts(view.key, a,b,c);
    },
  };
  const container = document.querySelector('#deviceManager ul');
  const template = document.querySelector('#deviceEntryTemplate').innerHTML;
  const rendered = Object.values(Devices)
    .sort(({ latest: {time: a} }, { latest: {time: b} }) => new Date(b) - new Date(a))
    .map( view => {
      const el = document.createElement('div');
      el.innerHTML = Mustache.render(template, {
        ...view, 
        age: moment(new Date(view.latest.time)).fromNow(),
        JSON: JSON.stringify(view, null, 2),
      });
      el.querySelectorAll('[listen]').forEach( 
        node => {
          node.getAttribute('listen').split(',').forEach( item => {
            const [event, handler] = item.split('=>');
            node.addEventListener(event, handlers[handler](view)); // this needs error handling
          });
        });
      return el;
    });
  container.innerHTML = "";
  rendered.forEach(container.appendChild.bind(container));
}

async function handleSaveOpts(device, a,b,c) {
  a.preventDefault();
  console.log(a,b,c)
}
async function handleSubscribtion (device, subscribe) {
  await fetch(`${BASE}/device/${device}?subscribed=${subscribe}`, { method: 'PUT' });
  updateDeviceManager();
}

async function updateDeviceManager () {
  Devices = await getDevices();
  console.log(Devices);
  renderDeviceManager();
}

function FtoC (f) {
  return (f - 32) * 5 / 9;
}

async function main () {
  await updateDeviceManager();
  // const datasets = await createChart();
  // let lastInvocation = new Date();
  // setInterval(() => {
  //   console.log('intervall', datasets, lastInvocation);
  //   updateChart(datasets, lastInvocation);
  //   lastInvocation = new Date();
  // }, 10 * 1000);
}

window.addEventListener('load', main);
