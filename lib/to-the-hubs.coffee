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

      pane.command 'github:history', ->
        if itemPath = rootView.getActivePaneItem()?.getPath?()
          GitHubFile.fromPath(itemPath).history()

      pane.command 'github:copy-url', ->
        activeItem = rootView.getActivePaneItem()
        if itemPath = activeItem.getPath?()
          range = activeItem.getSelection?()?.getBufferRange?()
          GitHubFile.fromPath(itemPath).copyUrl(range)
