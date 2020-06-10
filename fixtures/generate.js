const key = process.argv[2];
if (!key) {
  console.log(`Usage: ${process.argv.slice(0, 2).join(' ')} <key>`);
  process.exit(1);
}

const N_SAMPLES = 10000;
const TIME_STEP = 60000;
const START_TIME = new Date().getTime() - TIME_STEP * N_SAMPLES;

// More or less periodic, but pseudo-random data, with a few out-of-place spikes
const f = x => (25 + (0.1*Math.sin(x) + 2*Math.sin(x/10) + 0.3*Math.cos(x/3) + 0.4*Math.tan(x*8))) % 60;

const samples = [];

for (let t = 0; t < N_SAMPLES; t++) {
  samples.push({
    time: new Date(START_TIME + t * TIME_STEP).toISOString(),
    model: 'Fake Model',
    temperature_C: f(t),
    key,
  });
}

console.log(JSON.stringify(samples, null, 2));
