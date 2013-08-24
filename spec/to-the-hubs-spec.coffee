GitHubFile = require '../lib/github-file'

describe "GitHubFile", ->
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
