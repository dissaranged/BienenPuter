import qs from 'qs';
const BASE = 'http://localhost:8080';

async function saveFetch(path, options) {
  const response = await fetch(path, options);
  if(response.status >= 400) {
      const error = new Error(`${options.method || 'GET'} => [${response.status}] ${response.statusText}`);
      error.name = 'Request failed';
      error.status = response.status;
      const contentType = response.headers.get('content-type');
      const isJSON = contentType && contentType.match(/^application\/json$/);
      error.body = await (isJSON ? response.json() : response.text());
      throw error;
  }
  return response;
}

export async function getDevices () {
  const response = await saveFetch(`${BASE}/devices`);
  const data = await response.json();
  return data;
}

export async function getReadings (device, options) {
  const response = await fetch(`${BASE}/device/${device}?${qs.stringify(options)}`);
  if (response.status === 404) { return []; }
  if(response.status >= 400) throw new Error();
  const data = await response.json();
  return data;
}

export async function setDeviceOptions (device, options) {
  await saveFetch(`${BASE}/device/${device}?${qs.stringify(options)}`, { method: 'PUT' });
}
