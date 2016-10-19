/** @babel */

import fs from 'fs-plus'
import path from 'path'
import os from 'os'
import GitHubFile from '../lib/github-file'

describe('GitHubFile', function () {
  let githubFile
  let editor

  describe('commands', () => {
    let workingDirPath = path.join(os.tmpdir(), 'open-on-github-working-dir')
    let filePathRelativeToWorkingDir = 'some-dir/some-file.md'

    function fixturePath (fixtureName) {
      path.join(__dirname, 'fixtures', `${fixtureName}.git`)
    }

    function setupWorkingDir (fixtureName) {
      fs.makeTreeSync(workingDirPath)
      fs.copySync(fixturePath(fixtureName), path.join(workingDirPath, '.git'))

      let subdirectoryPath = path.join(workingDirPath, 'some-dir')
      fs.makeTreeSync(subdirectoryPath)

      let filePath = path.join(subdirectoryPath, 'some-file.md')
      return fs.writeFileSync(filePath, 'some file content')
    }

    function setupGithubFile () {
      atom.project.setPaths([workingDirPath])
      waitsForPromise(() => atom.workspace.open(filePathRelativeToWorkingDir))

      runs(() => {
        editor = atom.workspace.getActiveTextEditor()
        githubFile = GitHubFile.fromPath(editor.getPath())
      })
    }

    function teardownWorkingDirAndRestoreFixture (fixtureName) {
      let success = null

      // On Windows, you can not remove a watched directory/file, therefore we
      // have to close the project before attempting to delete. Unfortunately,
      // Pathwatcher's close function is also not synchronous. Once
      // atom/node-pathwatcher#4 is implemented this should be alot cleaner.
      runs(() => {
        atom.project.setPaths([])
        let repeat = setInterval(() => {
          try {
            fs.removeSync(workingDirPath)
            clearInterval(repeat)
            success = true
          } catch (e) {
            success = false
          }
        }, 50)
      })

      waitsFor(() => success)
    }

    describe('open', () => {
      describe('when the file is openable on GitHub.com', () => {
        let fixtureName = 'github-remote'

        beforeEach(() => {
          setupWorkingDir(fixtureName)
          setupGithubFile()
        })

        afterEach(() => teardownWorkingDirAndRestoreFixture(fixtureName))

        it('opens the GitHub.com blob URL for the file', () => {
          spyOn(githubFile, 'openUrlInBrowser')
          githubFile.open()
          expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith('https://github.com/some-user/some-repo/blob/master/some-dir/some-file.md')
        })

        describe('when text is selected', () => {
          it('opens the GitHub.com blob URL for the file with the selection range in the hash', () => {
            atom.config.set('open-on-github.includeLineNumbersInUrls', true)
            spyOn(githubFile, 'openUrlInBrowser')
            githubFile.open([[0, 0], [1, 1]])
            expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith('https://github.com/some-user/some-repo/blob/master/some-dir/some-file.md#L1-L2')
          })
        })

        describe("when the file has a '#' in its name", () => {
          it('opens the GitHub.com blob URL for the file', () => {
            waitsForPromise(() => atom.workspace.open('a/b#/test#hash.md'))

            runs(() => {
              editor = atom.workspace.getActiveTextEditor()
              githubFile = GitHubFile.fromPath(editor.getPath())
              spyOn(githubFile, 'openUrlInBrowser')
              githubFile.open()
              expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith('https://github.com/some-user/some-repo/blob/master/a/b%23/test%23hash.md')
            })
          })
        })
      })

      describe('when the file is part of a GitHub wiki', () => {
        let fixtureName = 'github-remote-wiki'

        beforeEach(() => {
          setupWorkingDir(fixtureName)
          setupGithubFile()
        })

        afterEach(() => teardownWorkingDirAndRestoreFixture(fixtureName))

        it('opens the GitHub.com wiki URL for the file', () => {
          spyOn(githubFile, 'openUrlInBrowser')
          githubFile.open()
          runs(() => {
            expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith('https://github.com/some-user/some-repo/wiki/some-file')
          })
        })
      })

      describe("when the branch has a '/' in its name", () => {
        let fixtureName = 'branch-with-slash-in-name'

        beforeEach(() => {
          setupWorkingDir(fixtureName)
          setupGithubFile()
        })

        afterEach(() => teardownWorkingDirAndRestoreFixture(fixtureName))

        it('opens the GitHub.com blob URL for the file', () => {
          spyOn(githubFile, 'openUrlInBrowser')
          githubFile.open()
          expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith('https://github.com/some-user/some-repo/blob/foo/bar/some-dir/some-file.md')
        })
      })

      describe("when the branch has a '#' in its name", () => {
        let fixtureName = 'branch-with-hash-in-name'

        beforeEach(() => {
          setupWorkingDir(fixtureName)
          setupGithubFile()
        })

        afterEach(() => teardownWorkingDirAndRestoreFixture(fixtureName))

        it('opens the GitHub.com blob URL for the file', () => {
          spyOn(githubFile, 'openUrlInBrowser')
          githubFile.open()
          expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith('https://github.com/some-user/some-repo/blob/a%23b%23c/some-dir/some-file.md')
        })
      })

      describe("when the remote has a '/' in its name", () => {
        let fixtureName = 'remote-with-slash-in-name'

        beforeEach(() => {
          setupWorkingDir(fixtureName)
          setupGithubFile()
        })

        afterEach(() => teardownWorkingDirAndRestoreFixture(fixtureName))

        it('opens the GitHub.com blob URL for the file', () => {
          spyOn(githubFile, 'openUrlInBrowser')
          githubFile.open()
          expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith('https://github.com/some-user/some-repo/blob/baz/some-dir/some-file.md')
        })
      })

      describe('when the local branch is not tracked', () => {
        let fixtureName = 'non-tracked-branch'

        beforeEach(() => {
          setupWorkingDir(fixtureName)
          setupGithubFile()
        })

        afterEach(() => teardownWorkingDirAndRestoreFixture(fixtureName))
        it('opens the GitHub.com blob URL for the file on the master branch', () => {
          spyOn(githubFile, 'openUrlInBrowser')
          githubFile.open()
          expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith('https://github.com/some-user/some-repo/blob/master/some-dir/some-file.md')
        })
      })

      describe('when there is no remote', () => {
        let fixtureName = 'no-remote'

        beforeEach(() => {
          setupWorkingDir(fixtureName)
          setupGithubFile()
        })

        afterEach(() => teardownWorkingDirAndRestoreFixture(fixtureName))

        it('logs an error', () => {
          spyOn(atom.notifications, 'addWarning')
          githubFile.open()
          expect(atom.notifications.addWarning).toHaveBeenCalledWith('No URL defined for remote: null')
        })
      })

      describe("when the root directory doesn't have a git repo", () => {
        beforeEach(() => {
          teardownWorkingDirAndRestoreFixture()
          fs.mkdirSync(workingDirPath)
          setupGithubFile()
        })

        it('does nothing', () => {
          spyOn(atom.notifications, 'addWarning')
          githubFile.open()
          expect(atom.notifications.addWarning).toHaveBeenCalled()
          expect(atom.notifications.addWarning.mostRecentCall.args[0]).toContain('No repository found')
        })
      })

      describe('when the remote repo is not hosted on github.com', () => {
        let fixtureName = 'github-enterprise-remote'

        beforeEach(() => {
          setupWorkingDir(fixtureName)
          githubFile = setupGithubFile()
        })

        afterEach(() => teardownWorkingDirAndRestoreFixture(fixtureName))

        it('opens a GitHub enterprise style blob URL for the file', () => {
          spyOn(githubFile, 'openUrlInBrowser')
          githubFile.open()
          expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith('https://git.enterprize.me/some-user/some-repo/blob/master/some-dir/some-file.md')
        })
      })

      describe('when the git config is set', () => {
        let fixtureName = 'git-config'

        beforeEach(() => {
          setupWorkingDir(fixtureName)
          githubFile = setupGithubFile()
        })

        afterEach(() => teardownWorkingDirAndRestoreFixture(fixtureName))

        it('opens a URL that is specified by the git config', () => {
          spyOn(githubFile, 'openUrlInBrowser')
          githubFile.open()
          expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith('https://github.com/foo/bar/blob/some-branch/some-dir/some-file.md')
        })
      })
    })

    describe('openOnMaster', () => {
      let fixtureName = 'non-tracked-branch'

      beforeEach(() => {
        setupWorkingDir(fixtureName)
        setupGithubFile()
      })

      afterEach(() => teardownWorkingDirAndRestoreFixture(fixtureName))

      it('opens the GitHub.com blob URL for the file', () => {
        spyOn(githubFile, 'openUrlInBrowser')
        githubFile.openOnMaster()
        expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith('https://github.com/some-user/some-repo/blob/master/some-dir/some-file.md')
      })
    })

    describe('blame', () => {
      describe('when the file is openable on GitHub.com', () => {
        let fixtureName = 'github-remote'

        beforeEach(() => {
          setupWorkingDir(fixtureName)
          setupGithubFile()
        })

        afterEach(() => teardownWorkingDirAndRestoreFixture(fixtureName))

        it('opens the GitHub.com blame URL for the file', () => {
          spyOn(githubFile, 'openUrlInBrowser')
          githubFile.blame()
          expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith('https://github.com/some-user/some-repo/blame/master/some-dir/some-file.md')
        })

        describe('when text is selected', () => {
          it('opens the GitHub.com blame URL for the file with the selection range in the hash', () => {
            atom.config.set('open-on-github.includeLineNumbersInUrls', true)
            spyOn(githubFile, 'openUrlInBrowser')
            githubFile.blame([[0, 0], [1, 1]])
            expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith('https://github.com/some-user/some-repo/blame/master/some-dir/some-file.md#L1-L2')
          })
        })
      })

      describe('when the local branch is not tracked', () => {
        let fixtureName = 'non-tracked-branch'

        beforeEach(() => {
          setupWorkingDir(fixtureName)
          setupGithubFile()
        })

        afterEach(() => teardownWorkingDirAndRestoreFixture(fixtureName))

        it('opens the GitHub.com blame URL for the file on the master branch', () => {
          spyOn(githubFile, 'openUrlInBrowser')
          githubFile.blame()
          expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith('https://github.com/some-user/some-repo/blame/master/some-dir/some-file.md')
        })
      })
    })

    describe('branchCompare', () => {
      describe('when the file is openable on GitHub.com', () => {
        let fixtureName = 'github-remote'

        beforeEach(() => {
          setupWorkingDir(fixtureName)
          setupGithubFile()
        })

        afterEach(() => teardownWorkingDirAndRestoreFixture(fixtureName))

        it('opens the GitHub.com branch compare URL for the file', () => {
          spyOn(githubFile, 'openUrlInBrowser')
          githubFile.openBranchCompare()
          expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith('https://github.com/some-user/some-repo/compare/master')
        })
      })
    })

    describe('history', () => {
      describe('when the file is openable on GitHub.com', () => {
        let fixtureName = 'github-remote'

        beforeEach(() => {
          setupWorkingDir(fixtureName)
          setupGithubFile()
        })

        afterEach(() => teardownWorkingDirAndRestoreFixture(fixtureName))

        it('opens the GitHub.com history URL for the file', () => {
          spyOn(githubFile, 'openUrlInBrowser')
          githubFile.history()
          expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith('https://github.com/some-user/some-repo/commits/master/some-dir/some-file.md')
        })
      })

      describe('when the local branch is not tracked', () => {
        let fixtureName = 'non-tracked-branch'

        beforeEach(() => {
          setupWorkingDir(fixtureName)
          setupGithubFile()
        })

        afterEach(() => teardownWorkingDirAndRestoreFixture(fixtureName))

        it('opens the GitHub.com history URL for the file on the master branch', () => {
          spyOn(githubFile, 'openUrlInBrowser')
          githubFile.history()
          expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith('https://github.com/some-user/some-repo/commits/master/some-dir/some-file.md')
        })
      })
    })

    describe('copyUrl', () => {
      let fixtureName = 'github-remote'

      beforeEach(() => {
        setupWorkingDir(fixtureName)
        atom.config.set('open-on-github.includeLineNumbersInUrls', true)
        setupGithubFile()
      })

      afterEach(() => teardownWorkingDirAndRestoreFixture(fixtureName))

      describe('when text is selected', () => {
        it('copies the URL to the clipboard with the selection range in the hash', () => {
          githubFile.copyUrl([[0, 0], [1, 1]])
          expect(atom.clipboard.read()).toBe('https://github.com/some-user/some-repo/blob/80b7897ceb6bd7531708509b50afeab36a4b73fd/some-dir/some-file.md#L1-L2')
        })
      })

      describe('when no text is selected', () => {
        it('copies the URL to the clipboard with the cursor location in the hash', () => {
          githubFile.copyUrl([[2, 1], [2, 1]])
          return expect(atom.clipboard.read()).toBe('https://github.com/some-user/some-repo/blob/80b7897ceb6bd7531708509b50afeab36a4b73fd/some-dir/some-file.md#L3')
        })
      })
    })

    describe('openRepository', () => {
      describe('when the file is openable on GitHub.com', () => {
        let fixtureName = 'github-remote'

        beforeEach(() => {
          setupWorkingDir(fixtureName)
          setupGithubFile()
        })

        afterEach(() => teardownWorkingDirAndRestoreFixture(fixtureName))

        it('opens the GitHub.com repository URL', () => {
          spyOn(githubFile, 'openUrlInBrowser')
          githubFile.openRepository()
          expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith('https://github.com/some-user/some-repo')
        })
      })
    })

    describe('openIssues', () => {
      describe('when the file is openable on GitHub.com', () => {
        let fixtureName = 'github-remote'

        beforeEach(() => {
          setupWorkingDir(fixtureName)
          setupGithubFile()
        })

        afterEach(() => teardownWorkingDirAndRestoreFixture(fixtureName))

        it('opens the GitHub.com issues URL', () => {
          spyOn(githubFile, 'openUrlInBrowser')
          githubFile.openIssues()
          expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith('https://github.com/some-user/some-repo/issues')
        })
      })
    })
  })

  describe('githubRepoUrl', () => {
    beforeEach(() => {
      githubFile = new GitHubFile()
    })

    it('returns the GitHub.com URL for an HTTPS remote URL', () => {
      githubFile.gitUrl = () => 'https://github.com/foo/bar.git'
      expect(githubFile.githubRepoUrl()).toBe('https://github.com/foo/bar')
    })

    it('will only strip a single .git suffix', () => {
      githubFile.gitUrl = () => 'https://github.com/foo/bar.git.git'
      expect(githubFile.githubRepoUrl()).toBe('https://github.com/foo/bar.git')

      githubFile.gitUrl = () => 'https://github.com/foo/bar.git.other.git'
      expect(githubFile.githubRepoUrl()).toBe('https://github.com/foo/bar.git.other')
    })

    it('returns the GitHub.com URL for an HTTP remote URL', () => {
      githubFile.gitUrl = () => 'http://github.com/foo/bar.git'
      expect(githubFile.githubRepoUrl()).toBe('http://github.com/foo/bar')
    })

    it('returns the GitHub.com URL for an SSH remote URL', () => {
      githubFile.gitUrl = () => 'git@github.com:foo/bar.git'
      expect(githubFile.githubRepoUrl()).toBe('http://github.com/foo/bar')
    })

    it('returns a GitHub enterprise URL for a non-Github.com remote URL', () => {
      githubFile.gitUrl = () => 'https://git.enterprize.me/foo/bar.git'
      expect(githubFile.githubRepoUrl()).toBe('https://git.enterprize.me/foo/bar')

      githubFile.gitUrl = () => 'git@git.enterprize.me:foo/bar.git'
      expect(githubFile.githubRepoUrl()).toBe('http://git.enterprize.me/foo/bar')
    })

    it('returns the GitHub.com URL for a git:// URL', () => {
      githubFile.gitUrl = () => 'git://github.com/foo/bar.git'
      expect(githubFile.githubRepoUrl()).toBe('http://github.com/foo/bar')
    })

    it('returns the GitHub.com URL for a ssh:// URL', () => {
      githubFile.gitUrl = () => 'ssh://git@github.com/foo/bar.git'
      expect(githubFile.githubRepoUrl()).toBe('http://github.com/foo/bar')
    })

    it('returns undefined for Bitbucket URLs', () => {
      githubFile.gitUrl = () => 'https://bitbucket.org/somebody/repo.git'
      expect(githubFile.githubRepoUrl()).toBeUndefined()

      githubFile.gitUrl = () => 'https://bitbucket.org/somebody/repo'
      expect(githubFile.githubRepoUrl()).toBeUndefined()

      githubFile.gitUrl = () => 'git@bitbucket.org:somebody/repo.git'
      expect(githubFile.githubRepoUrl()).toBeUndefined()

      githubFile.gitUrl = () => 'git@bitbucket.org:somebody/repo'
      expect(githubFile.githubRepoUrl()).toBeUndefined()
    })

    it('removes leading and trailing slashes', () => {
      githubFile.gitUrl = () => 'https://github.com/foo/bar/'
      expect(githubFile.githubRepoUrl()).toBe('https://github.com/foo/bar')

      githubFile.gitUrl = () => 'https://github.com/foo/bar//////'
      expect(githubFile.githubRepoUrl()).toBe('https://github.com/foo/bar')

      githubFile.gitUrl = () => 'git@github.com:/foo/bar.git'
      expect(githubFile.githubRepoUrl()).toBe('http://github.com/foo/bar')
    })
  })

  it('activates when a command is triggered on the active editor', () => {
    const activationPromise = atom.packages.activatePackage('open-on-github')

    waitsForPromise(() => atom.workspace.open())

    runs(() => {
      atom.commands.dispatch(atom.views.getView(atom.workspace.getActivePane()), 'open-on-github:file')
    })

    waitsForPromise(() => activationPromise)
  })
})
