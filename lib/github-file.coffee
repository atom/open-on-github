child_process = require 'child_process'
EditSession   = require 'edit-session'

module.exports =
class GitHubFile
  @fromSession: (editSession) ->
    new GitHubFile(editSession)

  constructor: (@editSession) ->

  open: ->
    return unless @gitUrl() # TODO Log/notify if we're returning here?

    repoUrl = @githubRepoUrl(@gitUrl())
    return unless repoUrl? # TODO Log/notify if we're returning here?

    blobUrl = "#{repoUrl}/blob/#{@branch()}/#{@filePath()}"

    child_process.exec "open #{blobUrl}", (error, stdout, stderr) ->
      throw error if error?

  gitUrl: ->
    git.getRepo().getConfigValue("remote.#{@remoteName()}.url")

  githubRepoUrl: (gitUrl) ->
    if gitUrl.match /https:\/\/github.com\// # e.g., https://github.com/foo/bar.git
      gitUrl.replace(/\.git$/, '')
    else if gitUrl.match /git@github.com/    # e.g., git@github.com:foo/bar.git
      gitUrl.
        replace(/^git@github.com:/, 'https://github.com/').
        replace(/\.git$/, '')

  filePath: ->
    git.relativize(@editSession.getBuffer().getPath())

  remoteName: ->
    refName = git.getRepo().getUpstreamBranch() # e.g., "refs/remotes/origin/master"
    return null unless refName?

    refName.match(/^refs\/remotes\/(.*)\/.*$/)[1]

  branch: ->
    git.getShortHead()
