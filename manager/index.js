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
const math = require('mathjs')
const debounce = require('debounce')

const port = process.env.PORT || 3000
const configPath = resolve('/sensorpi/config/device_config.toml')
const readInterval = 100

const app = express()
const http = Server(app)
const io = socketio(http)
const log = debug('sensorpi-manager')
const db = new Redis()

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

// string containing the configuration in toml format
const userConfig = null

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

// handle socket events

io.on('connect', socket => {
  log('New socket connection!')

  socket.on('disconnect', 'A client disconnected.')

  socket.on('getConfig', async cb => {
    cb(await loadConfig())
  })

  socket.on('updateConfig', async newConfig => {
    userConfig = newConfig
    saveConfig()
  })
})

// get last reading
app.get('/data', (req, res) => {
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

app.use(express.static(path.join(__dirname, 'build')))

// boot the server
http.listen(port, function() {
  console.log('listening on *:' + port)
})

// get a calibrated sensor reading
function getCalibratedReading(config, reading) {
  return {
    temperature:
      reading.temperature * config.calibration.temperature.coefficient +
      config.calibration.temperature.offset,
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
  const configFile = await loadConfig()

  const config = toml.parse(configFile)

  return R.mergeDeepRight(defaultConfig, config)
}

async function loadConfig() {
  if (userConfig !== null) {
    return userConfig
  }

  try {
    userConfig = await fs.readFile(configPath, {
      encoding: 'utf8',
    })
  } catch (e) {
    log('first run, falling back to default config file')

    userConfig = await fs.readFile(
      path.join(__dirname, 'device_config.example.toml'),
      { encoding: 'utf8' },
    )
  }

  return userConfig
}

const saveConfig = debounce(async () => {
  return await fs.writeFile(configPath, userConfig)
}, 1000)

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
