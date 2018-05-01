const execa = require('execa')
const Queue = require('promise-queue')
const BME280 = require('bme280-sensor')

const bme280 = new BME280()

const initialization = bme280.init().catch((e) => {
  console.error('Error initializing BME280 sensor!', e)
  process.exit(1)
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

const queue = new Queue(1, Infinity)

// get a raw, uncalibrated reading
async function getReading() {
  return queue.add(async () => {
    await initialization

    const sensorData = await bme280.readSensorData()
    return {
      temperature: sensorData.temperature_C,
      humidity: sensorData.humidity,
      pressure: sensorData.pressure_hPa,
    }
  })
}

module.exports = { getCalibratedReading, getReading }
