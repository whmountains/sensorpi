const ChartjsNode = require('chartjs-node')
const Influx = require('influxdb-nodejs')
const R = require('ramda')
const _ = require('lodash')
const fs = require('mz/fs')
const capitalize = require('capitalize')
const hasha = require('hasha')
const MailComposer = require('mailcomposer')
const os = require('os')
const path = require('path')
const devip = require('dev-ip')
const { getConfig } = require('../manager/config')
const Mailgun = require('mailgun-js')
const palette = require('google-palette')

// const colorList = [
//   'rgb(255, 99, 132)', // red
//   'rgb(255, 159, 64)', // orange
//   'rgb(255, 205, 86)', // yellow
//   'rgb(75, 192, 192)', // green
//   'rgb(54, 162, 235)', // blue
//   'rgb(153, 102, 255)', // purple
//   'rgb(201, 203, 207)', // grey
//

const metricsList = [
  { name: 'temperature', label: 'Temperature (˚C)' },
  { name: 'humidity', label: 'Humidity (%)' },
  { name: 'pressure', label: 'Pressure (hPa)' },
]

const main = async () => {
  // config file
  console.log('loading config')
  const config = await getConfig()

  // db client
  // const client = new Influx('http://192.168.1.162:8086/telegraf.autogen')
  const client = new Influx('http://127.0.0.1:8086/sensorpi', {
    username: config.influxdb.username,
    password: config.influxdb.password,
  })

  // container variables
  const stats = []
  const charts = []

  // mailgun client
  const mailgun = Mailgun({
    apiKey: config.mailgun.api_key,
    domain: config.mailgun.domain,
  })

  await Promise.all(
    metricsList.map(async ({ name, label }) => {
      console.log(`fetching data for ${name}`)

      // fetch data for this metric
      const data = await getMetricData(name, client)

      const title = capitalize(name)

      console.log(`Generating chart for ${name}`)
      // separate statistics by host
      data.forEach((series) => {
        stats.push({
          name,
          title,
          host: series.tags.host,
          ...getStatistics(series.values),
        })
      })

      // generate the chart
      const chart = await chartFromData({ label }, data)
      charts.push({
        filename: name + '.png',
        title,
        content: chart,
        cid: hasha(chart),
      })
    }),
  )

  // regroup all parameters under each host
  const statsByHost = _.groupBy(stats, 'host')

  // // generate data CSV files
  // const data_csvs = _.map(statsByHost, (hostStats, host) => {
  //   const values = _.zip(...statsByHost)
  //   const header = 'Time, Temperature, Humidity, Pressure'
  //   const entries = _.map(values)

  //   return {
  //     filename: host + '.csv',
  //     contents: header + entries
  //   }
  // })

  // generate summaries
  console.log(`Generating email`)
  const summarySection = _.map(statsByHost, (hostStats, host) => {
    const rows = hostStats
      .map(
        (stat) => `<tr>
        <th>${stat.title}</th>
        <td>${stat.min.toFixed(2)}</td>
        <td>${stat.average.toFixed(2)}</td>
        <td>${stat.max.toFixed(2)}</td>
      </tr>`,
      )
      .join('\n')

    return `
      <h3>${host}</h3>
      <table>
      <thead>
        <th></th>
        <th>Min</th>
        <th>Average</th>
        <th>Max</th>
      </thead>
      ${rows}

    </table>
    `
  }).join('\n')

  // render charts
  const chartsSection = charts
    .map(({ cid, title }) => {
      return `
    <h3>${title}</h3>
    <p><img src="cid:${cid}"/></p>`
    })
    .join('\n')

  // load and compile the summary template
  const summaryTemplate = _.template(
    await fs.readFile(path.join(__dirname, 'summaryTemplate.html'), {
      encoding: 'utf8',
    }),
  )
  const fullSummary = summaryTemplate({
    device_name: os.hostname,
    dev_ip: devip(),
    summary_section: summarySection,
    charts_section: chartsSection,
  })

  // build the email
  const mail = new MailComposer({
    from: 'alerts@sensorpi.whiting.io',
    to: config.summary.emails,
    html: fullSummary,
    subject: `Sensor Summary for ${os.hostname}`,
    attachments: charts,
  })

  // send it!
  await sendMsg(mailgun, {
    to: config.summary.emails,
    message: (await buildMsg(mail)).toString('ascii'),
  })

  console.log(
    `Sent summary email to ${
      config.summary.emails.length
    } address(es): ${JSON.stringify(config.summary.emails)}`,
  )
  console.log('All Done!')
}

const getMetricData = async (metricName, client) => {
  const query = `SELECT mean("${metricName}") FROM "sensorpi"."autogen"."socket_listener" WHERE time > now() - 24h GROUP BY time(10s), "host" FILL(none)`

  const result = await client.queryRaw(query)
  return result.results[0].series
}

async function chartFromData({ label }, dataSeries) {
  const colors = palette('mpn65', dataSeries.length)

  const chartOptions = {
    type: 'line',
    data: {
      datasets: dataSeries
        .sort(lexographicSort)
        .map(datasetFromSeries({ colors })),
    },
    options: {
      scales: {
        xAxes: [
          {
            type: 'time',
            distribution: 'series',
          },
        ],
        yAxes: [
          {
            scaleLabel: {
              display: true,
              labelString: label,
            },
          },
        ],
      },
    },
  }

  const chartNode = new ChartjsNode(750, 400)
  await chartNode.drawChart(chartOptions)
  return await chartNode.getImageBuffer('image/png')
}

const datasetFromSeries = ({ colors }) => (series, i) => {
  return {
    label: series.tags.host,
    borderColor: '#' + colors[i],
    data: series.values.map(([time, value]) => ({
      x: time,
      y: value,
    })),
    fill: false,
    pointRadius: 0,
  }
}

const lexographicSort = (a, b) => {
  var nameA = a.name.toUpperCase()
  var nameB = b.name.toUpperCase()
  if (nameA < nameB) {
    return -1
  }
  if (nameA > nameB) {
    return 1
  }

  // names must be equal
  return 0
}

const colorFromName = (colors, name) => {
  let hash = 0

  for (let i in name) {
    hash = (hash << 5) - hash + name.charCodeAt(i)
    hash |= 0 // Convert to 32bit integer
  }

  return colors[Math.abs(hash) % colors.length]
}

const getStatistics = (series) => {
  const values = series.map((v) => v[1])

  return {
    average: _.mean(values),
    max: _.max(values),
    min: _.min(values),
  }
}

const buildMsg = (msg) =>
  new Promise((resolve, reject) => {
    msg.build((err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })

const sendMsg = (mailgun, msg) =>
  new Promise((resolve, reject) => {
    mailgun.messages().sendMime(msg, (err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })

main()
