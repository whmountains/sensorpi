#!/usr/bin/env bash

# create a network for the containers to communicate on
docker network create --driver bridge sensorpi_net

# start telegraf
docker run -td \
  --network=sensorpi_net \
  --name=sensorpi_telegraf \
  --mount type=bind,source=./config/telegraf.conf,target=/etc/telegraf/telegraf.conf \
  --restart always \
  --publish 8092:8092 \
  --publish 8092:8092/udp \
  --publish 8125:8125/udp \
  telegraf:1.4.0

# start influxdb
docker run -td \
  --network=sensorpi_net \
  --name=sensorpi_influxdb \
  --mount type=volume,source=influxdb-data,target=/var/lib/influxdb \
  --restart always \
  --publish 8086:8086 \
  influxdb:1.3.5

# start chronograf
docker run -td \
  --network=sensorpi_net \
  --name=sensorpi_chronograf \
  --mount type=volume,source=chronograf-data,target=/var/lib/chronograf \
  --restart always \
  --publish 8888:8888 \
  chronograf:1.3.8 \
  --influxdb-url=http://influxdb:8086 \
  --kapacitor-url=http://kapacitor:9092

# start kapacitor
docker run -td \
  --network=sensorpi_net \
  --name=sensorpi_kapacitor \
  --mount type=volume,source=kapacitor-data,target=/var/lib/kapacitor \
  --mount type=bind,source=./config/kapacitor.conf,target=/etc/telegraf/kapacitor.conf \
  --restart always \
  --publish 8086:8086 \
  --publish 9092:9092 \
  kapacitor:1.3.3

# start influxdb
docker run -td \
  --network=sensorpi_net \
  --name=sensorpi_influxdb \
  --mount type=bind,source=~/device_config.toml,target=/sensorpi/config/device_config.toml \
  --restart always \
  --publish 80:3000 \
  sensorpi-manager:latest