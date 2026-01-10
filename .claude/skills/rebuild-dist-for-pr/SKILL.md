---
name: rebuild-dist-for-pr
description: Rebuilds the dist folder for a GitHub PR (typically dependabot PRs). Use when asked to rebuild dist for a PR, update dist for dependabot, or prepare a PR for merge by rebuilding.
---

# Rebuild Dist for PR

Automates the process of checking out a PR branch, rebuilding the dist folder, and preparing a commit.

## Workflow

**Required input**: PR number (e.g., `42`)

### Step 1: Fetch and checkout the PR branch

```bash
gh pr checkout <PR_NUMBER>
```

### Step 2: Install dependencies

```bash
npm install
```

### Step 3: Build and package

```bash
npm run build && npm run package
```

### Step 4: Check if dist changed

```bash
git status --porcelain dist/
```

If no output, dist is unchanged—inform the user and stop.

### Step 5: Stage dist changes

```bash
git add dist/
```

### Step 6: Show staged changes and pause

Show the user what will be committed:

```bash
git diff --cached --stat
```

**STOP HERE** and ask the user for confirmation before pushing.

### Step 7: Commit and push (after user confirms)

```bash
git commit -m "rebuild dist"
git push
```

## Error handling

- If `gh pr checkout` fails, verify the PR number and that `gh` is authenticated
- If `npm install` fails, check for lockfile issues
- If build fails, show the error output to the user
