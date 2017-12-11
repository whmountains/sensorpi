# Sensor Pi

Collect temperature and humidity data from a distributed sensor network.

The sensors are Raspberry Pis with custom PCBs. The server doing the collecting
is a TICK stack with a custom server to handle alerts.

## Installation Checklist

Install Docker.

```shell
curl -sSL https://get.docker.com | sh
```

Clone the repository.

```shell
git clone https://github.com/whmountains/sensorpi.git
```

Copy the configuration template files:

```shell
mkdir -p ~/.config/sensorpi
cp -r sensorpi/config-example/* ~/.config/sensorpi
```

Start the server

```shell
cd sensorpi
docker-compose up
```

Try visiting http://server-ip:8888. Did it work? Hit Ctrl-C to shut it down when you're done.

Now you're ready to deploy to a docker swarm. These instructions assume a fresh install of docker. Obviously you don't need to re-init a swarm if you're already part of one.

````shell
docker swarm init
docker stack deploy

## Extra setup steps for Raspberry Pi

## Sensor Node

## First-run Setup

**Make sure the sensor PCB is oriented correctly!**

Tested on a Raspberry Pi 3 running Raspbian Stretch. Internet connection is
required.

Node server runs on port 3000.

```shell
# Set the timezone
sudo raspi-config

# install the NTP client
sudo apt install ntp

# Clone repo
git clone https://github.com/whmountains/sensorpi.git
cd sensorpi/sensor-node

# set up the bme driver
less bme280-driver/Readme.md

# install Node (the Pi's version of Node is terribly out of date)
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.6/install.sh | bash
source ~/.profile # reload the updated $PATH so NVM will be available immediately
nvm install node

# install Yarn
curl -o- -L https://yarnpkg.com/install.sh | bash
source ~/.profile

# Install Node dependencies
cd data-server
yarn install

# Install PM2
yarn global add pm2
pm2 startup # follow the prompts

# Start the Node.js server
pm2 start index.js
pm2 save
````

### Configuration

Edit the configuration file in ~/sensorpi-config.toml. Configuration is automatically reloaded, so there's no need to restart the server.

## GPIO API

/write/port/state

## Server Setup

Edit the list of servers at the end of config/telegraf.conf to list your sensor nodes.

```toml
[[inputs.httpjson]]

servers = [
  "http://your-sensor-node:3000/"
]
```

Start the server with docker-compose:

```shell
$ docker-compose up -d
```

Access the chronograf GUI at localhost:3000.
