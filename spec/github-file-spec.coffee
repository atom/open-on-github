GitHubFile = require '../lib/github-file'
Project = require 'project'
fsUtils = require 'fs-utils'
path = require 'path'

describe "GitHubFile", ->
  describe "commands", ->
    githubFile = null
    workingDirPath = '/tmp/to-the-hubs-working-dir'
    filePathRelativeToWorkingDir = 'some-dir/some-file.md'

    fixturePath = (fixtureName) ->
      path.join(__dirname, "fixtures", "#{fixtureName}.git")

    setupWorkingDir = (fixtureName) ->
      fsUtils.makeTree workingDirPath
      fsUtils.move fixturePath(fixtureName), path.join(workingDirPath, '.git')

      subdirectoryPath = path.join(workingDirPath, 'some-dir')
      fsUtils.makeTree subdirectoryPath

      filePath = path.join(subdirectoryPath, 'some-file.md')
      fsUtils.writeSync filePath, 'some file content'

    setupGithubFile = ->
      project.setPath(workingDirPath)
      editSession = project.open(filePathRelativeToWorkingDir)
      githubFile = GitHubFile.fromPath(editSession.getPath())

    teardownWorkingDirAndRestoreFixture = (fixtureName) ->
      fsUtils.move path.join(workingDirPath, '.git'), fixturePath(fixtureName)
      fsUtils.remove workingDirPath

    describe "open", ->
      describe "when the file is openable on GitHub.com", ->
        fixtureName = 'github-remote'

        beforeEach ->
          setupWorkingDir(fixtureName)
          githubFile = setupGithubFile()

        afterEach ->
          teardownWorkingDirAndRestoreFixture(fixtureName)

        it "opens the GitHub.com blob URL for the file", ->
          spyOn(githubFile, 'openUrlInBrowser')
          githubFile.open()
          expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith \
            'https://github.com/some-user/some-repo/blob/master/some-dir/some-file.md'

      describe "when the local branch has no remote", ->
        fixtureName = 'no-remote'

        beforeEach ->
          setupWorkingDir(fixtureName)
          githubFile = setupGithubFile()

        afterEach ->
          teardownWorkingDirAndRestoreFixture(fixtureName)

        it "logs an error", ->
          spyOn(require('shell'), 'beep')
          spyOn(console, 'warn')
          githubFile.open()
          expect(console.warn).toHaveBeenCalledWith \
            'No remote tracking branch exists for current branch (master)'

      describe "when the remote repo is not hosted on github.com", ->
        fixtureName = 'non-github-remote'

        beforeEach ->
          setupWorkingDir(fixtureName)
          githubFile = setupGithubFile()

        afterEach ->
          teardownWorkingDirAndRestoreFixture(fixtureName)

        it "logs an error", ->
          spyOn(require('shell'), 'beep')
          spyOn(console, 'warn')
          githubFile.open()
          expect(console.warn).toHaveBeenCalledWith \
            'Remote URL is not hosted on GitHub.com (https://git.example.com/some-user/some-repo.git)'

    describe "blame", ->
      describe "when the file is openable on GitHub.com", ->
        fixtureName = 'github-remote'

        beforeEach ->
          setupWorkingDir(fixtureName)
          githubFile = setupGithubFile()

        afterEach ->
          teardownWorkingDirAndRestoreFixture(fixtureName)

        it "opens the GitHub.com blame URL for the file", ->
          spyOn(githubFile, 'openUrlInBrowser')
          githubFile.blame()
          expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith \
            'https://github.com/some-user/some-repo/blame/master/some-dir/some-file.md'

  describe "githubRepoUrl", ->
    githubFile = null

    beforeEach ->
      githubFile = new GitHubFile()

    it "returns the GitHub.com URL for an HTTP remote URL", ->
      githubFile.gitUrl = ->
        "https://github.com/foo/bar.git"
      expect(githubFile.githubRepoUrl()).toBe "https://github.com/foo/bar"

    it "returns the GitHub.com URL for an SSH remote URL", ->
      githubFile.gitUrl = ->
        "git@github.com:foo/bar.git"
      expect(githubFile.githubRepoUrl()).toBe "https://github.com/foo/bar"

    it "returns undefined for a non-GitHub remote URL", ->
      githubFile.gitUrl = ->
        "https://example.com/foo/bar.git"
      expect(githubFile.githubRepoUrl()).toBeUndefined()
