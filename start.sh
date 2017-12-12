#!/usr/bin/env bash

# destroy the containers
docker stop sensorpi_telegraf
docker stop sensorpi_influxdb
docker stop sensorpi_chronograf
docker stop sensorpi_kapacitor
docker stop sensorpi_manager

# create a network for the containers to communicate on
docker network create --driver bridge sensorpi_net

# start telegraf
docker run -td \
  --network=sensorpi_net \
  --mount type=bind,source=`pwd`/config/telegraf.conf,target=/etc/telegraf/telegraf.conf \
  --restart always \
  --publish 8092:8092 \
  --publish 8092:8092/udp \
  --publish 8125:8125/udp \
  telegraf:1.4.0

# start influxdb
docker run -td \
  --network=sensorpi_net \
  --mount type=volume,source=influxdb-data,target=/var/lib/influxdb \
  --restart always \
  --publish 8086:8086 \
  influxdb:1.3.5

# start chronograf
docker run -td \
  --network=sensorpi_net \
  --mount type=volume,source=chronograf-data,target=/var/lib/chronograf \
  --restart always \
  --publish 8888:8888 \
  chronograf:1.3.8 \
  --influxdb-url=http://influxdb:8086 \
  --kapacitor-url=http://kapacitor:9092

# start kapacitor
docker run -td \
  --network=sensorpi_net \
  --mount type=volume,source=kapacitor-data,target=/var/lib/kapacitor \
  --mount type=bind,source=`pwd`/config/kapacitor.conf,target=/etc/telegraf/kapacitor.conf \
  --restart always \
  --publish 8086:8086 \
  --publish 9092:9092 \
  kapacitor:1.3.3

# start influxdb
docker run -td \
  --network=sensorpi_net \
  --mount type=bind,source=$HOME/device_config.toml,target=/sensorpi/config/device_config.toml \
  --restart always \
  --publish 80:3000 \
  sensorpi-manager:latest