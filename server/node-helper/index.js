const express = require('express')
const morgan = require('morgan')
const { DateTime } = require('luxon')

const app = express()

app.use(morgan('dev'))

app.get('/date', (req, res) => {
  res.send(Object.assign({}, DateTime.local()))
})

const listenPort = process.env.PORT || 3000
app.listen(listenPort, () => {
  console.log(`express listening on *:${listenPort}`)
})
