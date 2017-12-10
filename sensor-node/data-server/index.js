const express = require('express')
const Server = require('http').Server
const socketio = require('socket.io')
const execa = require('execa')
const morgan = require('morgan')
const toml = require('toml')
const fs = require('mz/fs')
const path = require('path')
const resolve = require('resolve-dir')
const { Gpio } = require('onoff')
const R = require('ramda')
const debug = require('debug')
const math = require('math.js')

const port = process.env.PORT || 3000
const configPath = resolve('~/sensorpi-config.toml')
const readInterval = 1000

const app = express()
const http = Server(app)
const io = socketio(http)
const log = debug('sensorpi-node')

const portMap = {
  1: 23,
  2: 24,
  3: 27,
  4: 22,
  5: 18,
  6: 4,
  0: 11,
}

let outputRegister = R.map(R.always(0), portMap)

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
  const [config, rawReading] = await Promise.all([getConfig(), getReading()])

  // get a reading
  lastReading = getCalibratedReading(config, rawReading)

  // apply setpoints
  applySetpoints(config, lastReading)

  // output reading
  io.emit('reading', lastReading)
  log(lastReading)
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
  const value = Number(!!Number(req.params.value))
  const port = req.params.port

  if (![0, 1].includes(value)) {
    return res.status(400).send('Please only write 0 or 1')
  }

  outputRegister[port] = value
  updateOutputs()

  res.send({
    status: 'success',
    portState: outputRegister,
  })
})

// list current port state
app.get('/port-state', (req, res) => {
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
      reading.temperature * config.calibration.temperature.coefficient +
      config.calibration.tempreature.offset,
    humidity:
      reading.humidity * config.calibration.humidity.coefficient +
      config.calibration.humidity.offset,
    pressure:
      reading.pressure * config.calibration.pressure.coefficient +
      config.calibration.pressure.offset,
  }
}

// get a raw, uncalibrated reading
async function getReading() {
  const result = await execa('bme280')
  return JSON.parse(result.stdout)
}

const defaultConfig = {
  calibration: {
    temperature: {
      coefficient: 1,
      offset: 0,
    },
    humidity: {
      coefficient: 1,
      offset: 0,
    },
    pressure: {
      coefficient: 1,
      offset: 0,
    },
  },
  rules: [],
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
  R.forEach(rule => {
    if (math.eval(rule.condition || 'true', reading)) {
      Object.assign(outputRegister, rule.outputs)
    }
  }, config.rules)

  updateOutputs()
}

// update the outputs
function updateOutputs() {
  R.forEachObjIndexed((state, port) => {
    log(`writing ${state} to ${port}`)
    ports[port].writeSync(state)
  }, outputRegister)
}
