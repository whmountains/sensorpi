# Sensor Pi

Collect temperature and humidity data from a distributed sensor network.

The sensors are Raspberry Pis with custom PCBs. The server doing the collecting
is a TICK stack with a custom server to handle alerts.

## Raspberry Pi Installation

Tested on Raspberian Stretch.

The first step is to boot to the desktop and do some basic setup. Open the configuration GUI at Pi -> Preferences -> Raspberry Pi Configuration.

* Enable SSH and I2C under the interfaces tab
* Set the correct timezone
* Pick a sensible hostname

You'll also want to connect to a wifi network unless you're using Ethernet. Reboot once you're done.

The rest of the setup can be completed via SSH or the built-in terminal.

```shell
# Update everything
sudo apt update
sudo apt upgrade

# install NTP
sudo apt install ntp

# install the BME280 driver
sudo apt install libi2c-dev i2c-tools wiringpi -y
git clone https://github.com/andreiva/raspberry-pi-bme280.git
cd raspberry-pi-bme280
make
sudo cp bme280 /usr/bin
cd ..

# Clone main repo
git clone https://github.com/whmountains/sensorpi.git
cd sprinkler

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
```

https://www.softwarecollections.org/en/scls/rhscl/devtoolset-7/
https://www.softwarecollections.org/en/scls/rhscl/python27/

```
scl enable devtoolset-7 bash
scl enable python27 bash
```

iptables

```
ACCEPT     all  --  0.0.0.0/0            0.0.0.0/0
ACCEPT     all  --  0.0.0.0/0            0.0.0.0/0           ctstate RELATED,ESTABLISHED
ACCEPT     tcp  --  0.0.0.0/0            0.0.0.0/0           tcp dpt:22
ACCEPT     tcp  --  0.0.0.0/0            0.0.0.0/0           tcp dpt:8888
ACCEPT     tcp  --  0.0.0.0/0            0.0.0.0/0           tcp dpt:8086
ACCEPT     tcp  --  0.0.0.0/0            0.0.0.0/0           tcp dpt:8088
```
