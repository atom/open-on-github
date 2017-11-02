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
    this.filePath = filePath
    const [rootDir] = atom.project.relativizePath(this.filePath)

    if (rootDir != null) {
      const rootDirIndex = atom.project.getPaths().indexOf(rootDir)
      this.repo = atom.project.getRepositories()[rootDirIndex]
    }
  }

  // Public
  open (lineRange) {
    if (this.isOpenable()) {
      this.openUrlInBrowser(this.blobUrl() + this.getLineRangeSuffix(lineRange))
    } else {
      this.reportValidationErrors()
    }
  }

  // Public
  openOnMaster (lineRange) {
    if (this.isOpenable()) {
      this.openUrlInBrowser(this.blobUrlForMaster() + this.getLineRangeSuffix(lineRange))
    } else {
      this.reportValidationErrors()
    }
  }

  // Public
  blame (lineRange) {
    if (this.isOpenable()) {
      this.openUrlInBrowser(this.blameUrl() + this.getLineRangeSuffix(lineRange))
    } else {
      this.reportValidationErrors()
    }
  }

  history () {
    if (this.isOpenable()) {
      this.openUrlInBrowser(this.historyUrl())
    } else {
      this.reportValidationErrors()
    }
  }

  copyUrl (lineRange) {
    if (this.isOpenable()) {
      atom.clipboard.write(this.shaUrl() + this.getLineRangeSuffix(lineRange))
    } else {
      this.reportValidationErrors()
    }
  }

  openBranchCompare () {
    if (this.isOpenable()) {
      this.openUrlInBrowser(this.branchCompareUrl())
    } else {
      this.reportValidationErrors()
    }
  }

  openIssues () {
    if (this.isOpenable()) {
      this.openUrlInBrowser(this.issuesUrl())
    } else {
      this.reportValidationErrors()
    }
  }

  openPullRequests () {
    if (this.isOpenable()) {
      this.openUrlInBrowser(this.pullRequestsUrl())
    } else {
      this.reportValidationErrors()
    }
  }

  openRepository () {
    if (this.isOpenable()) {
      this.openUrlInBrowser(this.githubRepoUrl())
    } else {
      this.reportValidationErrors()
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

  // Public
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

  // Internal
  reportValidationErrors () {
    const message = this.validationErrors().join('\n')
    atom.notifications.addWarning(message)
  }

  // Internal
  openUrlInBrowser (url) {
    shell.openExternal(url)
  }

  // Internal
  blobUrl () {
    const gitHubRepoUrl = this.githubRepoUrl()
    const remoteBranchName = this.remoteBranchName()
    const repoRelativePath = this.repoRelativePath()

    if (this.isGitHubWikiUrl(gitHubRepoUrl)) {
      return `${gitHubRepoUrl.slice(0, -5)}/wiki/${this.extractFileName(repoRelativePath)}`
    } else {
      return `${gitHubRepoUrl}/blob/${remoteBranchName}/${this.encodeSegments(repoRelativePath)}`
    }
  }

  // Internal
  blobUrlForMaster () {
    return `${this.githubRepoUrl()}/blob/master/${this.encodeSegments(this.repoRelativePath())}`
  }

  // Internal
  shaUrl () {
    return `${this.githubRepoUrl()}/blob/${this.encodeSegments(this.sha())}/${this.encodeSegments(this.repoRelativePath())}`
  }

  // Internal
  blameUrl () {
    return `${this.githubRepoUrl()}/blame/${this.remoteBranchName()}/${this.encodeSegments(this.repoRelativePath())}`
  }

  // Internal
  historyUrl () {
    return `${this.githubRepoUrl()}/commits/${this.remoteBranchName()}/${this.encodeSegments(this.repoRelativePath())}`
  }

  // Internal
  issuesUrl () {
    return `${this.githubRepoUrl()}/issues`
  }

  // Internal
  pullRequestsUrl () {
    return `${this.githubRepoUrl()}/pulls`
  }

  // Internal
  branchCompareUrl () {
    return `${this.githubRepoUrl()}/compare/${this.encodeSegments(this.branchName())}`
  }

  encodeSegments (segments = '') {
    return segments.split('/').map(segment => encodeURIComponent(segment)).join('/')
  }

  // Internal
  extractFileName (relativePath = '') {
    return path.parse(relativePath).name
  }

  // Internal
  gitUrl () {
    const remoteName = this.remoteName()
    if (remoteName != null) {
      return this.repo.getConfigValue(`remote.${remoteName}.url`, this.filePath)
    } else {
      return this.repo.getConfigValue(`remote.origin.url`, this.filePath)
    }
  }

  // Internal
  githubRepoUrl () {
    let url = this.gitUrl()

    if (url.match(/git@[^:]+:/)) {
      url = url.replace(/^git@([^:]+):(.+)$/, (match, host, repoPath) => {
        repoPath = repoPath.replace(/^\/+/, '')
        return `http://${host}/${repoPath}`
      })
    } else if (url.match(/ssh:\/\/git@([^/]+)\//)) {
      url = `http://${url.substring(10)}`
    } else if (url.match(/^git:\/\/[^/]+\//)) {
      url = `http${url.substring(3)}`
    }

    // Remove trailing .git and trailing slashes
    url = url.replace(/\.git$/, '').replace(/\/+$/, '')

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

  // Internal
  repoRelativePath () {
    return this.repo.getRepo(this.filePath).relativize(this.filePath)
  }

  // Internal
  remoteName () {
    const gitConfigRemote = this.repo.getConfigValue('atom.open-on-github.remote', this.filePath)

    if (gitConfigRemote) {
      return gitConfigRemote
    }

    const shortBranch = this.repo.getShortHead(this.filePath)

    if (!shortBranch) {
      return null
    }

    const branchRemote = this.repo.getConfigValue(`branch.${shortBranch}.remote`, this.filePath)

    if (branchRemote && branchRemote.length > 0) {
      return branchRemote
    }

    return null
  }

  // Internal
  sha () {
    return this.repo.getReferenceTarget('HEAD', this.filePath)
  }

  // Internal
  branchName () {
    const shortBranch = this.repo.getShortHead(this.filePath)

    if (!shortBranch) {
      return null
    }

    const branchMerge = this.repo.getConfigValue(`branch.${shortBranch}.merge`, this.filePath)
    if (!(branchMerge && branchMerge.length > 11)) {
      return shortBranch
    }

    if (branchMerge.indexOf('refs/heads/') !== 0) {
      return shortBranch
    }

    return branchMerge.substring(11)
  }

  // Internal
  remoteBranchName () {
    const gitConfigBranch = this.repo.getConfigValue('atom.open-on-github.branch', this.filePath)

    if (gitConfigBranch) {
      return gitConfigBranch
    } else if (this.remoteName() != null) {
      return this.encodeSegments(this.branchName())
    } else {
      return 'master'
    }
  }
}
