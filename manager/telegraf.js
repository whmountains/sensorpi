const dgram = require('dgram')
const throttle = require('lodash.throttle')

const telegrafHost = 'localhost'
const telegrafPort = 8094

const socket = dgram.createSocket('udp4')

const telegrafWrite = throttle(reading => {
  const message = JSON.stringify(reading)

  socket.send(message, telegrafPort, telegrafHost)
}, 5000)

module.exports = { telegrafWrite }
