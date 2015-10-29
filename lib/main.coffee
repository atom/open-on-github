GitHubFile  = require './github-file'

module.exports =
  config:
    includeLineNumbersInUrls:
      default: true
      type: 'boolean'
      description: 'Include the line range selected in the editor when opening or copying URLs to the clipboard. When opened in the browser, the GitHub page will automatically scroll to the selected line range.'

  activate: ->
    atom.commands.add 'atom-pane',
      'open-on-github:file': ->
        if itemPath = getActivePath()
          GitHubFile.fromPath(itemPath).open(getSelectedRange())

      'open-on-github:file-on-master': ->
        if itemPath = getActivePath()
          GitHubFile.fromPath(itemPath).openOnMaster(getSelectedRange())

      'open-on-github:blame': ->
        if itemPath = getActivePath()
          GitHubFile.fromPath(itemPath).blame(getSelectedRange())

      'open-on-github:history': ->
        if itemPath = getActivePath()
          GitHubFile.fromPath(itemPath).history()

      'open-on-github:issues': ->
        if itemPath = getActivePath()
          GitHubFile.fromPath(itemPath).openIssues()

      'open-on-github:copy-url': ->
        if itemPath = getActivePath()
          GitHubFile.fromPath(itemPath).copyUrl(getSelectedRange())

      'open-on-github:branch-compare': ->
        if itemPath = getActivePath()
          GitHubFile.fromPath(itemPath).openBranchCompare()

      'open-on-github:repository': ->
        if itemPath = getActivePath()
          GitHubFile.fromPath(itemPath).openRepository()

getActivePath = ->
  atom.workspace.getActivePaneItem()?.getPath?()

getSelectedRange = ->
  atom.workspace.getActivePaneItem()?.getSelectedBufferRange?()
