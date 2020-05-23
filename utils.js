const utils = {

  isString (value) {
    return (typeof value === 'string' || value instanceof String);
  },

  toName(device, type) {
    const name = escape(device);
    switch(type){
    case '6m':
      return `6m.${name}`;
    case 'readings':
      return `readings.${name}`;
    case 'device':
    case undefined:
      return `device.${name}`;
    default:
      throw new Error(`encountered unknown object type ${type}`);
    }
  },

  toRedisResult (obj) {
    return Object.entries(obj).reduce((acc, [key, value]) => ({
      ...acc,
      [key]: utils.isString(value) ? value : JSON.stringify(value)
    }), {});
  },

  attemptJsonParse(str) {
    try {
      return JSON.parse(str);
    } catch(e) {
      if(e instanceof SyntaxError)
        return str;
      throw e;
    }
  },

  fromRedisResult (obj) {
    return Object.entries(obj).reduce((acc, [key, value]) => ({
      ...acc,
      [key]: utils.attemptJsonParse(value)
    }), {});
  },
  RAW_SENSOR_NAMES: ['temperature_C', 'temperature_F', 'humidity']
};

module.exports = utils;
