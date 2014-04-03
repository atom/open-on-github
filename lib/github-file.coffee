Shell = require 'shell'
{Range} = require 'atom'

module.exports =
class GitHubFile

  # Public
  @fromPath: (filePath) ->
    new GitHubFile(filePath)

  # Internal
  constructor: (@filePath) ->
    @repo = atom.project.getRepo()

  # Public
  open: ->
    if @isOpenable()
      @openUrlInBrowser(@blobUrl())
    else
      @reportValidationErrors()

  # Public
  blame: (lineRange) ->
    if @isOpenable()
      @openUrlInBrowser(@blameUrl() + @getLineRangeSuffix(lineRange))
    else
      @reportValidationErrors()

  history: (lineRange) ->
    if @isOpenable()
      @openUrlInBrowser(@historyUrl() + @getLineRangeSuffix(lineRange))
    else
      @reportValidationErrors()

  copyUrl: (lineRange) ->
    if @isOpenable()
      url = @blobUrl()
      atom.clipboard.write(url + @getLineRangeSuffix(lineRange))
    else
      @reportValidationErrors()

  openBranchCompare: ->
    if @isOpenable()
      @openUrlInBrowser(@branchCompareUrl())
    else
      @reportValidationErrors()

  getLineRangeSuffix: (lineRange) ->
    if lineRange and atom.config.get('open-on-github.includeLineNumbersInUrls')
      lineRange = Range.fromObject(lineRange)
      startRow = lineRange.start.row + 1
      endRow = lineRange.end.row + 1
      if startRow is endRow
        "#L#{startRow}"
      else
        "#L#{startRow}-L#{endRow}"
    else
      ''

  # Public
  isOpenable: ->
    @validationErrors().length == 0

  # Public
  validationErrors: ->
    unless @gitUrl()
      return ["No URL defined for remote (#{@remoteName()})"]

    unless @githubRepoUrl()
      return ["Remote URL is not hosted on GitHub.com (#{@gitUrl()})"]

    []

  # Internal
  reportValidationErrors: ->
    atom.beep()
    console.warn error for error in @validationErrors()

  # Internal
  openUrlInBrowser: (url) ->
    Shell.openExternal url

  # Internal
  blobUrl: ->
    "#{@githubRepoUrl()}/blob/#{@branchName()}/#{@repoRelativePath()}"

  # Internal
  blameUrl: ->
    "#{@githubRepoUrl()}/blame/#{@branchName()}/#{@repoRelativePath()}"

  # Internal
  historyUrl: ->
    "#{@githubRepoUrl()}/commits/#{@branchName()}/#{@repoRelativePath()}"

  # Internal
  branchCompareUrl: ->
    "#{@githubRepoUrl()}/compare/#{@branchName()}"

  # Internal
  gitUrl: ->
    remoteOrBestGuess = @remoteName() ? 'origin'
    @repo.getConfigValue("remote.#{remoteOrBestGuess}.url")

  # Internal
  githubRepoUrl: ->
    url = @gitUrl()
    if url.match /https:\/\/[^\/]+\// # e.g., https://github.com/foo/bar.git
      url.replace(/\.git$/, '')
    else if url.match /git@[^:]+:/    # e.g., git@github.com:foo/bar.git
      url.replace /^git@([^:]+):(.+)$/, (match, host, repoPath) ->
        "http://#{host}/#{repoPath}".replace(/\.git$/, '')
    else if url.match /^git:\/\/[^\/]+\// # e.g., git://github.com/foo/bar.git
      "http#{url.substring(3).replace(/\.git$/, '')}"

  # Internal
  repoRelativePath: ->
    @repo.relativize(@filePath)

  # Internal
  remoteName: ->
    shortBranch = @repo.getShortHead()
    return null unless shortBranch

    branchRemote = @repo.getConfigValue("branch.#{shortBranch}.remote")
    return null unless branchRemote?.length > 0

    branchRemote

  # Internal
  branchName: ->
    shortBranch = @repo.getShortHead()
    return null unless shortBranch

    branchMerge = @repo.getConfigValue("branch.#{shortBranch}.merge")
    return shortBranch unless branchMerge?.length > 11
    return shortBranch unless branchMerge.indexOf('refs/heads/') is 0

    branchMerge.substring(11)
