Generate release documentation by analyzing changes since the last release, then open a pull request.

**Important:** This command must be run from the `staging` branch. Verify the current branch is `staging` before proceeding. If not on `staging`, stop and tell the user.

Follow these steps:

1. Read `packages/utils/package.json` and extract the current `version` field. It will be an RC version like `0.7.1-rc.0`. Strip the `-rc.X` suffix to get the stable release version. For example, `0.7.1-rc.0` → `0.7.1`. This is the release version `{version}`.

   **Do NOT run `changeset pre exit` or `changeset:bump` locally.** The release workflow handles exiting pre-release mode, bumping versions, and publishing.

2. Run `git log --oneline -30` to see recent history, then find the hash of the most recent commit whose tag is in format `v${version}` — this is the last published release. Call it `<last-release-hash>`.

3. Run `git log <last-release-hash>..HEAD --oneline` to get all commits since the last release.

4. Run `git diff <last-release-hash>..HEAD --name-only` to get all changed files since the last release.

5. For each changed source file (ignore `CHANGELOG.md`, `package.json` version bumps, and changeset files), run `git diff <last-release-hash>..HEAD -- <file>` to understand the actual code changes. Focus on:
   - New exports, functions, types, or modules added
   - Breaking changes (removed or renamed exports, changed signatures)
   - Bug fixes
   - Dependency changes

6. Create the directory `docs/releases/` if it doesn't exist.

7. Write a file at `docs/releases/{version}.md` with the following structure:

```markdown
# Release {version}

## Highlights

<!-- 2-3 sentence summary of the most important changes -->

## Changes

### New Features

<!-- List new features with brief descriptions. Reference the relevant source files. -->

### Bug Fixes

<!-- List bug fixes. Omit this section if there are none. -->

### Breaking Changes

<!-- List breaking changes with migration instructions. Omit this section if there are none. -->

### Dependencies

<!-- Note any dependency additions, removals, or version bumps. Omit if none. -->
```

8. Omit any section that has no entries rather than leaving it empty.

9. Keep descriptions concise but informative. Reference specific files/modules when relevant.

10. Create a new branch named `release/v{version}` from the current branch and push it:

    ```
    git checkout -b release/v{version}
    git add docs/releases/{version}.md
    git commit -m "docs: add release notes for v{version}"
    git push -u origin release/v{version}
    ```

12. Read the content of `docs/releases/{version}.md` and create a pull request using the `gh` CLI with:
    - Title: `Release v{version}`
    - Base branch: `main`
    - Body: the full content of the release notes file

    ```
    gh pr create --title "Release v{version}" --base main --body "$(cat docs/releases/{version}.md)"
    ```

13. Return the PR URL to the user.
