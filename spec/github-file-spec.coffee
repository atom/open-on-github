GitHubFile = require '../lib/github-file'
{fs} = require 'atom'
path = require 'path'

describe "GitHubFile", ->
  describe "commands", ->
    githubFile = null
    workingDirPath = '/tmp/to-the-hubs-working-dir'
    filePathRelativeToWorkingDir = 'some-dir/some-file.md'

    fixturePath = (fixtureName) ->
      path.join(__dirname, "fixtures", "#{fixtureName}.git")

    setupWorkingDir = (fixtureName) ->
      fs.makeTree workingDirPath
      fs.move fixturePath(fixtureName), path.join(workingDirPath, '.git')

      subdirectoryPath = path.join(workingDirPath, 'some-dir')
      fs.makeTree subdirectoryPath

      filePath = path.join(subdirectoryPath, 'some-file.md')
      fs.writeSync filePath, 'some file content'

    setupGithubFile = ->
      project.setPath(workingDirPath)
      editSession = project.open(filePathRelativeToWorkingDir)
      githubFile = GitHubFile.fromPath(editSession.getPath())

    teardownWorkingDirAndRestoreFixture = (fixtureName) ->
      fs.move path.join(workingDirPath, '.git'), fixturePath(fixtureName)
      fs.remove workingDirPath

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

      describe "when the local branch is not tracked", ->
        fixtureName = 'non-tracked-branch'

        beforeEach ->
          setupWorkingDir(fixtureName)
          githubFile = setupGithubFile()

        afterEach ->
          teardownWorkingDirAndRestoreFixture(fixtureName)

        it "opens the GitHub.com blob URL for the file", ->
          spyOn(githubFile, 'openUrlInBrowser')
          githubFile.open()
          expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith \
            'https://github.com/some-user/some-repo/blob/non-tracked-branch/some-dir/some-file.md'

      describe "when there is no remote", ->
        fixtureName = 'no-remote'

        beforeEach ->
          setupWorkingDir(fixtureName)
          githubFile = setupGithubFile()

        afterEach ->
          teardownWorkingDirAndRestoreFixture(fixtureName)

        it "logs an error", ->
          spyOn(atom, 'beep')
          spyOn(console, 'warn')
          githubFile.open()
          expect(console.warn).toHaveBeenCalledWith \
            'No URL defined for remote (null)'

      describe "when the remote repo is not hosted on github.com", ->
        fixtureName = 'non-github-remote'

        beforeEach ->
          setupWorkingDir(fixtureName)
          githubFile = setupGithubFile()

        afterEach ->
          teardownWorkingDirAndRestoreFixture(fixtureName)

        it "logs an error", ->
          spyOn(atom, 'beep')
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

    describe "history", ->
      describe "when the file is openable on GitHub.com", ->
        fixtureName = 'github-remote'

        beforeEach ->
          setupWorkingDir(fixtureName)
          githubFile = setupGithubFile()

        afterEach ->
          teardownWorkingDirAndRestoreFixture(fixtureName)

        it "opens the GitHub.com blame URL for the file", ->
          spyOn(githubFile, 'openUrlInBrowser')
          githubFile.history()
          expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith \
            'https://github.com/some-user/some-repo/commits/master/some-dir/some-file.md'

    describe "copyUrl", ->
      fixtureName = 'github-remote'

      beforeEach ->
        setupWorkingDir(fixtureName)
        githubFile = setupGithubFile()

      afterEach ->
        teardownWorkingDirAndRestoreFixture(fixtureName)

      describe "when text is selected", ->
        it "copies the URL to the pasteboard with the selection range in the hash", ->
          githubFile.copyUrl([[0, 0], [1, 1]])
          expect(pasteboard.read()[0]).toBe 'https://github.com/some-user/some-repo/blob/master/some-dir/some-file.md#L1-L2'

      describe "when no text is selected", ->
        it "copies the URL to the pasteboard with the cursor location in the hash", ->
          githubFile.copyUrl([[2, 1], [2, 1]])
          expect(pasteboard.read()[0]).toBe 'https://github.com/some-user/some-repo/blob/master/some-dir/some-file.md#L3'

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
