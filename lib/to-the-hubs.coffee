child_process = require 'child_process'
EditSession   = require 'edit-session'

githubOpen = (editSession) ->
  gitUrl = git.getRepo().getConfigValue("remote.#{remoteName()}.url")
  return unless gitUrl? # TODO Log/notify if we're returning here?

  repoUrl = githubRepoUrl(gitUrl)
  return unless repoUrl? # TODO Log/notify if we're returning here?

  path = filePath(editSession)

  blobUrl = "#{repoUrl}/blob/#{branch()}/#{path}"

  child_process.exec "open #{blobUrl}", (error, stdout, stderr) ->
    throw error if error?

githubRepoUrl = (gitUrl) ->
  if gitUrl.match /https:\/\/github.com\// # e.g., https://github.com/foo/bar.git
    gitUrl.replace(/\.git$/, '')
  else if gitUrl.match /git@github.com/    # e.g., git@github.com:foo/bar.git
    gitUrl.
      replace(/^git@github.com:/, 'https://github.com/').
      replace(/\.git$/, '')

filePath = (editSession) ->
  git.relativize(editSession.getBuffer().getPath())

remoteName = ->
  refName = git.getRepo().getUpstreamBranch() # e.g., "refs/remotes/origin/master"
  return null unless refName?

  refName.match(/^refs\/remotes\/(.*)\/.*$/)[1]

branch = ->
  git.getShortHead()

module.exports =
  activate: ->
    return unless git?

    rootView.command 'github:open', ->
      paneItem = rootView.getActivePaneItem()
      githubOpen(paneItem) if paneItem instanceof EditSession

  githubOpen: githubOpen

  # TODO Remove this from exports.
  #      It's only exported so that I can test it.
  #      So, how can I test this without it being in the exports?
  githubRepoUrl: githubRepoUrl
