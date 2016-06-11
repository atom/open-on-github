# Open on GitHub package
[![OS X Build Status](https://travis-ci.org/atom/open-on-github.svg?branch=master)](https://travis-ci.org/atom/open-on-github) [![Windows Build Status](https://ci.appveyor.com/api/projects/status/ccl6na4qsna5wncr/branch/master?svg=true)](https://ci.appveyor.com/project/Atom/open-on-github/branch/master) [![Dependency Status](https://david-dm.org/atom/open-on-github
.svg)](https://david-dm.org/atom/open-on-github)

Provides commands to quickly view the current file on GitHub.com (The Website).

## Usage

When editing a file in Atom, use the command palette or keyboard shortcuts to:

- Open the file on github.com <kbd>alt-g, o</kbd>
- Open the blame view for the file on github.com <kbd>alt-g, b</kbd>
- Open the history view for the file on github.com <kbd>alt-g, h</kbd>
- Open the issues view for the repository the file belongs to on github.com <kbd>alt-g, i</kbd>
- Open the compare page for the current branch on github.com <kbd>alt-g, r</kbd>
- Copy the github.com URL for the currently selected lines <kbd>alt-g, c</kbd>

![Command Palette](https://f.cloud.github.com/assets/671378/2241755/23cb72f8-9ce2-11e3-9109-36c76a030f6a.png)

## Remote URL detection

The GitHub repository URL is guessed from the current branch and Git remote information. To override the defaults, you can use `git config` to set the remote and branch name:

```
git config atom.open-on-github.remote upstream
git config atom.open-on-github.branch some-branch
```

---

Inspired by the [GitHub Tools package][github-tools] for Sublime Text 2.

[github-tools]: https://github.com/temochka/sublime-text-2-github-tools
