/** @babel */

import {shell} from 'electron'
import {Range} from 'atom'
import {parse as parseURL} from 'url'
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
      this.openURLInBrowser(this.blobURL() + this.getLineRangeSuffix(lineRange))
    } else {
      this.reportValidationErrors()
    }
  }

  // Public
  openOnMaster (lineRange) {
    if (this.isOpenable()) {
      this.openURLInBrowser(this.blobURLForMaster() + this.getLineRangeSuffix(lineRange))
    } else {
      this.reportValidationErrors()
    }
  }

  // Public
  blame (lineRange) {
    if (this.isOpenable()) {
      this.openURLInBrowser(this.blameURL() + this.getLineRangeSuffix(lineRange))
    } else {
      this.reportValidationErrors()
    }
  }

  history () {
    if (this.isOpenable()) {
      this.openURLInBrowser(this.historyURL())
    } else {
      this.reportValidationErrors()
    }
  }

  copyURL (lineRange) {
    if (this.isOpenable()) {
      atom.clipboard.write(this.shaURL() + this.getLineRangeSuffix(lineRange))
    } else {
      this.reportValidationErrors()
    }
  }

  openBranchCompare () {
    if (this.isOpenable()) {
      this.openURLInBrowser(this.branchCompareURL())
    } else {
      this.reportValidationErrors()
    }
  }

  openIssues () {
    if (this.isOpenable()) {
      this.openURLInBrowser(this.issuesURL())
    } else {
      this.reportValidationErrors()
    }
  }

  openPullRequests () {
    if (this.isOpenable()) {
      this.openURLInBrowser(this.pullRequestsURL())
    } else {
      this.reportValidationErrors()
    }
  }

  openRepository () {
    if (this.isOpenable()) {
      this.openURLInBrowser(this.githubRepoURL())
    } else {
      this.reportValidationErrors()
    }
  }

  getLineRangeSuffix (lineRange) {
    let endRow
    let startRow

    if (lineRange && atom.config.get('open-on-github.includeLineNumbersInURLs')) {
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

    if (!this.gitURL()) {
      return [`No URL defined for remote: ${this.remoteName()}`]
    }

    if (!this.githubRepoURL()) {
      return [`Remote URL is not hosted on GitHub: ${this.gitURL()}`]
    }

    return []
  }

  // Internal
  reportValidationErrors () {
    const message = this.validationErrors().join('\n')
    atom.notifications.addWarning(message)
  }

  // Internal
  openURLInBrowser (url) {
    shell.openExternal(url)
  }

  // Internal
  blobURL () {
    const gitHubRepoURL = this.githubRepoURL()
    const remoteBranchName = this.remoteBranchName()
    const repoRelativePath = this.repoRelativePath()

    if (this.isGitHubWikiURL(gitHubRepoURL)) {
      return `${gitHubRepoURL.slice(0, -5)}/wiki/${this.extractFileName(repoRelativePath)}`
    } else {
      return `${gitHubRepoURL}/blob/${remoteBranchName}/${this.encodeSegments(repoRelativePath)}`
    }
  }

  // Internal
  blobURLForMaster () {
    return `${this.githubRepoURL()}/blob/master/${this.encodeSegments(this.repoRelativePath())}`
  }

  // Internal
  shaURL () {
    return `${this.githubRepoURL()}/blob/${this.encodeSegments(this.sha())}/${this.encodeSegments(this.repoRelativePath())}`
  }

  // Internal
  blameURL () {
    return `${this.githubRepoURL()}/blame/${this.remoteBranchName()}/${this.encodeSegments(this.repoRelativePath())}`
  }

  // Internal
  historyURL () {
    return `${this.githubRepoURL()}/commits/${this.remoteBranchName()}/${this.encodeSegments(this.repoRelativePath())}`
  }

  // Internal
  issuesURL () {
    return `${this.githubRepoURL()}/issues`
  }

  // Internal
  pullRequestsURL () {
    return `${this.githubRepoURL()}/pulls`
  }

  // Internal
  branchCompareURL () {
    return `${this.githubRepoURL()}/compare/${this.encodeSegments(this.branchName())}`
  }

  encodeSegments (segments = '') {
    return segments.split('/').map(segment => encodeURIComponent(segment)).join('/')
  }

  // Internal
  extractFileName (relativePath = '') {
    return path.parse(relativePath).name
  }

  // Internal
  gitURL () {
    const remoteName = this.remoteName()
    if (remoteName != null) {
      return this.repo.getConfigValue(`remote.${remoteName}.url`, this.filePath)
    } else {
      return this.repo.getConfigValue(`remote.origin.url`, this.filePath)
    }
  }

  // Internal
  githubRepoURL () {
    let url = this.gitURL()

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

    if (!this.isBitbucketURL(url)) {
      return url
    }
  }

  isGitHubWikiURL (url) {
    return /\.wiki$/.test(url)
  }

  isBitbucketURL (url) {
    if (url.indexOf('git@bitbucket.org') === 0) {
      return true
    }

    try {
      let {host} = parseURL(url)

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
