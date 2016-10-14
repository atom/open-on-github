{shell} = require 'electron'
{Range} = require 'atom'
parseUrl = require('url').parse
path = require('path')

module.exports =
class GitHubFile

  # Public
  @fromPath: (filePath) ->
    new GitHubFile(filePath)

  # Internal
  constructor: (@filePath) ->
    [rootDir] = atom.project.relativizePath(@filePath)
    if rootDir?
      rootDirIndex = atom.project.getPaths().indexOf(rootDir)
      @repo = atom.project.getRepositories()[rootDirIndex]

  # Public
  open: (lineRange) ->
    if @isOpenable()
      @openUrlInBrowser(@blobUrl() + @getLineRangeSuffix(lineRange))
    else
      @reportValidationErrors()

  # Public
  openOnMaster: (lineRange) ->
    if @isOpenable()
      @openUrlInBrowser(@blobUrlForMaster() + @getLineRangeSuffix(lineRange))
    else
      @reportValidationErrors()

  # Public
  blame: (lineRange) ->
    if @isOpenable()
      @openUrlInBrowser(@blameUrl() + @getLineRangeSuffix(lineRange))
    else
      @reportValidationErrors()

  history: ->
    if @isOpenable()
      @openUrlInBrowser(@historyUrl())
    else
      @reportValidationErrors()

  copyUrl: (lineRange) ->
    if @isOpenable()
      atom.clipboard.write(@shaUrl() + @getLineRangeSuffix(lineRange))
    else
      @reportValidationErrors()

  openBranchCompare: ->
    if @isOpenable()
      @openUrlInBrowser(@branchCompareUrl())
    else
      @reportValidationErrors()

  openIssues: ->
    if @isOpenable()
      @openUrlInBrowser(@issuesUrl())
    else
      @reportValidationErrors()

  openRepository: ->
    if @isOpenable()
      @openUrlInBrowser(@githubRepoUrl())
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
    @validationErrors().length is 0

  # Public
  validationErrors: ->
    unless @repo
      return ["No repository found for path: #{@filePath}."]

    unless @gitUrl()
      return ["No URL defined for remote: #{@remoteName()}"]

    unless @githubRepoUrl()
      return ["Remote URL is not hosted on GitHub: #{@gitUrl()}"]

    []

  # Internal
  reportValidationErrors: ->
    message = @validationErrors().join('\n')
    atom.notifications.addWarning(message)

  # Internal
  openUrlInBrowser: (url) ->
    shell.openExternal url

  # Internal
  blobUrl: ->
    gitHubRepoUrl = @githubRepoUrl()
    remoteBranchName = @remoteBranchName()
    repoRelativePath = @repoRelativePath()
    if @isGitHubWikiUrl(gitHubRepoUrl)
      "#{gitHubRepoUrl.slice(0, -5)}/wiki/#{@extractFileName(repoRelativePath)}"
    else
      "#{gitHubRepoUrl}/blob/#{remoteBranchName}/#{@encodeSegments(repoRelativePath)}"

  # Internal
  blobUrlForMaster: ->
    "#{@githubRepoUrl()}/blob/master/#{@encodeSegments(@repoRelativePath())}"

  # Internal
  shaUrl: ->
    "#{@githubRepoUrl()}/blob/#{@encodeSegments(@sha())}/#{@encodeSegments(@repoRelativePath())}"

  # Internal
  blameUrl: ->
    "#{@githubRepoUrl()}/blame/#{@remoteBranchName()}/#{@encodeSegments(@repoRelativePath())}"

  # Internal
  historyUrl: ->
    "#{@githubRepoUrl()}/commits/#{@remoteBranchName()}/#{@encodeSegments(@repoRelativePath())}"

  # Internal
  issuesUrl: ->
    "#{@githubRepoUrl()}/issues"

  # Internal
  branchCompareUrl: ->
    "#{@githubRepoUrl()}/compare/#{@encodeSegments(@branchName())}"

  encodeSegments: (segments='') ->
    segments = segments.split('/')
    segments = segments.map (segment) -> encodeURIComponent(segment)
    segments.join('/')

  # Internal
  extractFileName: (relativePath='') ->
    path.parse(relativePath).name
    # [..., fileName] = segments.split '/'
    # return fileName.split('.')[0]

  # Internal
  gitUrl: ->
    remoteOrBestGuess = @remoteName() ? 'origin'
    @repo.getConfigValue("remote.#{remoteOrBestGuess}.url", @filePath)

  # Internal
  githubRepoUrl: ->
    url = @gitUrl()
    if url.match /git@[^:]+:/    # e.g., git@github.com:foo/bar.git
      url = url.replace /^git@([^:]+):(.+)$/, (match, host, repoPath) ->
        repoPath = repoPath.replace(/^\/+/, '') # replace leading slashes
        "https://#{host}/#{repoPath}"
    else if url.match /ssh:\/\/git@([^\/]+)\//    # e.g., ssh://git@github.com/foo/bar.git
      url = "https://#{url.substring(10)}"
    else if url.match /^git:\/\/[^\/]+\// # e.g., git://github.com/foo/bar.git
      url = "https#{url.substring(3)}"

    url = url.replace(/\.git$/, '')
    url = url.replace(/\/+$/, '')

    return url unless @isBitbucketUrl(url)

  isGitHubWikiUrl: (url) ->
    return /\.wiki$/.test url

  isBitbucketUrl: (url) ->
    return true if url.indexOf('git@bitbucket.org') is 0

    try
      {host} = parseUrl(url)
      host is 'bitbucket.org'

  # Internal
  repoRelativePath: ->
    @repo.getRepo(@filePath).relativize(@filePath)

  # Internal
  remoteName: ->
    gitConfigRemote = @repo.getConfigValue("atom.open-on-github.remote", @filePath)
    return gitConfigRemote if gitConfigRemote

    shortBranch = @repo.getShortHead(@filePath)
    return null unless shortBranch

    branchRemote = @repo.getConfigValue("branch.#{shortBranch}.remote", @filePath)
    return null unless branchRemote?.length > 0

    branchRemote

  # Internal
  sha: ->
    @repo.getReferenceTarget('HEAD', @filePath)

  # Internal
  branchName: ->
    shortBranch = @repo.getShortHead(@filePath)
    return null unless shortBranch

    branchMerge = @repo.getConfigValue("branch.#{shortBranch}.merge", @filePath)
    return shortBranch unless branchMerge?.length > 11
    return shortBranch unless branchMerge.indexOf('refs/heads/') is 0

    branchMerge.substring(11)

  # Internal
  remoteBranchName: ->
    gitConfigBranch = @repo.getConfigValue("atom.open-on-github.branch", @filePath)

    if gitConfigBranch
      gitConfigBranch
    else if @remoteName()?
      @encodeSegments(@branchName())
    else
      'master'
