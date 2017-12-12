const BME280 = require('bme280-sensor')
const execa = require('execa')

const bme280 = new BME280({
  i2cBusNo: 1,
  i2cAddress: BME280.BME280_DEFAULT_I2C_ADDRESS(),
})

bme280.init()

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
  const reading = await bme280.readSensorData()
  return {
    temperature: reading.temperature_C,
    pressure: reading.pressure_hPa,
    humidity: reading.humidity,
  }
}

module.exports = { getCalibratedReading, getReading }
