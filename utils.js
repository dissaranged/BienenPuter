const utils = {

  isString (value) {
    return (typeof value === 'string' || value instanceof String);
  },

  toName(device, type) {
    const name = escape(device);
    switch(type){
    case 'reading':
      return `reading.${name}`;
    case 'device':
    default:
      return `device.${name}`;
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

};

module.exports = utils;
