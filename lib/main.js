const {Disposable} = require('atom')
const GitHubFile = require('./github-file')

function getActivePath (target) {
  if (!target) {
    return atom.project.getPaths()[0];
  }

  const treeView = target.closest(".tree-view");
  if (treeView) {
    // called from treeview
    const selected = treeView.querySelector(".selected > .list-item > .name, .selected > .name");
    if (selected) {
      return selected.dataset.path;
    }
    return;
  }

  const tab = target.closest(".tab-bar > .tab");
  if (tab) {
    // called from tab
    const title = tab.querySelector(".title");
    if (title && title.dataset.path) {
      return title.dataset.path;
    }
    return;
  }

  const paneItem = atom.workspace.getActivePaneItem();
  if (paneItem && typeof paneItem.getPath === "function") {
    // called from active pane
    return paneItem.getPath();
  }

  const textEditor = atom.workspace.getActiveTextEditor();
  if (textEditor && typeof textEditor.getPath === "function") {
    // fallback to activeTextEditor if activePaneItem is not a file
    return textEditor.getPath();
  }
}

function pathCommand(func) {
  return function (e) {
    const itemPath = getActivePath(e.target)

    if (itemPath) {
      func(itemPath);
    }
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
      'open-on-github:file': pathCommand((itemPath) => {
        GitHubFile.fromPath(itemPath).open(getSelectedRange())
      }),

      'open-on-github:file-on-master': pathCommand((itemPath) => {
        GitHubFile.fromPath(itemPath).openOnMaster(getSelectedRange())
      }),

      'open-on-github:blame': pathCommand((itemPath) => {
        GitHubFile.fromPath(itemPath).blame(getSelectedRange())
      }),

      'open-on-github:history': pathCommand((itemPath) => {
        GitHubFile.fromPath(itemPath).history()
      }),

      'open-on-github:issues': pathCommand((itemPath) => {
        GitHubFile.fromPath(itemPath).openIssues()
      }),

      'open-on-github:pull-requests': pathCommand((itemPath) => {
        GitHubFile.fromPath(itemPath).openPullRequests()
      }),

      'open-on-github:copy-url': pathCommand((itemPath) => {
        GitHubFile.fromPath(itemPath).copyURL(getSelectedRange())
      }),

      'open-on-github:branch-compare': pathCommand((itemPath) => {
        GitHubFile.fromPath(itemPath).openBranchCompare()
      }),

      'open-on-github:repository': pathCommand((itemPath) => {
        GitHubFile.fromPath(itemPath).openRepository()
      })
    })
  },

  deactivate () {
    this.commandsSubscription.dispose()
  }
}
