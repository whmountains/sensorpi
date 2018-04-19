#!/usr/bin/env bash

# Update everything
echo "Updating Packages"
sudo apt update
sudo apt upgrade -y
sudo apt update

# install dependencies
echo "Installing dependencies"
sudo apt install libi2c-dev i2c-tools wiringpi ntp git build-essential libssl-dev libcairo2-dev libjpeg-dev libpango1.0-dev libgif-dev -y

# install the bme280 driver
echo "Compiling BME280 reader"
git clone https://github.com/whmountains/raspberry-pi-bme280
cd raspberry-pi-bme280
make
sudo cp bme280 /usr/bin
cd ..

# Clone main repo
echo "Cloning sensorpi"
git clone https://github.com/whmountains/sensorpi.git
cd sensorpi

# install TICK stack (but don't start it yet)
echo "Installing TICK stack"
curl -sL https://repos.influxdata.com/influxdb.key | sudo apt-key add -
echo "deb https://repos.influxdata.com/debian stretch stable" | sudo tee /etc/apt/sources.list.d/influxdb.list
sudo apt update
sudo apt install influxdb chronograf telegraf kapacitor -y
sudo usermod -a -G telegraf pi

# copy config files (kapacitor.conf is *not* needed)
echo "Copying config files"
cp config-examples/sensorpi_config.toml ~/sensorpi_config.toml
sudo cp config-examples/telegraf.conf /etc/telegraf/telegraf.conf


# start the TICK stack
echo "Starting TICK services"
sudo systemctl start influxdb
sudo systemctl start chronograf
sudo systemctl start telegraf
sudo systemctl start kapacitor

# install NVM (the Pi's version of Node.JS is terribly out of date)
echo "Installing NVM"
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.6/install.sh | bash
export NVM_DIR="$HOME/.nvm"
source $HOME/.nvm/nvm.sh;
source ~/.profile
source ~/.bashrc  # This loads nvm

# Install Node.js
echo "Installing Node.js"
nvm install node

# install Yarn
echo "Installing Yarn"
curl -o- -L https://yarnpkg.com/install.sh | bash
source ~/.profile

# Install Node dependencies
echo "Installing NPM dependencies"
cd manager
yarn install

# Install PM2
echo "Installing PM2"
yarn global add pm2
pm2 startup systemd -u pi --hp /home/pi

# Start the Node.js server
echo "Starting manager server"
pm2 start index.js --name sensorpi --watch
pm2 save

echo "#############################"
echo "#         All Done!         #"
echo "#############################"
