const express = require('express')
const Server = require('http').Server
const socketio = require('socket.io')
const morgan = require('morgan')
const path = require('path')
const R = require('ramda')
const debug = require('debug')
const math = require('mathjs')

const { getConfig, loadConfig, writeConfig } = require('./config')
const { getReading, getCalibratedReading } = require('./sensor')
const { writePort, writePorts, getOutputRegister } = require('./gpio')
const { telegrafWrite } = require('./telegraf')

// configuration ==============

const port = process.env.PORT || 3000
const readSensorInterval = 1000

// bootstrap ==============

const app = express()
app.use(morgan('dev'))
const http = Server(app)
const io = socketio(http)
const log = debug('sensorpi-manager')

// read the sensor regularly
setInterval(async () => {
  const { config, reading } = await getConfigAndReading()

  // apply setpoints
  applySetpoints(config, reading)

  // output new port state to socket
  io.emit('portState', getOutputRegister())

  // output reading to socket
  io.emit('reading', reading)

  // output reading to telegraf
  telegrafWrite(reading)
}, readSensorInterval)

// socket communication
io.on('connection', async socket => {
  console.log('A client connected!')
  socket.emit('config', await loadConfig())

  socket.on('updateConfig', newConfig => writeConfig(newConfig))

  socket.on('disconnect', () => console.log('A client disconnected.'))
})

// get last reading
app.get('/data', async (req, res) => {
  const { reading } = await getConfigAndReading()
  res.send(reading)
})

// manually change a GPIO
app.get('/write/:port/:value', (req, res) => {
  const value = Number(!!Number(req.params.value))
  const port = req.params.port

  if (![0, 1].includes(value)) {
    return res.status(400).send('Please only write 0 or 1')
  }

  writePort(port, value)

  res.send({
    status: 'success',
    portState: getOutputRegister(),
  })
})

// list current port state
app.get('/port-state', (req, res) => {
  res.send(getOutputRegister())
})

// show the UI
app.use(express.static(path.join(__dirname, 'build')))

// boot the server
http.listen(port, function() {
  console.log('listening on *:' + port)
})

async function getConfigAndReading() {
  // load the config file
  const [config, rawReading] = await Promise.all([getConfig(), getReading()])

  // get a reading
  reading = getCalibratedReading(config, rawReading)

  return { config, reading }
}

// apply setpoints from the config file
function applySetpoints(config, reading) {
  const newPortState = {}

  R.forEach(rule => {
    if (math.eval(rule.condition || 'true', reading)) {
      Object.assign(newPortState, rule.outputs)
    }
  }, config.rules)

  writePorts(newPortState)
}
