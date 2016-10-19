import GitHubFile from '../lib/github-file'
import fs from 'fs-plus'
import path from 'path'
import os from 'os'

describe('GitHubFile', function () {
  let [githubFile, editor] = []

  describe('commands', function () {
    let workingDirPath = path.join(os.tmpdir(), 'open-on-github-working-dir')
    let filePathRelativeToWorkingDir = 'some-dir/some-file.md'

    let fixturePath = fixtureName => path.join(__dirname, 'fixtures', `${fixtureName}.git`)

    let setupWorkingDir = function (fixtureName) {
      fs.makeTreeSync(workingDirPath)
      fs.copySync(fixturePath(fixtureName), path.join(workingDirPath, '.git'))

      let subdirectoryPath = path.join(workingDirPath, 'some-dir')
      fs.makeTreeSync(subdirectoryPath)

      let filePath = path.join(subdirectoryPath, 'some-file.md')
      return fs.writeFileSync(filePath, 'some file content')
    }

    let setupGithubFile = function () {
      atom.project.setPaths([workingDirPath])
      waitsForPromise(() => atom.workspace.open(filePathRelativeToWorkingDir))

      return runs(function () {
        editor = atom.workspace.getActiveTextEditor()
        return githubFile = GitHubFile.fromPath(editor.getPath())
      })
    }

    let teardownWorkingDirAndRestoreFixture = function (fixtureName) {
      let success = null

      // On Windows, you can not remove a watched directory/file, therefore we
      // have to close the project before attempting to delete. Unfortunately,
      // Pathwatcher's close function is also not synchronous. Once
      // atom/node-pathwatcher#4 is implemented this should be alot cleaner.
      runs(function () {
        let repeat
        atom.project.setPaths([])
        return repeat = setInterval(function () {
          try {
            fs.removeSync(workingDirPath)
            clearInterval(repeat)
            return success = true
          } catch (e) {
            return success = false
          }
        }
        , 50)
      })

      return waitsFor(() => success)
    }

    describe('open', function () {
      describe('when the file is openable on GitHub.com', function () {
        let fixtureName = 'github-remote'

        beforeEach(function () {
          setupWorkingDir(fixtureName)
          return setupGithubFile()
        })

        afterEach(() => teardownWorkingDirAndRestoreFixture(fixtureName))

        it('opens the GitHub.com blob URL for the file', function () {
          spyOn(githubFile, 'openUrlInBrowser')
          githubFile.open()
          return expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith(
            'https://github.com/some-user/some-repo/blob/master/some-dir/some-file.md')
        }
        )

        describe('when text is selected', () =>
          it('opens the GitHub.com blob URL for the file with the selection range in the hash', function () {
            atom.config.set('open-on-github.includeLineNumbersInUrls', true)
            spyOn(githubFile, 'openUrlInBrowser')
            githubFile.open([[0, 0], [1, 1]])
            return expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith(
              'https://github.com/some-user/some-repo/blob/master/some-dir/some-file.md#L1-L2')
          }
          )

        )

        return describe("when the file has a '#' in its name", () =>
          it('opens the GitHub.com blob URL for the file', function () {
            waitsForPromise(() => atom.workspace.open('a/b#/test#hash.md'))

            return runs(function () {
              editor = atom.workspace.getActiveTextEditor()
              githubFile = GitHubFile.fromPath(editor.getPath())
              spyOn(githubFile, 'openUrlInBrowser')
              githubFile.open()
              return expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith(
                'https://github.com/some-user/some-repo/blob/master/a/b%23/test%23hash.md')
            })
          }
          )

        )
      }
      )

      describe('when the file is part of a GitHub wiki', function () {
        let fixtureName = 'github-remote-wiki'

        beforeEach(function () {
          setupWorkingDir(fixtureName)
          return setupGithubFile()
        })

        afterEach(() => teardownWorkingDirAndRestoreFixture(fixtureName))

        return it('opens the GitHub.com wiki URL for the file', function () {
          spyOn(githubFile, 'openUrlInBrowser')
          githubFile.open()
          return runs(() => expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith(
            'https://github.com/some-user/some-repo/wiki/some-file')
           )
        }
        )
      }
      )

      describe("when the branch has a '/' in its name", function () {
        let fixtureName = 'branch-with-slash-in-name'

        beforeEach(function () {
          setupWorkingDir(fixtureName)
          return setupGithubFile()
        })

        afterEach(() => teardownWorkingDirAndRestoreFixture(fixtureName))

        return it('opens the GitHub.com blob URL for the file', function () {
          spyOn(githubFile, 'openUrlInBrowser')
          githubFile.open()
          return expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith(
            'https://github.com/some-user/some-repo/blob/foo/bar/some-dir/some-file.md')
        }
        )
      }
      )

      describe("when the branch has a '#' in its name", function () {
        let fixtureName = 'branch-with-hash-in-name'

        beforeEach(function () {
          setupWorkingDir(fixtureName)
          return setupGithubFile()
        })

        afterEach(() => teardownWorkingDirAndRestoreFixture(fixtureName))

        return it('opens the GitHub.com blob URL for the file', function () {
          spyOn(githubFile, 'openUrlInBrowser')
          githubFile.open()
          return expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith(
            'https://github.com/some-user/some-repo/blob/a%23b%23c/some-dir/some-file.md')
        }
        )
      }
      )

      describe("when the remote has a '/' in its name", function () {
        let fixtureName = 'remote-with-slash-in-name'

        beforeEach(function () {
          setupWorkingDir(fixtureName)
          return setupGithubFile()
        })

        afterEach(() => teardownWorkingDirAndRestoreFixture(fixtureName))

        return it('opens the GitHub.com blob URL for the file', function () {
          spyOn(githubFile, 'openUrlInBrowser')
          githubFile.open()
          return expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith(
            'https://github.com/some-user/some-repo/blob/baz/some-dir/some-file.md')
        }
        )
      }
      )

      describe('when the local branch is not tracked', function () {
        let fixtureName = 'non-tracked-branch'

        beforeEach(function () {
          setupWorkingDir(fixtureName)
          return setupGithubFile()
        })

        afterEach(() => teardownWorkingDirAndRestoreFixture(fixtureName))
        return it('opens the GitHub.com blob URL for the file on the master branch', function () {
          spyOn(githubFile, 'openUrlInBrowser')
          githubFile.open()
          return expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith(
            'https://github.com/some-user/some-repo/blob/master/some-dir/some-file.md')
        }
        )
      }
      )

      describe('when there is no remote', function () {
        let fixtureName = 'no-remote'

        beforeEach(function () {
          setupWorkingDir(fixtureName)
          return setupGithubFile()
        })

        afterEach(() => teardownWorkingDirAndRestoreFixture(fixtureName))

        return it('logs an error', function () {
          spyOn(atom.notifications, 'addWarning')
          githubFile.open()
          return expect(atom.notifications.addWarning).toHaveBeenCalledWith(
            'No URL defined for remote: null')
        }
        )
      }
      )

      describe("when the root directory doesn't have a git repo", function () {
        beforeEach(function () {
          teardownWorkingDirAndRestoreFixture()
          fs.mkdirSync(workingDirPath)
          return setupGithubFile()
        })

        return it('does nothing', function () {
          spyOn(atom.notifications, 'addWarning')
          githubFile.open()
          expect(atom.notifications.addWarning).toHaveBeenCalled()
          return expect(atom.notifications.addWarning.mostRecentCall.args[0]).toContain('No repository found')
        }
        )
      }
      )

      describe('when the remote repo is not hosted on github.com', function () {
        let fixtureName = 'github-enterprise-remote'

        beforeEach(function () {
          setupWorkingDir(fixtureName)
          return githubFile = setupGithubFile()
        })

        afterEach(() => teardownWorkingDirAndRestoreFixture(fixtureName))

        return it('opens a GitHub enterprise style blob URL for the file', function () {
          spyOn(githubFile, 'openUrlInBrowser')
          githubFile.open()
          return expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith(
            'https://git.enterprize.me/some-user/some-repo/blob/master/some-dir/some-file.md')
        }
        )
      }
      )

      return describe('when the git config is set', function () {
        let fixtureName = 'git-config'

        beforeEach(function () {
          setupWorkingDir(fixtureName)
          return githubFile = setupGithubFile()
        })

        afterEach(() => teardownWorkingDirAndRestoreFixture(fixtureName))

        return it('opens a URL that is specified by the git config', function () {
          spyOn(githubFile, 'openUrlInBrowser')
          githubFile.open()
          return expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith(
            'https://github.com/foo/bar/blob/some-branch/some-dir/some-file.md')
        }
        )
      }
      )
    }
    )

    describe('openOnMaster', function () {
      let fixtureName = 'non-tracked-branch'

      beforeEach(function () {
        setupWorkingDir(fixtureName)
        return setupGithubFile()
      })

      afterEach(() => teardownWorkingDirAndRestoreFixture(fixtureName))

      return it('opens the GitHub.com blob URL for the file', function () {
        spyOn(githubFile, 'openUrlInBrowser')
        githubFile.openOnMaster()
        return expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith(
          'https://github.com/some-user/some-repo/blob/master/some-dir/some-file.md')
      }
      )
    }
    )

    describe('blame', function () {
      describe('when the file is openable on GitHub.com', function () {
        let fixtureName = 'github-remote'

        beforeEach(function () {
          setupWorkingDir(fixtureName)
          return setupGithubFile()
        })

        afterEach(() => teardownWorkingDirAndRestoreFixture(fixtureName))

        it('opens the GitHub.com blame URL for the file', function () {
          spyOn(githubFile, 'openUrlInBrowser')
          githubFile.blame()
          return expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith(
            'https://github.com/some-user/some-repo/blame/master/some-dir/some-file.md')
        }
        )

        return describe('when text is selected', () =>
          it('opens the GitHub.com blame URL for the file with the selection range in the hash', function () {
            atom.config.set('open-on-github.includeLineNumbersInUrls', true)
            spyOn(githubFile, 'openUrlInBrowser')
            githubFile.blame([[0, 0], [1, 1]])
            return expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith(
              'https://github.com/some-user/some-repo/blame/master/some-dir/some-file.md#L1-L2')
          }
          )

        )
      }
      )

      return describe('when the local branch is not tracked', function () {
        let fixtureName = 'non-tracked-branch'

        beforeEach(function () {
          setupWorkingDir(fixtureName)
          return setupGithubFile()
        })

        afterEach(() => teardownWorkingDirAndRestoreFixture(fixtureName))

        return it('opens the GitHub.com blame URL for the file on the master branch', function () {
          spyOn(githubFile, 'openUrlInBrowser')
          githubFile.blame()
          return expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith(
            'https://github.com/some-user/some-repo/blame/master/some-dir/some-file.md')
        }
        )
      }
      )
    }
    )

    describe('branchCompare', () =>
      describe('when the file is openable on GitHub.com', function () {
        let fixtureName = 'github-remote'

        beforeEach(function () {
          setupWorkingDir(fixtureName)
          return setupGithubFile()
        })

        afterEach(() => teardownWorkingDirAndRestoreFixture(fixtureName))

        return it('opens the GitHub.com branch compare URL for the file', function () {
          spyOn(githubFile, 'openUrlInBrowser')
          githubFile.openBranchCompare()
          return expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith(
            'https://github.com/some-user/some-repo/compare/master')
        }
        )
      }
      )

    )

    describe('history', function () {
      describe('when the file is openable on GitHub.com', function () {
        let fixtureName = 'github-remote'

        beforeEach(function () {
          setupWorkingDir(fixtureName)
          return setupGithubFile()
        })

        afterEach(() => teardownWorkingDirAndRestoreFixture(fixtureName))

        return it('opens the GitHub.com history URL for the file', function () {
          spyOn(githubFile, 'openUrlInBrowser')
          githubFile.history()
          return expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith(
            'https://github.com/some-user/some-repo/commits/master/some-dir/some-file.md')
        }
        )
      }
      )

      return describe('when the local branch is not tracked', function () {
        let fixtureName = 'non-tracked-branch'

        beforeEach(function () {
          setupWorkingDir(fixtureName)
          return setupGithubFile()
        })

        afterEach(() => teardownWorkingDirAndRestoreFixture(fixtureName))

        return it('opens the GitHub.com history URL for the file on the master branch', function () {
          spyOn(githubFile, 'openUrlInBrowser')
          githubFile.history()
          return expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith(
            'https://github.com/some-user/some-repo/commits/master/some-dir/some-file.md')
        }
        )
      }
      )
    }
    )

    describe('copyUrl', function () {
      let fixtureName = 'github-remote'

      beforeEach(function () {
        setupWorkingDir(fixtureName)
        atom.config.set('open-on-github.includeLineNumbersInUrls', true)
        return setupGithubFile()
      })

      afterEach(() => teardownWorkingDirAndRestoreFixture(fixtureName))

      describe('when text is selected', () =>
        it('copies the URL to the clipboard with the selection range in the hash', function () {
          githubFile.copyUrl([[0, 0], [1, 1]])
          return expect(atom.clipboard.read()).toBe('https://github.com/some-user/some-repo/blob/80b7897ceb6bd7531708509b50afeab36a4b73fd/some-dir/some-file.md#L1-L2')
        }
        )

      )

      return describe('when no text is selected', () =>
        it('copies the URL to the clipboard with the cursor location in the hash', function () {
          githubFile.copyUrl([[2, 1], [2, 1]])
          return expect(atom.clipboard.read()).toBe('https://github.com/some-user/some-repo/blob/80b7897ceb6bd7531708509b50afeab36a4b73fd/some-dir/some-file.md#L3')
        }
        )

      )
    }
    )

    describe('openRepository', () =>
      describe('when the file is openable on GitHub.com', function () {
        let fixtureName = 'github-remote'

        beforeEach(function () {
          setupWorkingDir(fixtureName)
          return setupGithubFile()
        })

        afterEach(() => teardownWorkingDirAndRestoreFixture(fixtureName))

        return it('opens the GitHub.com repository URL', function () {
          spyOn(githubFile, 'openUrlInBrowser')
          githubFile.openRepository()
          return expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith(
            'https://github.com/some-user/some-repo')
        }
        )
      }
      )

    )

    return describe('openIssues', () =>
      describe('when the file is openable on GitHub.com', function () {
        let fixtureName = 'github-remote'

        beforeEach(function () {
          setupWorkingDir(fixtureName)
          return setupGithubFile()
        })

        afterEach(() => teardownWorkingDirAndRestoreFixture(fixtureName))

        return it('opens the GitHub.com issues URL', function () {
          spyOn(githubFile, 'openUrlInBrowser')
          githubFile.openIssues()
          return expect(githubFile.openUrlInBrowser).toHaveBeenCalledWith(
            'https://github.com/some-user/some-repo/issues')
        }
        )
      }
      )

    )
  }
  )

  describe('githubRepoUrl', function () {
    beforeEach(() => githubFile = new GitHubFile())

    it('returns the GitHub.com URL for an HTTPS remote URL', function () {
      githubFile.gitUrl = () => 'https://github.com/foo/bar.git'
      return expect(githubFile.githubRepoUrl()).toBe('https://github.com/foo/bar')
    }
    )

    it('will only strip a single .git suffix', function () {
      githubFile.gitUrl = () => 'https://github.com/foo/bar.git.git'
      expect(githubFile.githubRepoUrl()).toBe('https://github.com/foo/bar.git')

      githubFile.gitUrl = () => 'https://github.com/foo/bar.git.other.git'
      return expect(githubFile.githubRepoUrl()).toBe('https://github.com/foo/bar.git.other')
    }
    )

    it('returns the GitHub.com URL for an HTTP remote URL', function () {
      githubFile.gitUrl = () => 'http://github.com/foo/bar.git'
      return expect(githubFile.githubRepoUrl()).toBe('http://github.com/foo/bar')
    }
    )

    it('returns the GitHub.com URL for an SSH remote URL', function () {
      githubFile.gitUrl = () => 'git@github.com:foo/bar.git'
      return expect(githubFile.githubRepoUrl()).toBe('http://github.com/foo/bar')
    }
    )

    it('returns a GitHub enterprise URL for a non-Github.com remote URL', function () {
      githubFile.gitUrl = () => 'https://git.enterprize.me/foo/bar.git'
      expect(githubFile.githubRepoUrl()).toBe('https://git.enterprize.me/foo/bar')

      githubFile.gitUrl = () => 'git@git.enterprize.me:foo/bar.git'
      return expect(githubFile.githubRepoUrl()).toBe('http://git.enterprize.me/foo/bar')
    }
    )

    it('returns the GitHub.com URL for a git:// URL', function () {
      githubFile.gitUrl = () => 'git://github.com/foo/bar.git'
      return expect(githubFile.githubRepoUrl()).toBe('http://github.com/foo/bar')
    }
    )

    it('returns the GitHub.com URL for a ssh:// URL', function () {
      githubFile.gitUrl = () => 'ssh://git@github.com/foo/bar.git'
      return expect(githubFile.githubRepoUrl()).toBe('http://github.com/foo/bar')
    }
    )

    it('returns undefined for Bitbucket URLs', function () {
      githubFile.gitUrl = () => 'https://bitbucket.org/somebody/repo.git'
      expect(githubFile.githubRepoUrl()).toBeUndefined()

      githubFile.gitUrl = () => 'https://bitbucket.org/somebody/repo'
      expect(githubFile.githubRepoUrl()).toBeUndefined()

      githubFile.gitUrl = () => 'git@bitbucket.org:somebody/repo.git'
      expect(githubFile.githubRepoUrl()).toBeUndefined()

      githubFile.gitUrl = () => 'git@bitbucket.org:somebody/repo'
      return expect(githubFile.githubRepoUrl()).toBeUndefined()
    }
    )

    return it('removes leading and trailing slashes', function () {
      githubFile.gitUrl = () => 'https://github.com/foo/bar/'
      expect(githubFile.githubRepoUrl()).toBe('https://github.com/foo/bar')

      githubFile.gitUrl = () => 'https://github.com/foo/bar//////'
      expect(githubFile.githubRepoUrl()).toBe('https://github.com/foo/bar')

      githubFile.gitUrl = () => 'git@github.com:/foo/bar.git'
      return expect(githubFile.githubRepoUrl()).toBe('http://github.com/foo/bar')
    }
    )
  }
  )

  return it('activates when a command is triggered on the active editor', function () {
    let activationPromise = atom.packages.activatePackage('open-on-github')

    waitsForPromise(() => atom.workspace.open())

    runs(() => atom.commands.dispatch(atom.views.getView(atom.workspace.getActivePane()), 'open-on-github:file'))

    return waitsForPromise(() => activationPromise)
  }
  )
}
)
