GitHubFile  = require './github-file'

module.exports =
  config:
    includeLineNumbersInUrls:
      default: true
      type: 'boolean'

  activate: ->
    atom.commands.add 'atom-pane',
      'open-on-github:file': ->
        if itemPath = getActivePath()
          GitHubFile.fromPath(itemPath).open(getSelectedRange())

      'open-on-github:blame': ->
        if itemPath = getActivePath()
          GitHubFile.fromPath(itemPath).blame(getSelectedRange())

      'open-on-github:history': ->
        if itemPath = getActivePath()
          GitHubFile.fromPath(itemPath).history()

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
