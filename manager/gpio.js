const R = require('ramda')

// conditionally mock the Gpio module
let { Gpio } = require('onoff')

// map of ports to output
const portMap = {
  // 1: 23,
  2: 24,
  3: 27,
  4: 22,
  5: 18,
  6: 4,
  7: 11,
}

// this holds the port state
let outputRegister = R.mapObjIndexed(R.always(0), portMap)

// creat objects to access the pins
const ports = R.mapObjIndexed((pin, port) => {
  const mode = outputRegister[port] ? 'high' : 'low'

  return new Gpio(pin, mode)
}, portMap)

const writePort = (port, value) => {
  if (outputRegister[port] !== value) {
    console.log(`writing ${value} to port ${port}.`)
    ports[port].writeSync(value)
  }
  outputRegister[port] = value
}

const writePorts = portValueMap => {
  R.forEachObjIndexed((value, port) => {
    writePort(port, value)
  })
}

const getOutputRegister = () => outputRegister

module.exports = { writePort, writePorts, getOutputRegister }
