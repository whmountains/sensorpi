const R = require('ramda')
let { Gpio } = require('onoff')

const inputMap = {
  1: 19,
  2: 26,
}

const ports = R.mapObjIndexed((pin, _port) => {
  return new Gpio(pin, 'in')
}, inputMap)

exports.readInputs = async () => {
  const result = {}

  for (port in Object.keys(ports)) {
    result[port] = ports[port].readSync()
  }
  return result
}
