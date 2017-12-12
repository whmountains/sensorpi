const toml = require('toml')
const debounce = require('lodash.debounce')
const fs = require('mz/fs')

const readConfigInterval = 1000

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

const loadConfig = debounce(
  () => {
    return fs.readFile(configPath, {
      encoding: 'utf8',
    })
  },
  readConfigInterval,
  { leading: true },
)

module.exports = { getConfig, loadConfig }
