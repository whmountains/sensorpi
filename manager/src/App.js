import React, { Component } from 'react'
import { Controlled as CodeMirror } from 'react-codemirror2'
import { map } from 'ramda'
import capitalize from 'capitalize'
import io from 'socket.io-client'

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

class App extends Component {
  constructor() {
    super()
    this.state = {
      config: '',
      reading: {},
    }
  }
  componentDidMount() {
    this.socket = io()
    this.socket.on('reading', reading => {
      this.setState({ reading: map(r => r.toFixed(2), reading) })
    })

    this.socket.on('config', config => {
      this.setState({ config })
    })
  }
  handleEditorChange = (editor, data, value) => {
    this.setState({ config: value })
    this.socket.emit('updateConfig', value)
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
          <table>
            <thead>
              <th>Reading</th>
              <th>Value</th>
            </thead>
            {Object.keys(this.state.reading).map(param => {
              return (
                <tr>
                  <td>{capitalize(param)}</td>
                  <td>
                    {this.state.reading[param]} {unitStrings[param]}
                  </td>
                </tr>
              )
            })}
          </table>
        </p>
        <h2>Configuration</h2>
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
