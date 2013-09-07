Shell = require 'shell'

module.exports =
class GitHubFile

  # Public
  @fromPath: (filePath) ->
    new GitHubFile(filePath)

  # Internal
  constructor: (@filePath) ->
    @repo = project.getRepo()

  # Public
  open: ->
    if @isOpenable()
      @openUrlInBrowser(@blobUrl())
    else
      @reportValidationErrors()

  # Public
  blame: ->
    if @isOpenable()
      @openUrlInBrowser(@blameUrl())
    else
      @reportValidationErrors()

  history: ->
    if @isOpenable()
      @openUrlInBrowser(@historyUrl())
    else
      @reportValidationErrors()

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
  reportValidationErrors: ->
    Shell.beep()
    console.warn error for error in @validationErrors()

  # Internal
  openUrlInBrowser: (url) ->
    Shell.openExternal url

  # Internal
  blobUrl: ->
    "#{@githubRepoUrl()}/blob/#{@branch()}/#{@repoRelativePath()}"

  # Internal
  blameUrl: ->
    "#{@githubRepoUrl()}/blame/#{@branch()}/#{@repoRelativePath()}"

  # Internal
  historyUrl: ->
    "#{@githubRepoUrl()}/commits/#{@branch()}/#{@repoRelativePath()}"

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
  repoRelativePath: ->
    @repo.relativize(@filePath)

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
