# Sensor Pi

Collect temperature and humidity data from a distributed sensor network.

The sensors are Raspberry Pis with custom PCBs. The server doing the collecting
is a TICK stack with a custom server to handle alerts.

## Manager Installation

Install Docker.

```shell
curl -sSL https://get.docker.com | sh
sudo usermod -aG docker pi
```

Create a new docker swarm if setting up the server

```shell
docker swarm init
```

Clone the repository and run the setup script

```shell
git clone https://github.com/whmountains/sensorpi.git
cd sensorpi
sudo ./setup.sh
```

Deploy the sensorpi stack:

```shell
docker stack deploy --compose-file docker-stack.yml --prune sensorpido
```

You can watch deploy progress with `docker service ls`.
You can view status of individual nodes with `docker node ps [node-id]`

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
