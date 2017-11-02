const {Disposable} = require('atom')
const GitHubFile = require('./github-file')

function getActivePath () {
  const activePaneItem = atom.workspace.getActivePaneItem()

  if (activePaneItem && typeof activePaneItem.getPath === 'function') {
    return activePaneItem.getPath()
  }
}

function getSelectedRange () {
  const activePaneItem = atom.workspace.getActivePaneItem()

  if (activePaneItem && typeof activePaneItem.getSelectedBufferRange === 'function') {
    return activePaneItem.getSelectedBufferRange()
  }
}

module.exports = {
  activate () {
    this.commandsSubscription = new Disposable()
    this.commandsSubscription = atom.commands.add('atom-pane', {
      'open-on-github:file': () => {
        const itemPath = getActivePath()

        if (itemPath) {
          GitHubFile.fromPath(itemPath).open(getSelectedRange())
        }
      },

      'open-on-github:file-on-master': () => {
        const itemPath = getActivePath()

        if (itemPath) {
          GitHubFile.fromPath(itemPath).openOnMaster(getSelectedRange())
        }
      },

      'open-on-github:blame': () => {
        const itemPath = getActivePath()

        if (itemPath) {
          GitHubFile.fromPath(itemPath).blame(getSelectedRange())
        }
      },

      'open-on-github:history': () => {
        const itemPath = getActivePath()

        if (itemPath) {
          GitHubFile.fromPath(itemPath).history()
        }
      },

      'open-on-github:issues': () => {
        const itemPath = getActivePath()

        if (itemPath) {
          GitHubFile.fromPath(itemPath).openIssues()
        }
      },

      'open-on-github:pull-requests': () => {
        let itemPath = getActivePath()

        if (itemPath) {
          return GitHubFile.fromPath(itemPath).openPullRequests()
        }
      },

      'open-on-github:copy-url': () => {
        const itemPath = getActivePath()

        if (itemPath) {
          GitHubFile.fromPath(itemPath).copyUrl(getSelectedRange())
        }
      },

      'open-on-github:branch-compare': () => {
        const itemPath = getActivePath()

        if (itemPath) {
          GitHubFile.fromPath(itemPath).openBranchCompare()
        }
      },

      'open-on-github:repository': () => {
        const itemPath = getActivePath()

        if (itemPath) {
          GitHubFile.fromPath(itemPath).openRepository()
        }
      }
    })
  },

  deactivate () {
    this.commandsSubscription.dispose()
  }
}
