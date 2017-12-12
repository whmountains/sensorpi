const toml = require('toml')
const debounce = require('lodash.debounce')
const fs = require('mz/fs')
const resolve = require('resolve-dir')
const R = require('ramda')

const configPath = resolve('~/sensorpi_config.toml')
const writeConfigDelay = 1000
const writeConfigMaxWait = 5000

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

let configCache = ''

const loadConfig = () => {
  if (configCache) {
    return Promise.resolve(configCache)
  }

  return fs.readFile(configPath, {
    encoding: 'utf8',
  })
}

const writeConfig = debounce(
  contents => {
    configCache = contents
    return fs.writeFile(configPath, contents)
  },
  writeConfigDelay,
  { maxWait: writeConfigMaxWait },
)

module.exports = { getConfig, loadConfig, writeConfig }
