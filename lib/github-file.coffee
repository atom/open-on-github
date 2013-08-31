EditSession = require 'edit-session'

module.exports =
class GitHubFile

  # Public
  @fromSession: (editSession) ->
    new GitHubFile(editSession)

  # Internal
  constructor: (@editSession) ->
    @repo = project.getRepo()

  # Public
  open: ->
    unless @isOpenable()
      console.warn error for error in @validationErrors()
      return

    @openUrlInBrowser(@blobUrl())

  # Public
  isOpenable: ->
    @validationErrors().length == 0

  # Public
  validationErrors: ->
    unless @remoteName()
      return ["No remote tracking branch exists for current branch (#{@branch()})"]

    unless @gitUrl()
      return ["No URL defined for remote (#{@remoteName()})"]

    unless @githubRepoUrl()
      return ["Remote URL is not hosted on GitHub.com (#{@gitUrl()})"]

    []

  # Internal
  openUrlInBrowser: (url) ->
    require('shell').openExternal url

  # Internal
  blobUrl: ->
    "#{@githubRepoUrl()}/blob/#{@branch()}/#{@filePath()}"

  # Internal
  gitUrl: ->
    @repo.getConfigValue("remote.#{@remoteName()}.url")

  # Internal
  githubRepoUrl: ->
    url = @gitUrl()
    if url.match /https:\/\/github.com\// # e.g., https://github.com/foo/bar.git
      url.replace(/\.git$/, '')
    else if url.match /git@github.com/    # e.g., git@github.com:foo/bar.git
      url.
        replace(/^git@github.com:/, 'https://github.com/').
        replace(/\.git$/, '')

  # Internal
  filePath: ->
    @repo.relativize(@editSession.getBuffer().getPath())

  # Internal
  remoteName: ->
    # TODO: Once atom/atom#780 ships, we can simplify the line below, like so:
    #
    #   refName = @repo.getUpstreamBranch()
    #
    # See https://github.com/atom/atom/pull/780.
    refName = @repo.getRepo().getUpstreamBranch() # e.g., "refs/remotes/origin/master"
    return null unless refName?

    refName.match(/^refs\/remotes\/(.*)\/.*$/)[1]

  # Internal
  branch: ->
    @repo.getShortHead()
