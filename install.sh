#!/usr/bin/env bash

# Update everything
sudo apt update
sudo apt upgrade
sudo apt update

# install dependencies
sudo apt install libi2c-dev i2c-tools wiringpi ntp git build-essential libssl-dev -y

# install the bme280 driver
git clone https://github.com/whmountains/raspberry-pi-bme280
cd raspberry-pi-bme280
make
sudo cp bme280 /usr/bin
cd ..

# Clone main repo
git clone https://github.com/whmountains/sensorpi.git
cd sensorpi

# install TICK stack (but don't start it yet)
curl -sL https://repos.influxdata.com/influxdb.key | sudo apt-key add -
echo "deb https://repos.influxdata.com/debian stretch stable" | sudo tee /etc/apt/sources.list.d/influxdb.list
sudo apt update
sudo apt install influxdb chronograf telegraf kapacitor -y

# copy config files (kapacitor.conf is *not* needed)
cp config-examples/sensorpi_config.toml ~/sensorpi_config.toml
sudo cp config-examples/telegraf.conf /etc/telegraf/telegraf.conf

# give the 'pi' user permission to write to the socket
sudo usermod -a -G telegraf pi

# start the TICK stack
sudo systemctl start influxdb
sudo systemctl start chronograf
sudo systemctl start telegraf
sudo systemctl start kapacitor

# install Node (the Pi's version of Node.JS is terribly out of date)
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.6/install.sh | bash
source ~/.profile # reload the updated $PATH so NVM will be available immediately
nvm install node

# install Yarn
curl -o- -L https://yarnpkg.com/install.sh | bash
source ~/.profile

# Install Node dependencies
cd manager
yarn install

# build the web ui
yarn build

# Install PM2
yarn global add pm2
pm2 startup # follow the prompts

# Start the Node.js server
pm2 start index.js --name sensorpi --watch
pm2 save
