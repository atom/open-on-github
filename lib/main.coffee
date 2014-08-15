GitHubFile  = require './github-file'

module.exports =
  configDefaults:
    includeLineNumbersInUrls: true

  activate: ->
    return unless atom.project.getRepo()?

    atom.workspaceView.eachPaneView (pane) ->
      pane.command 'open-on-github:file', ->
        if itemPath = getActivePath()
          GitHubFile.fromPath(itemPath).open(getSelectedRange())

      pane.command 'open-on-github:blame', ->
        if itemPath = getActivePath()
          GitHubFile.fromPath(itemPath).blame(getSelectedRange())

      pane.command 'open-on-github:history', ->
        if itemPath = getActivePath()
          GitHubFile.fromPath(itemPath).history()

      pane.command 'open-on-github:copy-url', ->
        if itemPath = getActivePath()
          GitHubFile.fromPath(itemPath).copyUrl(getSelectedRange())

      pane.command 'open-on-github:branch-compare', ->
        if itemPath = atom.project.getPath()
          GitHubFile.fromPath(itemPath).openBranchCompare()

getActivePath = ->
  atom.workspace.getActivePaneItem()?.getPath?()

getSelectedRange = ->
  atom.workspace.getActivePaneItem()?.getSelectedBufferRange?()
