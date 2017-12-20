import React, { Component } from 'react'
import { Controlled as CodeMirror } from 'react-codemirror2'
import { map } from 'ramda'
import capitalize from 'capitalize'
import io from 'socket.io-client'
import toml from 'toml'

import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/solarized.css'
import 'codemirror/theme/material.css'
import 'codemirror/mode/toml/toml'

const editorOptions = {
  mode: 'toml',
  theme: 'material',
  lineNumbers: true,
}

const unitStrings = {
  temperature: '˚C',
  humidity: '%',
  pressure: 'hPa',
}

const ObjectTable = ({ keyHeader, valueHeader, data, valueTransform }) => {
  return (
    <table>
      <thead>
        <th>{keyHeader}</th>
        <th>{valueHeader}</th>
      </thead>
      {Object.keys(data).map(param => {
        return (
          <tr>
            <td>{capitalize(param)}</td>
            <td>
              {valueTransform
                ? valueTransform(data[param], param)
                : data[param]}
            </td>
          </tr>
        )
      })}
    </table>
  )
}

const HorizontalObjectTable = ({
  keyHeader,
  valueHeader,
  data,
  valueTransform,
}) => {
  return (
    <table>
      <tr>
        <th>{keyHeader}</th>
        {Object.keys(data).map(param => {
          return <td>{capitalize(param)}</td>
        })}
      </tr>
      <tr>
        <th>{valueHeader}</th>
        {Object.keys(data).map(param => {
          return (
            <td>
              {valueTransform
                ? valueTransform(data[param], param)
                : data[param]}
            </td>
          )
        })}
      </tr>
    </table>
  )
}

class App extends Component {
  constructor() {
    super()
    this.state = {
      config: '',
      tomlErr: '',
      portState: {},
      reading: {},
    }
  }
  componentDidMount() {
    this.socket = io()
    this.socket.on('reading', reading => {
      this.setState({ reading: map(r => r.toFixed(2), reading) })
    })

    this.socket.on('portState', portState => {
      this.setState({ portState: portState })
    })

    this.socket.on('config', config => {
      this.setState({ config })
    })
  }
  handleEditorChange = (editor, data, value) => {
    this.setState({ config: value })

    try {
      toml.parse(value)
      this.socket.emit('updateConfig', value)
      this.setState({ tomlErr: '' })
    } catch (e) {
      this.setState({
        tomlErr:
          'Parsing error on line ' +
          e.line +
          ', column ' +
          e.column +
          ': ' +
          e.message,
      })
    }
  }
  render() {
    return (
      <div>
        <h1>Sensor Pi</h1>
        <p>
          This page shows live data and configuration. Visit{' '}
          <a
            href={
              window.location.protocol +
              '//' +
              window.location.hostname +
              ':8888/'
            }
            target="_blank"
          >
            {window.location.protocol +
              '//' +
              window.location.hostname +
              ':8888/'}
          </a>{' '}
          to view historical data recorded on this Pi.
        </p>
        <h2>Live Data</h2>
        <p>
          <ObjectTable
            keyHeader="Reading"
            valueHeader="Value"
            valueTransform={(v, k) => `${v} ${unitStrings[k]}`}
            data={this.state.reading}
          />
        </p>
        <p>
          <HorizontalObjectTable
            keyHeader="Port"
            valueHeader="Value"
            data={this.state.portState}
            valueTransform={v => (!v ? 'off' : 'on')}
          />
        </p>
        <h2>Configuration</h2>
        {this.state.tomlErr && (
          <p style={{ color: 'red' }}>{this.state.tomlErr}</p>
        )}
        {this.state.config && (
          <CodeMirror
            value={this.state.config}
            options={editorOptions}
            onBeforeChange={this.handleEditorChange}
          />
        )}
      </div>
    )
  }
}

export default App
