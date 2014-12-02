GitHubFile  = require './github-file'

module.exports =
  config:
    includeLineNumbersInUrls:
      default: true
      type: 'boolean'

  activate: ->
    return if atom.project.getRepositories().length is 0

    atom.workspace.observePanes (pane) ->
      atom.commands.add atom.views.getView(pane),
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
          if itemPath = atom.project.getPath()
            GitHubFile.fromPath(itemPath).openBranchCompare()

getActivePath = ->
  atom.workspace.getActivePaneItem()?.getPath?()

getSelectedRange = ->
  atom.workspace.getActivePaneItem()?.getSelectedBufferRange?()
