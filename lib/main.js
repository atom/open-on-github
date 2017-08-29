/** @babel */

import GitHubFile from './github-file'

function getActivePath () {
  let activePaneItem = atom.workspace.getActivePaneItem()

  if (activePaneItem && typeof activePaneItem.getPath === 'function') {
    return atom.workspace.getActivePaneItem().getPath()
  }
}

function getSelectedRange () {
  let activePaneItem = atom.workspace.getActivePaneItem()

  if (activePaneItem && typeof activePaneItem.getSelectedBufferRange === 'function') {
    return atom.workspace.getActivePaneItem().getSelectedBufferRange()
  }
}

export default {
  activate () {
    return atom.commands.add('atom-pane', {
      'open-on-github:file': () => {
        let itemPath = getActivePath()

        if (itemPath) {
          return GitHubFile.fromPath(itemPath).open(getSelectedRange())
        }
      },

      'open-on-github:file-on-master': () => {
        let itemPath = getActivePath()

        if (itemPath) {
          return GitHubFile.fromPath(itemPath).openOnMaster(getSelectedRange())
        }
      },

      'open-on-github:blame': () => {
        let itemPath = getActivePath()

        if (itemPath) {
          return GitHubFile.fromPath(itemPath).blame(getSelectedRange())
        }
      },

      'open-on-github:history': () => {
        let itemPath = getActivePath()

        if (itemPath) {
          return GitHubFile.fromPath(itemPath).history()
        }
      },

      'open-on-github:issues': () => {
        let itemPath = getActivePath()

        if (itemPath) {
          return GitHubFile.fromPath(itemPath).openIssues()
        }
      },

      'open-on-github:pull-requests': () => {
        let itemPath = getActivePath()

        if (itemPath) {
          return GitHubFile.fromPath(itemPath).openPullRequests()
        }
      },

      'open-on-github:copy-url': () => {
        let itemPath = getActivePath()

        if (itemPath) {
          return GitHubFile.fromPath(itemPath).copyUrl(getSelectedRange())
        }
      },

      'open-on-github:branch-compare': () => {
        let itemPath = getActivePath()

        if (itemPath) {
          return GitHubFile.fromPath(itemPath).openBranchCompare()
        }
      },

      'open-on-github:repository': () => {
        let itemPath = getActivePath()

        if (itemPath) {
          return GitHubFile.fromPath(itemPath).openRepository()
        }
      }
    })
  }
}
