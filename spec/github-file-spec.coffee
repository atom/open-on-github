GitHubFile = require '../lib/github-file'
fs = require 'fs-plus'
path = require 'path'
os = require 'os'

describe "GitHubFile", ->
  [githubFile, editor] = []

  describe "commands", ->
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
      atom.project.setPaths([workingDirPath])
      waitsForPromise ->
        atom.workspace.open(filePathRelativeToWorkingDir)

      runs ->
        editor = atom.workspace.getActiveTextEditor()
        githubFile = GitHubFile.fromPath(editor.getPath())

    teardownWorkingDirAndRestoreFixture = (fixtureName) ->
      success = null

      # On Windows, you can not remove a watched directory/file, therefore we
      # have to close the project before attempting to delete. Unfortunately,
      # Pathwatcher's close function is also not synchronous. Once
      # atom/node-pathwatcher#4 is implemented this should be alot cleaner.
      runs ->
        atom.project.setPaths([])
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
          setupGithubFile()

        afterEach ->
          teardownWorkingDirAndRestoreFixture(fixtureName)

        it "opens the GitHub.com blob URL for the file", ->
          spyOn(githubFile, 'openUrlInBrowser')
          waitsForPromise -> githubFile.open()
          runs -> expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith \
            'https://github.com/some-user/some-repo/blob/master/some-dir/some-file.md'

        describe "when text is selected", ->
          it "opens the GitHub.com blob URL for the file with the selection range in the hash", ->
            atom.config.set('open-on-github.includeLineNumbersInUrls', true)
            spyOn(githubFile, 'openUrlInBrowser')
            waitsForPromise -> githubFile.open([[0, 0], [1, 1]])
            runs -> expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith \
              'https://github.com/some-user/some-repo/blob/master/some-dir/some-file.md#L1-L2'

        describe "when the file has a '#' in its name", ->
          it "opens the GitHub.com blob URL for the file", ->
            waitsForPromise ->
              atom.workspace.open('a/b#/test#hash.md')

            runs ->
              editor = atom.workspace.getActiveTextEditor()
              githubFile = GitHubFile.fromPath(editor.getPath())
              spyOn(githubFile, 'openUrlInBrowser')
              waitsForPromise -> githubFile.open()
              runs -> expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith \
                'https://github.com/some-user/some-repo/blob/master/a/b%23/test%23hash.md'

      describe "when the file is part of a GitHub wiki", ->
        fixtureName = 'github-remote-wiki'

        beforeEach ->
          setupWorkingDir(fixtureName)
          setupGithubFile()

        afterEach ->
          teardownWorkingDirAndRestoreFixture(fixtureName)

        it "opens the GitHub.com wiki URL for the file", ->
          spyOn(githubFile, 'openUrlInBrowser')
          waitsForPromise -> githubFile.open()
          runs -> expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith \
            'https://github.com/some-user/some-repo/wiki/some-file'
      describe "when the branch has a '/' in its name", ->
        fixtureName = 'branch-with-slash-in-name'

        beforeEach ->
          setupWorkingDir(fixtureName)
          setupGithubFile()

        afterEach ->
          teardownWorkingDirAndRestoreFixture(fixtureName)

        it "opens the GitHub.com blob URL for the file", ->
          spyOn(githubFile, 'openUrlInBrowser')
          waitsForPromise -> githubFile.open()
          runs -> expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith \
            'https://github.com/some-user/some-repo/blob/foo/bar/some-dir/some-file.md'

      describe "when the branch has a '#' in its name", ->
        fixtureName = 'branch-with-hash-in-name'

        beforeEach ->
          setupWorkingDir(fixtureName)
          setupGithubFile()

        afterEach ->
          teardownWorkingDirAndRestoreFixture(fixtureName)

        it "opens the GitHub.com blob URL for the file", ->
          spyOn(githubFile, 'openUrlInBrowser')
          waitsForPromise -> githubFile.open()
          runs -> expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith \
            'https://github.com/some-user/some-repo/blob/a%23b%23c/some-dir/some-file.md'

      describe "when the remote has a '/' in its name", ->
        fixtureName = 'remote-with-slash-in-name'

        beforeEach ->
          setupWorkingDir(fixtureName)
          setupGithubFile()

        afterEach ->
          teardownWorkingDirAndRestoreFixture(fixtureName)

        it "opens the GitHub.com blob URL for the file", ->
          spyOn(githubFile, 'openUrlInBrowser')
          waitsForPromise -> githubFile.open()
          runs -> expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith \
            'https://github.com/some-user/some-repo/blob/baz/some-dir/some-file.md'

      describe "when the local branch is not tracked", ->
        fixtureName = 'non-tracked-branch'

        beforeEach ->
          setupWorkingDir(fixtureName)
          setupGithubFile()

        afterEach ->
          teardownWorkingDirAndRestoreFixture(fixtureName)
        it "opens the GitHub.com blob URL for the file on the master branch", ->
          spyOn(githubFile, 'openUrlInBrowser')
          waitsForPromise -> githubFile.open()
          runs -> expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith \
            'https://github.com/some-user/some-repo/blob/master/some-dir/some-file.md'

      describe "when there is no remote", ->
        fixtureName = 'no-remote'

        beforeEach ->
          setupWorkingDir(fixtureName)
          setupGithubFile()

        afterEach ->
          teardownWorkingDirAndRestoreFixture(fixtureName)

        it "logs an error", ->
          spyOn(atom.notifications, 'addWarning')
          waitsForPromise -> githubFile.open()
          runs -> expect(atom.notifications.addWarning).toHaveBeenCalledWith \
            'No URL defined for remote: null'

      describe "when the root directory doesn't have a git repo", ->
        beforeEach ->
          teardownWorkingDirAndRestoreFixture()
          fs.mkdirSync(workingDirPath)
          setupGithubFile()

        it "does nothing", ->
          spyOn(atom.notifications, 'addWarning')
          waitsForPromise -> githubFile.open()
          runs ->
            expect(atom.notifications.addWarning).toHaveBeenCalled()
            expect(atom.notifications.addWarning.mostRecentCall.args[0]).toContain("No repository found")

      describe "when the remote repo is not hosted on github.com", ->
        fixtureName = 'github-enterprise-remote'

        beforeEach ->
          setupWorkingDir(fixtureName)
          githubFile = setupGithubFile()

        afterEach ->
          teardownWorkingDirAndRestoreFixture(fixtureName)

        it "opens a GitHub enterprise style blob URL for the file", ->
          spyOn(githubFile, 'openUrlInBrowser')
          waitsForPromise -> githubFile.open()
          runs -> expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith \
            'https://git.enterprize.me/some-user/some-repo/blob/master/some-dir/some-file.md'

      describe "when the git config is set", ->
        fixtureName = "git-config"

        beforeEach ->
          setupWorkingDir(fixtureName)
          githubFile = setupGithubFile()

        afterEach ->
          teardownWorkingDirAndRestoreFixture(fixtureName)

        it "opens a URL that is specified by the git config", ->
          spyOn(githubFile, 'openUrlInBrowser')
          waitsForPromise -> githubFile.open()
          runs -> expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith \
            'https://github.com/foo/bar/blob/some-branch/some-dir/some-file.md'

    describe "openOnMaster", ->
      fixtureName = 'non-tracked-branch'

      beforeEach ->
        setupWorkingDir(fixtureName)
        setupGithubFile()

      afterEach ->
        teardownWorkingDirAndRestoreFixture(fixtureName)

      it "opens the GitHub.com blob URL for the file", ->
        spyOn(githubFile, 'openUrlInBrowser')
        waitsForPromise -> githubFile.openOnMaster()
        runs -> expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith \
          'https://github.com/some-user/some-repo/blob/master/some-dir/some-file.md'

    describe "blame", ->
      describe "when the file is openable on GitHub.com", ->
        fixtureName = 'github-remote'

        beforeEach ->
          setupWorkingDir(fixtureName)
          setupGithubFile()

        afterEach ->
          teardownWorkingDirAndRestoreFixture(fixtureName)

        it "opens the GitHub.com blame URL for the file", ->
          spyOn(githubFile, 'openUrlInBrowser')
          waitsForPromise -> githubFile.blame()
          runs -> expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith \
            'https://github.com/some-user/some-repo/blame/master/some-dir/some-file.md'

        describe "when text is selected", ->
          it "opens the GitHub.com blame URL for the file with the selection range in the hash", ->
            atom.config.set('open-on-github.includeLineNumbersInUrls', true)
            spyOn(githubFile, 'openUrlInBrowser')
            waitsForPromise -> githubFile.blame([[0, 0], [1, 1]])
            runs -> expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith \
              'https://github.com/some-user/some-repo/blame/master/some-dir/some-file.md#L1-L2'

      describe "when the local branch is not tracked", ->
        fixtureName = 'non-tracked-branch'

        beforeEach ->
          setupWorkingDir(fixtureName)
          setupGithubFile()

        afterEach ->
          teardownWorkingDirAndRestoreFixture(fixtureName)

        it "opens the GitHub.com blame URL for the file on the master branch", ->
          spyOn(githubFile, 'openUrlInBrowser')
          waitsForPromise -> githubFile.blame()
          runs -> expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith \
            'https://github.com/some-user/some-repo/blame/master/some-dir/some-file.md'

    describe "branchCompare", ->
      describe "when the file is openable on GitHub.com", ->
        fixtureName = 'github-remote'

        beforeEach ->
          setupWorkingDir(fixtureName)
          setupGithubFile()

        afterEach ->
          teardownWorkingDirAndRestoreFixture(fixtureName)

        it "opens the GitHub.com branch compare URL for the file", ->
          spyOn(githubFile, 'openUrlInBrowser')
          waitsForPromise -> githubFile.openBranchCompare()
          runs -> expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith \
            'https://github.com/some-user/some-repo/compare/master'

    describe "history", ->
      describe "when the file is openable on GitHub.com", ->
        fixtureName = 'github-remote'

        beforeEach ->
          setupWorkingDir(fixtureName)
          setupGithubFile()

        afterEach ->
          teardownWorkingDirAndRestoreFixture(fixtureName)

        it "opens the GitHub.com history URL for the file", ->
          spyOn(githubFile, 'openUrlInBrowser')
          waitsForPromise -> githubFile.history()
          runs -> expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith \
            'https://github.com/some-user/some-repo/commits/master/some-dir/some-file.md'

      describe "when the local branch is not tracked", ->
        fixtureName = 'non-tracked-branch'

        beforeEach ->
          setupWorkingDir(fixtureName)
          setupGithubFile()

        afterEach ->
          teardownWorkingDirAndRestoreFixture(fixtureName)

        it "opens the GitHub.com history URL for the file on the master branch", ->
          spyOn(githubFile, 'openUrlInBrowser')
          waitsForPromise -> githubFile.history()
          runs -> expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith \
            'https://github.com/some-user/some-repo/commits/master/some-dir/some-file.md'

    describe "copyUrl", ->
      fixtureName = 'github-remote'

      beforeEach ->
        setupWorkingDir(fixtureName)
        atom.config.set('open-on-github.includeLineNumbersInUrls', true)
        setupGithubFile()

      afterEach ->
        teardownWorkingDirAndRestoreFixture(fixtureName)

      describe "when text is selected", ->
        it "copies the URL to the clipboard with the selection range in the hash", ->
          waitsForPromise -> githubFile.copyUrl([[0, 0], [1, 1]])
          runs -> expect(atom.clipboard.read()).toBe 'https://github.com/some-user/some-repo/blob/80b7897ceb6bd7531708509b50afeab36a4b73fd/some-dir/some-file.md#L1-L2'

      describe "when no text is selected", ->
        it "copies the URL to the clipboard with the cursor location in the hash", ->
          waitsForPromise -> githubFile.copyUrl([[2, 1], [2, 1]])
          runs -> expect(atom.clipboard.read()).toBe 'https://github.com/some-user/some-repo/blob/80b7897ceb6bd7531708509b50afeab36a4b73fd/some-dir/some-file.md#L3'

    describe "openRepository", ->
      describe "when the file is openable on GitHub.com", ->
        fixtureName = 'github-remote'

        beforeEach ->
          setupWorkingDir(fixtureName)
          setupGithubFile()

        afterEach ->
          teardownWorkingDirAndRestoreFixture(fixtureName)

        it "opens the GitHub.com repository URL", ->
          spyOn(githubFile, 'openUrlInBrowser')
          waitsForPromise -> githubFile.openRepository()
          runs -> expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith \
            'https://github.com/some-user/some-repo'

    describe "openIssues", ->
      describe 'when the file is openable on GitHub.com', ->
        fixtureName = 'github-remote'

        beforeEach ->
          setupWorkingDir(fixtureName)
          setupGithubFile()

        afterEach ->
          teardownWorkingDirAndRestoreFixture(fixtureName)

        it 'opens the GitHub.com issues URL', ->
          spyOn(githubFile, 'openUrlInBrowser')
          waitsForPromise -> githubFile.openIssues()
          runs -> expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith \
            'https://github.com/some-user/some-repo/issues'

  describe "gitHubRepoUrl", ->
    waitsForGitHubUrl = null
    beforeEach ->
      githubFile = new GitHubFile()

      waitsForGitHubUrl = (expectedUrl) ->
        gitHubRepoUrl = null
        waitsForPromise -> githubFile.gitHubRepoUrl().then (url) -> gitHubRepoUrl = url
        runs ->
          if expectedUrl?
            expect(gitHubRepoUrl).toBe expectedUrl
          else
            expect(gitHubRepoUrl).toBeUndefined()

    it "returns the GitHub.com URL for an HTTPS remote URL", ->
      githubFile.gitUrl = -> Promise.resolve("https://github.com/foo/bar.git")
      waitsForGitHubUrl("https://github.com/foo/bar")

    it "will only strip a single .git suffix", ->
      githubFile.gitUrl = -> Promise.resolve("https://github.com/foo/bar.git.git")
      waitsForGitHubUrl("https://github.com/foo/bar.git")

      runs ->
        githubFile.gitUrl = -> Promise.resolve("https://github.com/foo/bar.git.other.git")
        waitsForGitHubUrl("https://github.com/foo/bar.git.other")

    it "returns the GitHub.com URL for an HTTP remote URL", ->
      githubFile.gitUrl = -> Promise.resolve("http://github.com/foo/bar.git")
      waitsForGitHubUrl("http://github.com/foo/bar")

    it "returns the GitHub.com URL for an SSH remote URL", ->
      githubFile.gitUrl = -> Promise.resolve("git@github.com:foo/bar.git")
      waitsForGitHubUrl("http://github.com/foo/bar")

    it "returns a GitHub enterprise URL for a non-Github.com remote URL", ->
      githubFile.gitUrl = -> Promise.resolve("https://git.enterprize.me/foo/bar.git")
      waitsForGitHubUrl("https://git.enterprize.me/foo/bar")

      runs ->
        githubFile.gitUrl = -> Promise.resolve("git@git.enterprize.me:foo/bar.git")
        waitsForGitHubUrl("http://git.enterprize.me/foo/bar")

    it "returns the GitHub.com URL for a git:// URL", ->
      githubFile.gitUrl = -> Promise.resolve("git://github.com/foo/bar.git")
      waitsForGitHubUrl("http://github.com/foo/bar")

    it "returns the GitHub.com URL for a ssh:// URL", ->
      githubFile.gitUrl = -> Promise.resolve("ssh://git@github.com/foo/bar.git")
      waitsForGitHubUrl("http://github.com/foo/bar")

    it "returns undefined for Bitbucket URLs", ->
      githubFile.gitUrl = -> Promise.resolve("https://bitbucket.org/somebody/repo.git")
      waitsForGitHubUrl()

      runs ->
        githubFile.gitUrl = -> Promise.resolve("https://bitbucket.org/somebody/repo")
        waitsForGitHubUrl()

      runs ->
        githubFile.gitUrl = -> Promise.resolve("git@bitbucket.org:somebody/repo.git")
        waitsForGitHubUrl()

      runs ->
        githubFile.gitUrl = -> Promise.resolve("git@bitbucket.org:somebody/repo")
        waitsForGitHubUrl()

    it "removes leading and trailing slashes", ->
      githubFile.gitUrl = -> Promise.resolve("https://github.com/foo/bar/")
      waitsForGitHubUrl("https://github.com/foo/bar")

      runs ->
        githubFile.gitUrl = -> Promise.resolve("https://github.com/foo/bar//////")
        waitsForGitHubUrl("https://github.com/foo/bar")

      runs ->
        githubFile.gitUrl = -> Promise.resolve("git@github.com:/foo/bar.git")
        waitsForGitHubUrl("http://github.com/foo/bar")

  it "activates when a command is triggered on the active editor", ->
    activationPromise = atom.packages.activatePackage('open-on-github')

    waitsForPromise ->
      atom.workspace.open()

    runs ->
      atom.commands.dispatch(atom.views.getView(atom.workspace.getActivePane()), 'open-on-github:file')

    waitsForPromise ->
      activationPromise
