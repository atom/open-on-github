GitHubFile  = require './github-file'

module.exports =
  activate: ->
    return unless atom.project.getRepo()?

    atom.rootView.eachPane (pane) ->
      pane.command 'github:open', ->
        if itemPath = getActivePath()
          GitHubFile.fromPath(itemPath).open()

      pane.command 'github:blame', ->
        if itemPath = getActivePath()
          GitHubFile.fromPath(itemPath).blame()

      pane.command 'github:history', ->
        if itemPath = getActivePath()
          GitHubFile.fromPath(itemPath).history()

      pane.command 'github:copy-url', ->
        if itemPath = getActivePath()
          GitHubFile.fromPath(itemPath).copyUrl(getSelectedRange())

getActivePath = ->
  atom.rootView.getActivePaneItem()?.getPath?()

getSelectedRange = ->
  atom.rootView.getActivePaneItem()?.getSelectedBufferRange?()
