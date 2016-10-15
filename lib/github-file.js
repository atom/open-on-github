/** @babel */

import {shell} from 'electron'
import {Range} from 'atom'
import {parse as parseUrl} from 'url'
import path from 'path'

export default class GitHubFile {
  // Public
  static fromPath (filePath) {
    return new GitHubFile(filePath)
  }

  constructor (filePath) {
    let rootDirIndex
    this.filePath = filePath
    let [rootDir] = atom.project.relativizePath(this.filePath)

    if (rootDir != null) {
      rootDirIndex = atom.project.getPaths().indexOf(rootDir)
      this.repo = atom.project.getRepositories()[rootDirIndex]
    }
  }

  // Public
  open (lineRange) {
    if (this.isOpenable()) {
      return this.openUrlInBrowser(this.blobUrl() + this.getLineRangeSuffix(lineRange))
    } else {
      return this.reportValidationErrors()
    }
  }

  // Public
  openOnMaster (lineRange) {
    if (this.isOpenable()) {
      return this.openUrlInBrowser(this.blobUrlForMaster() + this.getLineRangeSuffix(lineRange))
    } else {
      return this.reportValidationErrors()
    }
  }

  // Public
  blame (lineRange) {
    if (this.isOpenable()) {
      return this.openUrlInBrowser(this.blameUrl() + this.getLineRangeSuffix(lineRange))
    } else {
      return this.reportValidationErrors()
    }
  }

  history () {
    if (this.isOpenable()) {
      return this.openUrlInBrowser(this.historyUrl())
    } else {
      return this.reportValidationErrors()
    }
  }

  copyUrl (lineRange) {
    if (this.isOpenable()) {
      return atom.clipboard.write(this.shaUrl() + this.getLineRangeSuffix(lineRange))
    } else {
      return this.reportValidationErrors()
    }
  }

  openBranchCompare () {
    if (this.isOpenable()) {
      return this.openUrlInBrowser(this.branchCompareUrl())
    } else {
      return this.reportValidationErrors()
    }
  }

  openIssues () {
    if (this.isOpenable()) {
      return this.openUrlInBrowser(this.issuesUrl())
    } else {
      return this.reportValidationErrors()
    }
  }

  openRepository () {
    if (this.isOpenable()) {
      return this.openUrlInBrowser(this.githubRepoUrl())
    } else {
      return this.reportValidationErrors()
    }
  }

  getLineRangeSuffix (lineRange) {
    let endRow
    let startRow

    if (lineRange && atom.config.get('open-on-github.includeLineNumbersInUrls')) {
      lineRange = Range.fromObject(lineRange)
      startRow = lineRange.start.row + 1
      endRow = lineRange.end.row + 1

      if (startRow === endRow) {
        return `#L${startRow}`
      } else {
        return `#L${startRow}-L${endRow}`
      }
    } else {
      return ''
    }
  }

  // Public
  isOpenable () {
    return this.validationErrors().length === 0
  }

  validationErrors () {
    if (!this.repo) {
      return [`No repository found for path: ${this.filePath}.`]
    }

    if (!this.gitUrl()) {
      return [`No URL defined for remote: ${this.remoteName()}`]
    }

    if (!this.githubRepoUrl()) {
      return [`Remote URL is not hosted on GitHub: ${this.gitUrl()}`]
    }

    return []
  }

  reportValidationErrors () {
    let message = this.validationErrors().join('\n')
    return atom.notifications.addWarning(message)
  }

  openUrlInBrowser (url) {
    return shell.openExternal(url)
  }

  blobUrl () {
    let gitHubRepoUrl = this.githubRepoUrl()
    let remoteBranchName = this.remoteBranchName()
    let repoRelativePath = this.repoRelativePath()

    if (this.isGitHubWikiUrl(gitHubRepoUrl)) {
      return `${gitHubRepoUrl.slice(0, -5)}/wiki/${this.extractFileName(repoRelativePath)}`
    } else {
      return `${gitHubRepoUrl}/blob/${remoteBranchName}/${this.encodeSegments(repoRelativePath)}`
    }
  }

  blobUrlForMaster () {
    return `${this.githubRepoUrl()}/blob/master/${this.encodeSegments(this.repoRelativePath())}`
  }

  shaUrl () {
    return `${this.githubRepoUrl()}/blob/${this.encodeSegments(this.sha())}/${this.encodeSegments(this.repoRelativePath())}`
  }

  blameUrl () {
    return `${this.githubRepoUrl()}/blame/${this.remoteBranchName()}/${this.encodeSegments(this.repoRelativePath())}`
  }

  historyUrl () {
    return `${this.githubRepoUrl()}/commits/${this.remoteBranchName()}/${this.encodeSegments(this.repoRelativePath())}`
  }

  issuesUrl () {
    return `${this.githubRepoUrl()}/issues`
  }

  branchCompareUrl () {
    return `${this.githubRepoUrl()}/compare/${this.encodeSegments(this.branchName())}`
  }

  encodeSegments (segments = '') {
    segments = segments.split('/')

    segments = segments.map((segment) => {
      return encodeURIComponent(segment)
    })

    return segments.join('/')
  }

  extractFileName (relativePath = '') {
    return path.parse(relativePath).name
  }

  gitUrl () {
    let ref
    let remoteOrBestGuess = (ref = this.remoteName()) != null ? ref : 'origin'
    return this.repo.getConfigValue(`remote.${remoteOrBestGuess}.url`, this.filePath)
  }

  githubRepoUrl () {
    let url = this.gitUrl()

    if (url.match(/git@[^:]+:/)) {
      url = url.replace(/^git@([^:]+):(.+)$/, function (match, host, repoPath) {
        repoPath = repoPath.replace(/^\/+/, '')
        return `http://${host}/${repoPath}`
      })
    } else if (url.match(/ssh:\/\/git@([^\/]+)\//)) {
      url = `http://${url.substring(10)}`
    } else if (url.match(/^git:\/\/[^\/]+\//)) {
      url = `http${url.substring(3)}`
    }

    url = url.replace(/\.git$/, '')
    url = url.replace(/\/+$/, '')

    if (!this.isBitbucketUrl(url)) {
      return url
    }
  }

  isGitHubWikiUrl (url) {
    return /\.wiki$/.test(url)
  }

  isBitbucketUrl (url) {
    if (url.indexOf('git@bitbucket.org') === 0) {
      return true
    }

    try {
      let {host} = parseUrl(url)

      return host === 'bitbucket.org'
    } finally {}
  }

  repoRelativePath () {
    return this.repo.getRepo(this.filePath).relativize(this.filePath)
  }

  remoteName () {
    let gitConfigRemote = this.repo.getConfigValue('atom.open-on-github.remote', this.filePath)

    if (gitConfigRemote) {
      return gitConfigRemote
    }

    let shortBranch = this.repo.getShortHead(this.filePath)

    if (!shortBranch) {
      return null
    }

    let branchRemote = this.repo.getConfigValue(`branch.${shortBranch}.remote`, this.filePath)

    if (!(((branchRemote != null ? branchRemote.length : void 0)) > 0)) {
      return null
    }

    return branchRemote
  }

  sha () {
    return this.repo.getReferenceTarget('HEAD', this.filePath)
  }

  branchName () {
    let shortBranch = this.repo.getShortHead(this.filePath)

    if (!shortBranch) {
      return null
    }

    let branchMerge = this.repo.getConfigValue(`branch.${shortBranch}.merge`, this.filePath)

    if (!(((branchMerge != null ? branchMerge.length : void 0)) > 11)) {
      return shortBranch
    }

    if (branchMerge.indexOf('refs/heads/') !== 0) {
      return shortBranch
    }

    return branchMerge.substring(11)
  }

  remoteBranchName () {
    let gitConfigBranch = this.repo.getConfigValue('atom.open-on-github.branch', this.filePath)

    if (gitConfigBranch) {
      return gitConfigBranch
    } else if (this.remoteName() != null) {
      return this.encodeSegments(this.branchName())
    } else {
      return 'master'
    }
  }
}
