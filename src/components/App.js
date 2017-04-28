import Logger from 'logger'

import React from 'react'

import Sidepane from './Sidepane'
import AceEditor from 'react-ace'
import 'brace/mode/javascript'
import 'brace/theme/github'

import '../style.css'

const logger = new Logger('App')

class App extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      selectedSnippet: null,
      snippets: {},
      nextId: 0
    }

    this.selectSnippet = this.selectSnippet.bind(this)
    this.handleKeyPress = this.handleKeyPress.bind(this)
    this.updateSnippetName = this.updateSnippetName.bind(this)
    this.handleEditorChange = this.handleEditorChange.bind(this)
    this.saveSnippetToStorage = this.saveSnippetToStorage.bind(this)
    this.resetSnippets = this.resetSnippets.bind(this)
    this.createSnippet = this.createSnippet.bind(this)
    this.getNextId = this.getNextId.bind(this)
    // this.deleteSnippet = this.deleteSnippet.bind(this)

    function onDataLoadFail(error) {
      logger.error('Failed to load snippets from sync storage')
      logger.error(error)
      this.resetSnippets({
        '0': {
          name: 'Error',
          content: "Uh oh! Couldn't load snippets from Chrome storage. \n" + error
        }
      })
    }

    try {
      const resetSnippets = this.resetSnippets
      const setState = this.setState
      chrome.storage.sync.get(null, function (storage) {
        if (chrome.runtime.lastError) {
          onDataLoadFail(chrome.runtime.lastError)
          return
        }

        resetSnippets(storage.snippets)
        setState({
          nextId: storage.nextId
        })
      })
    } catch (error) {
      onDataLoadFail(error)
    }
  }

  getNextId() {
    const nextId = this.state.nextId
    const setState = this.setState
    chrome.storage.sync.set({
      nextId: nextId + 1
    }, function () {
      setState({
        nextId: nextId + 1
      })
    })
    return nextId
  }

  resetSnippets(snippets) {
    const newState = {
      snippets: snippets
    }
    if (Object.keys(newState.snippets).length === 0) {
      newState.snippets = {
        '0': {
          name: 'New Snippet',
          content: 'console.log(\'Welcome to Snippets!\')'
        }
      }
    }
    if (!this.state.selectedSnippet || !newState.snippets[this.state.selectedSnippet]) {
      newState.selectedSnippet = Object.keys(newState.snippets)[0]
    }

    this.setState(newState)
  }

  selectSnippet(snippetID) {
    this.setState({
      selectedSnippet: snippetID
    })
  }

  createSnippet() {
    const id = this.getNextId()
    this.setState(function (previousState) {
      previousState.snippets[id] = {
        name: 'New Snippet #' + id,
        content: ''
      }

      return previousState
    })
  }

  updateSnippetName(snippetID, newName) {
    this.setState(function (previousState) {
      previousState.snippets[snippetID].name = newName
      return previousState
    })
  }

  saveSnippetToStorage(snippetID) {
    chrome.storage.sync.set({
      snippets: {
        [snippetID]: this.state.snippets[snippetID]
      }
    })
  }

  handleKeyPress(event) {
    logger.info("Got div's keypress")
    logger.info('key: ' + event.key)
    if (event.key === 's' && event.ctrlKey) {
      logger.info('saving snippet!')
      this.saveSnippetToStorage(this.state.selectedSnippet)
    }
  }

  handleEditorChange(newValue) {
    this.setState(function (previousState) {
      previousState.snippets[this.state.selectedSnippet].content = newValue
      return previousState
    })
  }

  // deleteSnippet() {
  //
  // }

  render() {
    return (
      <div
        className="app"
        onKeyDown={this.handleKeyPress}
      >
        <Sidepane
          snippets={this.state.snippets}
          selectedSnippet={this.state.selectedSnippet}
          selectSnippet={this.selectSnippet}
          updateSnippetName={this.updateSnippetName}
          createSnippet={this.createSnippet}
        />
        <AceEditor
          mode="javascript"
          name="editor"
          height="100vh"
          width="90%"
          theme="github"
          value={
            this.state.selectedSnippet
              ? this.state.snippets[this.state.selectedSnippet].content
              : 'Please select or create a snippet!'
          }
          readOnly={!this.state.selectedSnippet}
          onChange={this.handleEditorChange}
        />
      </div>
    )
  }
}

export default App
