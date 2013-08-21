{githubOpen, githubRepoUrl} = require '../lib/to-the-hubs'

describe "ToTheHubs", ->
  describe "githubRepoUrl(gitUrl)", ->
    it "returns the GitHub.com URL for an HTTP remote URL", ->
      url = githubRepoUrl("https://github.com/foo/bar.git")
      expect(url).toBe "https://github.com/foo/bar"

    it "returns the GitHub.com URL for an SSH remote URL", ->
      url = githubRepoUrl("git@github.com:foo/bar.git")
      expect(url).toBe "https://github.com/foo/bar"

    it "retuns undefined for a non-GitHub remote URL", ->
      url = githubRepoUrl("https://example.com/foo/bar.git")
      expect(url).toBeUndefined()
