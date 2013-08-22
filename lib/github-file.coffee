child_process = require 'child_process'
EditSession   = require 'edit-session'

module.exports =
class GitHubFile
  @fromSession: (editSession) ->
    new GitHubFile(editSession)

  constructor: (@editSession) ->

  open: ->
    unless @isOpenable()
      console.warn error for error in @validationErrors()
      return

    child_process.exec "open #{@blobUrl()}", (error, stdout, stderr) ->
      throw error if error?

  blobUrl: ->
    "#{@githubRepoUrl()}/blob/#{@branch()}/#{@filePath()}"

  gitUrl: ->
    git.getRepo().getConfigValue("remote.#{@remoteName()}.url")

  githubRepoUrl: ->
    url = @gitUrl()
    if url.match /https:\/\/github.com\// # e.g., https://github.com/foo/bar.git
      url.replace(/\.git$/, '')
    else if url.match /git@github.com/    # e.g., git@github.com:foo/bar.git
      url.
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

  isOpenable: ->
    @validationErrors().length == 0

  validationErrors: ->
    unless @remoteName()
      return ["No remote tracking branch exists for current branch (#{@branch()})"]

    unless @gitUrl()
      return ["No URL defined for remote (#{@remoteName()})"]

    unless @githubRepoUrl()
      return ["Remote URL is not hosted on GitHub.com (#{@gitUrl()})"]

    []
