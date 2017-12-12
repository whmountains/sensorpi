const execa = require('execa')

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
  const { stdout } = await execa('bme280')
  return JSON.parse(stdout)
}

module.exports = { getCalibratedReading, getReading }
