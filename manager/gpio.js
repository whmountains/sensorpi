const R = require('ramda')
let { Gpio } = require('onoff')

// map of ports to output
const portMap = require('../../port_map') || {
  1: 17,
  2: 27,
  3: 22,
  4: 10,
}

// this holds the port state
let outputRegister = R.mapObjIndexed(R.always(0), portMap)

// creat objects to access the pins
const ports = R.mapObjIndexed((pin, port) => {
  const mode = outputRegister[port] ? 'high' : 'low'

  return new Gpio(pin, mode)
}, portMap)

const writePort = (port, value) => {
  if (!ports[port]) {
    return undefined
  }

  if (outputRegister[port] === value) {
    return value
  }

  ports[port].writeSync(value)
  outputRegister[port] = value
}

const writePorts = (portValueMap) => {
  R.forEachObjIndexed((value, port) => {
    writePort(port, value)
  }, portValueMap)
}

const getOutputRegister = () => outputRegister

module.exports = { writePort, writePorts, getOutputRegister }
