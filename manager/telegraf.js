const net = require('net')

const socketPath = '/tmp/telegraf.sock'

const socket = net.createConnection(socketPath)

const telegrafWrite = reading => {
  const message = JSON.stringify(reading)

  socket.write(message)
}
