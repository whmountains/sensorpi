const net = require('net')

const socketPath = '/home/pi/telegraf_input.sock'

const socket = net.createConnection(socketPath)

const telegrafWrite = reading => {
  const message = JSON.stringify(reading)

  socket.write(message)
}
