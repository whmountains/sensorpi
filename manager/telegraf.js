const dgram = require('dgram')

const telegrafHost = 'telegraf'
const telegrafPort = 8094

const socket = dgram.createSocket('udp4')

const telegrafWrite = reading => {
  const message = JSON.stringify(reading)

  socket.send(message, telegrafPort, telegraf)
}
