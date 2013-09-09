GitHubFile  = require './github-file'

module.exports =
  activate: ->
    return unless project.getRepo()?

    rootView.eachPane (pane) ->
      pane.command 'github:open', ->
        if itemPath = rootView.getActivePaneItem()?.getPath?()
          GitHubFile.fromPath(itemPath).open()

      pane.command 'github:blame', ->
        if itemPath = rootView.getActivePaneItem()?.getPath?()
          GitHubFile.fromPath(itemPath).blame()

      pane.command 'github:file-history', ->
        if itemPath = rootView.getActivePaneItem()?.getPath?()
          GitHubFile.fromPath(itemPath).history()
