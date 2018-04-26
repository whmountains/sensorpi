const R = require('ramda')
let { Gpio } = require('onoff')

const inputs = [
  {
    name: 'input1',
    port: 1,
    pin: 19,
  },
  {
    name: 'input2',
    port: 2,
    pin: 26,
  },
].map((input) => {
  return Object.assign({}, input, { gpioInstance: new Gpio(input.pin, 'in') })
})

exports.readInputs = async () => {
  const result = {}

  inputs.forEach(({ name, gpioInstance }) => {
    result[name] = !gpioInstance.readSync() ? 1 : 0
  })

  return result
}
