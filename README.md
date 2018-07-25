# Sensor Pi

Collect temperature and humidity data from a distributed sensor network.

The sensors are Raspberry Pis with custom PCBs. The server doing the collecting
is a TICK stack with a custom server to handle alerts.

## Raspberry Pi Installation

Tested on Raspberian Stretch.

The first step is to boot with a display and do some basic setup. Run `raspi-config`.

* Enable SSH and I2C under the interfaces tab
* Set the correct timezone
* Pick a sensible hostname
* (optional) connect to wifi

Exit raspi-config and reboot.

Now run the setup script

```shell
curl -o- -L https://raw.githubusercontent.com/whmountains/sensorpi/master/install.sh | bash
```

You're not done yet!

* Create a new InfluxDB user on the server.
* Customize your telegraf.conf to send data to the server.
* Give a unique password to the Raspberry Pi
* (optional) Enable passwordless SSH login with your ssh key.
* register with papertrail
* connect to the vpn
  * install openvpn
  * generate certificate
  * generate configuration
  * copy configuration
  * start and enable openvpn service

## Scratchpad

The rest of the setup can be completed via SSH or the built-in terminal.

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

## Daily Email Report

0 18 \* \* \* /usr/bin/node /home/sensorpi/sensorpi/manager/emailSummary.js >> /home/sensorpi/email.log 2>&1

## Tricks for installing on CentOS 6

Install developer toolset 7: https://www.softwarecollections.org/en/scls/rhscl/devtoolset-7/

Add `scl enable devtoolset-7 bash` to `~/.bash_profile`

Install node-gyp `yarn global add node-gyp` if it's not already there.

Run `yarn install` in the project. (It will encounter a build error.)

Cd to the offending node_module dir. Run `node-gyp build`.
