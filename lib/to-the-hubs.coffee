GitHubFile  = require './github-file'

module.exports =
  activate: ->
    return unless project.getRepo()?

    rootView.command 'github:open', ->
      if itemPath = rootView.getActivePaneItem()?.getPath?()
        GitHubFile.fromPath(itemPath).open()

    rootView.command 'github:blame', ->
      if itemPath = rootView.getActivePaneItem()?.getPath?()
        GitHubFile.fromPath(itemPath).blame()

    rootView.command 'github:file-history', ->
      if itemPath = rootView.getActivePaneItem()?.getPath?()
        GitHubFile.fromPath(itemPath).history()
