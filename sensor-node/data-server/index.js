var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)
const execa = require('execa')
const morgan = require('morgan')
const toml = require('toml')
const fs = require('mz/fs')
const path = require('path')
const resolve = require('resolve-dir')
const { Gpio } = require('onoff')
const isNumber = require('is-number')
const R = require('ramda')

const port = process.env.PORT || 3000
const configPath = resolve('~/sensorpi-config.toml')
const readInterval = 1000

const portMap = {
  1: 23,
  2: 24,
  3: 27,
  4: 22,
  5: 18,
  6: 4,
  vcc: 11,
}

let outputRegister = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
  6: 0,
  vcc: 1,
}

const ports = R.mapObjIndexed((pin, port) => {
  const mode = outputRegister[port] ? 'high' : 'low'

  return new Gpio(pin, mode)
}, portMap)

// request logging
app.use(morgan('dev'))

// read the sensor regularly
let lastReading = {}
setInterval(async () => {
  // load the config file
  const [config, rawReading] = Promise.all([getConfig(), getReading()])

  // get a reading
  lastReading = getCalibratedReading(config, rawReading)

  // apply setpoints
  applySetpoints(config, lastReading)

  // output reading
  io.emit('reading', lastReading)
  console.log(lastReading)
}, readInterval)

// get last reading
app.get('/', (req, res) => {
  res.send(lastReading)
})

// live data streaming with socket.io
app.get('/live', function(req, res) {
  res.sendFile(__dirname + '/index.html')
})

// manually change a GPIO
app.get('/write/:port/:value', (req, res) => {
  const value = Number(req.params.value)
  let port = req.params.port

  // cast port to number
  if (isNumber(port)) {
    port = Number(port)
  }

  if (![0, 1].contains(value)) {
    return res.status(400).send('Please write to port 0 or 1')
  }

  ports[port].writeSync(value)
})

// list current port state
apap.get('/portState', (req, res) => {
  res.send(outputRegister)
})

// boot the server
http.listen(port, function() {
  console.log('listening on *:' + port)
})

// get a calibrated sensor reading
function getCalibratedReading(config, reading) {
  return {
    temperature:
      reading.temperature * config.temp_coefficient + config.temp_offset,
    humidity:
      reading.humidity * config.humidity_coefficient + config.humidity_offset,
    pressure:
      reading.pressure * config.pressure_coefficient + config.pressure_offset,
  }
}

// get a raw, uncalibrated reading
async function getReading() {
  const result = await execa('bme280')
  return JSON.parse(result.stdout)
}

const defaultConfig = {
  temp_coefficient: 1,
  temp_offset: 0,
  humidity_coefficient: 1,
  humidity_offset: 0,
  pressure_coefficient: 1,
  pressure_offset: 0,
  events: [],
}

// read and parse the config file
async function getConfig() {
  const data = await fs.readFile(configPath, {
    encoding: 'utf8',
  })

  const config = toml.parse(data)

  return {
    ...defaultConfig,
    ...config,
  }
}

// apply setpoints from the config file
function applySetpoints(config, reading) {
  outputRegister = config.events.reduce((register, event) => {
    let newPortState = !!event.state

    if (event.greaterEqual && reading[event.metric] < event.value) {
      newPortState = !newPortState
    }

    if (event.lessEqual && reading[event.metric] < event.value) {
      newPortState = !newPortState
    }

    register[event.port] = Number(newPortState)
  }, outputRegister)

  updateOutputs()
}

// update the outputs
function updateOutputs() {
  outputRegister.forEach((state, port) => {
    ports[port].writeSync(state)
  })
}
