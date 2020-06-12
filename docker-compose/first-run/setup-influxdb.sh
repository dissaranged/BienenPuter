#!/bin/bash
set -e

which jq >/dev/null 2>&1 || ( echo "ERROR: Dependency 'jq' not found! Install it, and then run this script again." ; false )

ORG="honeypi"
BUCKET="honeypi"
USERNAME="honeypi"
PASSWORD="honeypi"

docker-compose exec influxdb influx setup \
               --force \
               --retention 0 \
               --org "$ORG" \
               --bucket "$BUCKET" \
               --username "$USERNAME" \
               --password "$PASSWORD"

TOKEN=$(docker-compose exec influxdb influx config list --json | jq -r .default.token)

echo "InfluxDB configuration created. Use the following settings to connect:"
echo "ORG = \"$ORG\""
echo "BUCKET = \"$BUCKET\""
echo "TOKEN = \"$TOKEN\""

