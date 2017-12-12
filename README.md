# Sensor Pi

Collect temperature and humidity data from a distributed sensor network.

The sensors are Raspberry Pis with custom PCBs. The server doing the collecting
is a TICK stack with a custom server to handle alerts.

## Raspberry Pi Installation

Tested on Raspberian Stretch

```shell
# Clone repo
git clone https://github.com/whmountains/sensorpi.git
cd sprinkler

# copy config files (kapacitor.conf is *not* needed)
sudo cp config-examples/sensorpi_config.toml ~/sensorpi_config.toml
sudo cp config-examples/telegraf.conf /etc/kapacitor/telegraf.conf

# install Node (the Pi's version of Node.JS is terribly out of date)
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.6/install.sh | bash
source ~/.profile # reload the updated $PATH so NVM will be available immediately
nvm install node

# install Yarn
curl -o- -L https://yarnpkg.com/install.sh | bash
source ~/.profile

# install TICK stack
curl -sL https://repos.influxdata.com/influxdb.key | sudo apt-key add -
echo "deb https://repos.influxdata.com/debian stretch stable" | sudo tee /etc/apt/sources.list.d/influxdb.list
sudo apt update
sudo apt install influxdb chronograf telegraf kapacitor -y
sudo systemctl start influxdb
sudo systemctl start chronograf
sudo systemctl start telegraf
sudo systemctl start kapacitor

# Install Node dependencies
cd manager
yarn install

# Install PM2
yarn global add pm2
pm2 startup # follow the prompts

# Start the Node.js server
pm2 start dist/controller.js --watch
pm2 save
```
