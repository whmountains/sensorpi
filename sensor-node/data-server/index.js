var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)
const execa = require('execa')
const morgan = require('morgan')
const toml = require('toml')
const fs = require('mz/fs')
const path = require('path')
const resolve = require('resolve-dir')

const port = process.env.PORT || 3000
const configPath = resolve('~/sensorpi-config.toml')
const readInterval = 500

// request logging
app.use(morgan('dev'))

// read the sensor regularly
let lastReading = {}
setInterval(async () => {
  lastReading = await getCalibratedReading()
  io.emit('reading', lastReading)
  console.log(lastReading)
}, readInterval)

// output reading results
app.get('/', (req, res) => {
  res.send(lastReading)
})

// live data streaming with socket.io
app.get('/live', function(req, res) {
  res.sendFile(__dirname + '/index.html')
})

// boot the server
http.listen(port, function() {
  console.log('listening on *:' + port)
})

// get a calibrated sensor reading
async function getCalibratedReading() {
  const [config, reading] = await Promise.all([getConfig(), getReading()])
  lastReading = {
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
