EditSession = require 'edit-session'
GitHubFile  = require './github-file'

module.exports =
  activate: ->
    return unless git?

    rootView.command 'github:open', ->
      paneItem = rootView.getActivePaneItem()
      return unless paneItem instanceof EditSession

      GitHubFile.fromSession(paneItem).open()
