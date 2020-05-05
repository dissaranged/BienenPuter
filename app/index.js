function drawChart(datasets, labels) {
  var ctx = document.getElementById('myChart').getContext('2d');
  var myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets,
    },
    options: {
      responsive: true,
      scales: {
	x: {
	  display: true,
	  scaleLabel: {
	    display: true,
	    labelString: 'time'
	  }
	},
	t: {
	  display: true,
	  scaleLabel: {
	    display: true,
	    labelString: 'Value',
	  }
	}
      }
    }
  });
}

const BASE = 'http://localhost:8080'

async function getDevices() {
  const response = await fetch(`${BASE}/devices`);
  const data = await response.json();
  const deviceList = document.querySelector('#deviceList .devices');
  data.forEach( name => {
    const el = document.querySelector('#templates .deviceEntry').cloneNode(true);
    el.querySelector('.deviceName').textContent = name;
    deviceList.appendChild(el);
  });
  return data;
}

async function getReadings(device) {
  const response = await fetch(`${BASE}/device/${device}`);
  const data = await response.json();
  return data;
}

window.onload = async function() {
  const devices = await getDevices();

  const datasets = await Promise.all(devices.map( async device => {
    const data = await getReadings(device);
    return  {
      label: device,
      data: data.reduce((acc, reading, index) => [...acc, {
        y: reading.temperature_C,
        x: new Date(reading.time)
      }], []),
    };
  }));
  console.log(datasets)
  drawChart(datasets, [1,2,3,4,5,6,7,8], );
  
};
