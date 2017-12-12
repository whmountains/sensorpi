# Sensor Pi

Collect temperature and humidity data from a distributed sensor network.

The sensors are Raspberry Pis with custom PCBs. The server doing the collecting
is a TICK stack with a custom server to handle alerts.

## Installagion

Install Docker and docker-compose

```shell
curl -sSL https://get.docker.com | sh
sudo usermod -aG docker pi
sudo pip install docker-compose
```

Clone the repository

```shell
git clone https://github.com/whmountains/sensorpi.git
cd sensorpi
```

Start the stack

```shell
docker-compose up -d
```

You're done!

## Sensor Node Installation

Start by plugging the sensor PCB into the Pi. **Make sure it's oriented correctly!**

Install Docker.

```shell
curl -sSL https://get.docker.com | sh
sudo usermod -aG docker pi
```

Join the swarm, using the tokens you got when setting up the manager

One last step: make sure the time is correct.

```shell
# Set the timezone and enable i2c
sudo raspi-config

# install the NTP client
sudo apt install ntp
```

### Configuration

Create a file named `sensorpi-config.toml` in the home directory. You'll find an example in the repo.
