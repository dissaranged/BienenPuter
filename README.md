

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
