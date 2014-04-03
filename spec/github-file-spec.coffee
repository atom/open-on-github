GitHubFile = require '../lib/github-file'
fs = require 'fs-plus'
path = require 'path'
os = require 'os'

describe "GitHubFile", ->
  describe "commands", ->
    githubFile = null
    editor = null
    workingDirPath = path.join(os.tmpdir(), 'open-on-github-working-dir')
    filePathRelativeToWorkingDir = 'some-dir/some-file.md'

    fixturePath = (fixtureName) ->
      path.join(__dirname, "fixtures", "#{fixtureName}.git")

    setupWorkingDir = (fixtureName) ->
      fs.makeTreeSync workingDirPath
      fs.copySync fixturePath(fixtureName), path.join(workingDirPath, '.git')

      subdirectoryPath = path.join(workingDirPath, 'some-dir')
      fs.makeTreeSync subdirectoryPath

      filePath = path.join(subdirectoryPath, 'some-file.md')
      fs.writeFileSync filePath, 'some file content'

    setupGithubFile = ->
      atom.project.setPath(workingDirPath)
      editor = atom.project.openSync(filePathRelativeToWorkingDir)
      githubFile = GitHubFile.fromPath(editor.getPath())

    teardownWorkingDirAndRestoreFixture = (fixtureName) ->
      success = null

      # On Windows, you can not remove a watched directory/file, therefore we
      # have to close the project before attempting to delete. Unfortunately,
      # Pathwatcher's close function is also not synchronous. Once
      # atom/node-pathwatcher#4 is implemented this should be alot cleaner.
      runs ->
        atom.project.destroy()

        repeat = setInterval ->
          try
            fs.removeSync(workingDirPath)
            clearInterval(repeat)
            success = true
          catch e
            success = false
        , 50

      waitsFor -> success

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

        describe "when text is selected", ->
          it "opens the GitHub.com blob URL for the file with the selection range in the hash", ->
            atom.config.set('open-on-github.includeLineNumbersInUrls', true)
            spyOn(githubFile, 'openUrlInBrowser')
            githubFile.open([[0, 0], [1, 1]])
            expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith \
              'https://github.com/some-user/some-repo/blob/master/some-dir/some-file.md#L1-L2'

      describe "when the branch has a '/' in its name", ->
        fixtureName = 'branch-with-slash-in-name'

        beforeEach ->
          setupWorkingDir(fixtureName)
          githubFile = setupGithubFile()

        afterEach ->
          teardownWorkingDirAndRestoreFixture(fixtureName)

        it "opens the GitHub.com blob URL for the file", ->
          spyOn(githubFile, 'openUrlInBrowser')
          githubFile.open()
          expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith \
            'https://github.com/some-user/some-repo/blob/foo/bar/some-dir/some-file.md'

      describe "when the remote has a '/' in its name", ->
        fixtureName = 'remote-with-slash-in-name'

        beforeEach ->
          setupWorkingDir(fixtureName)
          githubFile = setupGithubFile()

        afterEach ->
          teardownWorkingDirAndRestoreFixture(fixtureName)

        it "opens the GitHub.com blob URL for the file", ->
          spyOn(githubFile, 'openUrlInBrowser')
          githubFile.open()
          expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith \
            'https://github.com/some-user/some-repo/blob/baz/some-dir/some-file.md'

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
        fixtureName = 'github-enterprise-remote'

        beforeEach ->
          setupWorkingDir(fixtureName)
          githubFile = setupGithubFile()

        afterEach ->
          teardownWorkingDirAndRestoreFixture(fixtureName)

        it "opens a GitHub enterprise style blob URL for the file", ->
          spyOn(githubFile, 'openUrlInBrowser')
          githubFile.open()
          expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith \
            'https://git.enterprize.me/some-user/some-repo/blob/master/some-dir/some-file.md'

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

    describe "branchCompare", ->
      describe "when the file is openable on GitHub.com", ->
        fixtureName = 'github-remote'

        beforeEach ->
          setupWorkingDir(fixtureName)
          githubFile = setupGithubFile()

        afterEach ->
          teardownWorkingDirAndRestoreFixture(fixtureName)

        it "opens the GitHub.com branch compare URL for the file", ->
          spyOn(githubFile, 'openUrlInBrowser')
          githubFile.openBranchCompare()
          expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith \
            'https://github.com/some-user/some-repo/compare/master'

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
        atom.config.set('open-on-github.includeLineNumbersInUrls', true)
        githubFile = setupGithubFile()

      afterEach ->
        teardownWorkingDirAndRestoreFixture(fixtureName)

      describe "when text is selected", ->
        it "copies the URL to the clipboard with the selection range in the hash", ->
          githubFile.copyUrl([[0, 0], [1, 1]])
          expect(atom.clipboard.read()).toBe 'https://github.com/some-user/some-repo/blob/master/some-dir/some-file.md#L1-L2'

      describe "when no text is selected", ->
        it "copies the URL to the clipboard with the cursor location in the hash", ->
          githubFile.copyUrl([[2, 1], [2, 1]])
          expect(atom.clipboard.read()).toBe 'https://github.com/some-user/some-repo/blob/master/some-dir/some-file.md#L3'

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
      expect(githubFile.githubRepoUrl()).toBe "http://github.com/foo/bar"

    it "returns a GitHub enterprise URL for a non-Github.com remote URL", ->
      githubFile.gitUrl = ->
        "https://git.enterprize.me/foo/bar.git"
      expect(githubFile.githubRepoUrl()).toBe "https://git.enterprize.me/foo/bar"

      githubFile.gitUrl = ->
        "git@git.enterprize.me:foo/bar.git"
      expect(githubFile.githubRepoUrl()).toBe "http://git.enterprize.me/foo/bar"

    it "returns the GitHub.com URL for a git:// URL", ->
      githubFile.gitUrl = ->
        "git://github.com/foo/bar.git"
      expect(githubFile.githubRepoUrl()).toBe "http://github.com/foo/bar"
