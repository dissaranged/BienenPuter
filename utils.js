
function isString (value) {
    return (typeof value === 'string' || value instanceof String);
}

function toRedisResult (obj) {
    return Object.entries(obj).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: isString(value) ? value : JSON.stringify(value)
    }), {});
}

module.exports = {
    isString, toRedisResult
};
