

## DB management scripts

- `script/reset-db` clears the entire database (removes all keys, after asking for confirmation)
- `script/load-fixture` takes the path to a JSON file as an argument, and loads all readings from there

## Fixtures

To generate fixtures, run:
```
node fixtures/generate.js name-of-device > fixtures/name-of-device.json
```

Then load them with
```
script/load-fixture fixtures/name-of-device.json
```

Parameters for those fixtures are hardcoded in fixtures/generate.js.


## InfluxDB

  To use:
    cd docker-compose/
    docker-compose up -d
    # wait a few seconds for it to come up, then:
    ./first-run/setup-influxdb.sh
    # Make sure to copy the TOKEN somewhere!!!

* Configuration is expected to be in config/influx.js. Copy the
  example from config/influx.js.example, then add the TOKEN from
  before.

* Measurements are not stored directly into InfluxDB right now (though
  there is nothing stopping us from implementing that).
  For now there's a script though, which will copy all readings from
  redis to influxdb:
    node redis-to-influx.js
