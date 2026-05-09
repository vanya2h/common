---
name: integrate-configs
description: Integrate @vanya2h/eslint-config, @vanya2h/prettier-config, @vanya2h/typescript-config, and sort-package-json into the current project. Detects existing configs and asks before replacing them.
argument-hint: "[base|node|react|lib]"
allowed-tools: Read Glob Grep Bash
---

Integrate `@vanya2h/eslint-config`, `@vanya2h/prettier-config`, `@vanya2h/typescript-config`, and `sort-package-json` into the current project.

## Step 1 — Determine the project type

If the user passed an argument, use it directly. Valid values: `base`, `node`, `react`, `lib`.

If no argument was given, ask the user:

> What type of project is this?
>
> 1. `base` — generic TypeScript package
> 2. `node` — Node.js app or server
> 3. `react` — React / browser app
> 4. `lib` — TypeScript library (builds to ESNext/Bundler)

Wait for the answer before continuing.

## Step 2 — Detect the package manager

Check for lock files in the project root:

- `pnpm-lock.yaml` → use `pnpm`
- `yarn.lock` → use `yarn`
- `package-lock.json` → use `npm`
- If none found, default to `npm`

## Step 3 — Detect existing configs and ask before replacing

Check for these files in the project root:

**ESLint:**

- `eslint.config.js`, `eslint.config.mjs`, `eslint.config.cjs`
- `.eslintrc`, `.eslintrc.js`, `.eslintrc.cjs`, `.eslintrc.json`, `.eslintrc.yaml`, `.eslintrc.yml`

**Prettier:**

- `prettier.config.js`, `prettier.config.mjs`, `prettier.config.cjs`
- `.prettierrc`, `.prettierrc.js`, `.prettierrc.cjs`, `.prettierrc.json`, `.prettierrc.yaml`, `.prettierrc.yml`
- `"prettier"` key in `package.json`

**TypeScript:**

- `tsconfig.json` (check if it already extends `@vanya2h/typescript-config`)

For any config file found that is NOT already using `@vanya2h/*`, ask the user:

> Found existing `<filename>`. Replace it with the shared config? (yes/no)

If the user says **no** for a config, skip that config entirely — do not install or write it.

## Step 4 — Install packages

Based on which configs the user approved, install only the needed packages. Always install `sort-package-json` regardless of which configs are selected.

| Config approved   | Command                                                |
| ----------------- | ------------------------------------------------------ |
| ESLint            | `<pm> add -D @vanya2h/eslint-config eslint typescript` |
| Prettier          | `<pm> add -D @vanya2h/prettier-config prettier`        |
| TypeScript        | `<pm> add -D @vanya2h/typescript-config typescript`    |
| Always            | `<pm> add -D sort-package-json`                        |

Where `<pm>` is the package manager detected in Step 2. For `pnpm` use `pnpm add -D`, for `yarn` use `yarn add -D`, for `npm` use `npm install --save-dev`.

Run all approved installs. Show the commands before running them.

## Step 5 — Write config files

### ESLint (if approved)

Remove any old ESLint config files found in Step 3, then create `eslint.config.mjs`:

**base:**

```js
import { config } from "@vanya2h/eslint-config/base";

export default [...config];
```

**node:**

```js
import { config } from "@vanya2h/eslint-config/node";

export default [...config];
```

**react:**

```js
import { config } from "@vanya2h/eslint-config/react";

export default [...config];
```

### Prettier (if approved)

Remove any old Prettier config files found in Step 3.

Also remove the `"prettier"` key from `package.json` if it exists.

Then add to `package.json`:

```json
"prettier": "@vanya2h/prettier-config"
```

### TypeScript (if approved)

Check if `tsconfig.json` exists:

- If it exists and user approved replacement, update the `"extends"` field.
- If it does not exist, create it.

**base tsconfig:**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@vanya2h/typescript-config/base"
}
```

**node tsconfig:**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@vanya2h/typescript-config/node",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src"]
}
```

**react tsconfig:**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@vanya2h/typescript-config/react",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src"]
}
```

**lib tsconfig:**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@vanya2h/typescript-config/lib",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src"]
}
```

When updating an existing `tsconfig.json`, preserve all other fields — only add/replace `"extends"`. Do not clobber `compilerOptions` or `include` that the user already has.

## Step 6 — Add scripts

### sort-pkg script

Always add `sort-pkg` to `package.json` without asking, mirroring the root pattern exactly.

For a **single-package project**:

```json
"sort-pkg": "sort-package-json package.json"
```

For a **monorepo** (has `pnpm-workspace.yaml`, `lerna.json`, or a `workspaces` field with `packages/*`):

```json
"sort-pkg": "sort-package-json \"package.json\" \"packages/*/package.json\""
```

If `sort-pkg` already exists, leave it unchanged and note it in the summary.

### lint scripts

Check whether `package.json` already has a `"lint"` script. If it does not, add the following without asking.

**Single-package project:**

```json
"lint": "sort-package-json --check package.json && eslint ./",
"lint:fix": "sort-package-json package.json && eslint ./ --fix"
```

**Turborepo monorepo** (`turbo.json` present at root) — root `package.json` delegates to turbo, which runs each package's own scripts:

```json
"lint": "sort-package-json --check \"package.json\" \"packages/*/package.json\" && turbo lint",
"lint:fix": "sort-package-json \"package.json\" \"packages/*/package.json\" && turbo lint:fix"
```

Each individual package's `package.json` gets the per-package scripts directly (not via turbo):

```json
"lint": "eslint ./",
"lint:fix": "eslint ./ --fix"
```

Also add `lint:fix` to `turbo.json` if it is not already listed under `tasks`:

```json
"lint:fix": {
  "dependsOn": ["^lint:fix"]
}
```

**Non-turbo monorepo** — use the package manager's workspace `run` command to delegate to each package:

- pnpm: `"lint:fix": "sort-package-json \"package.json\" \"packages/*/package.json\" && pnpm -r run lint:fix"`
- yarn: `"lint:fix": "sort-package-json \"package.json\" \"packages/*/package.json\" && yarn workspaces run lint:fix"`
- npm: `"lint:fix": "sort-package-json \"package.json\" \"packages/*/package.json\" && npm run lint:fix --workspaces"`

Each individual package still gets its own `lint` / `lint:fix` eslint scripts as above.

If a `"lint"` script already exists and looks unrelated to ESLint, leave it and mention it in the summary.

## Step 7 — Update README.md

If a `README.md` exists in the target package (or workspace root for monorepos), find the section that documents scripts or commands — typically a heading like `## Scripts`, `## Commands`, `## Development`, or similar. Add entries for each script that was added in Step 6 and is not already documented:

| Script       | Description                                                                 |
| ------------ | --------------------------------------------------------------------------- |
| `sort-pkg`   | Sort `package.json` field order using `sort-package-json`.                  |
| `lint`       | Check `package.json` field order and lint source files with ESLint.         |
| `lint:fix`   | Fix `package.json` field order and auto-fix ESLint issues.                  |

If no scripts/commands section exists, append one at the end of the file:

````markdown
## Scripts

| Script       | Description                                                                 |
| ------------ | --------------------------------------------------------------------------- |
| `sort-pkg`   | Sort `package.json` field order using `sort-package-json`.                  |
| `lint`       | Check `package.json` field order and lint source files with ESLint.         |
| `lint:fix`   | Fix `package.json` field order and auto-fix ESLint issues.                  |
````

If no `README.md` exists, skip this step entirely — do not create one.

## Step 8 — Summary

Print a short summary of what was installed and what files were created or skipped.
