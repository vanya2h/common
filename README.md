# @vanya2h/common

Monorepo with shared utility packages used across my projects.

## Packages

| Package                                                    | Description                                                                |
| ---------------------------------------------------------- | -------------------------------------------------------------------------- |
| [`@vanya2h/eslint-config`](packages/eslint-config)         | Shared ESLint configs (base, node, react)                                  |
| [`@vanya2h/prettier-config`](packages/prettier-config)     | Shared Prettier config                                                     |
| [`@vanya2h/typescript-config`](packages/typescript-config) | Shared TypeScript configs (base, node, lib, react)                         |
| [`@vanya2h/utils`](packages/utils)                         | Common TypeScript utilities and type helpers (incl. `jsonSerializer`)      |
| [`@vanya2h/utils-rxjs`](packages/utils-rxjs)               | RxJS helpers: `batcher`, `createCache`, `persistBehaviorSubject`, `wrapped`|
| [`@vanya2h/utils-rxjs-react`](packages/utils-rxjs-react)   | React bindings for RxJS: `useObservable`, `usePending`, `<Pending>`        |
| [`@vanya2h/store`](packages/store)                         | Reactive global store with schema-keyed caching on top of RxJS             |
| [`@vanya2h/async-actions`](packages/async-actions)         | Composable async action pipelines with status tracking and retries         |
| [`@vanya2h/utils-wagmi`](packages/utils-wagmi)             | Wagmi/viem utilities for accounts, public clients and wallet clients       |
| [`@vanya2h/form-factory`](packages/form-factory)           | Headless React form factory built on react-hook-form, Zod, and RxJS       |

## Agent Skills

This repo ships an [`integrate-configs`](skills/integrate-configs/SKILL.md) Claude Code skill that installs the ESLint, Prettier, and TypeScript configs into any project automatically.

### Install via `npx skills` (recommended)

```sh
npx skills add vanya2h/common -a claude-code
```

Then in any project:

```
/integrate-configs react
```

Valid types: `base` · `node` · `react` · `lib`

### Install via Claude plugin marketplace

Add this repo as a marketplace source once:

```
/plugin marketplace add vanya2h/common
```

Then install the skill:

```
/plugin install integrate-configs@vanya2h-common
```

Then invoke with `/integrate-configs [type]`.

## Setup

```sh
corepack enable
pnpm install
```

## Release Process

Releases use [Changesets](https://github.com/changesets/changesets) in pre-release `rc` mode. All packages version independently — there is no fixed version group.

### Overview

```
feature branch  →  PR to develop  (via /pr)
   develop      →  merged to staging  →  RC published to npm (auto)
   staging      →  /release-docs  →  PR to main  →  stable published to npm (auto)
```

### 1. Develop on a feature branch

Make changes on a feature branch off `develop`. When ready to commit, use the `/commit` command — it analyzes your changes, generates an appropriate changeset, and commits everything together.

Open a PR to `develop` using the `/pr` command from your feature branch, then merge it.

### 2. Trigger an RC release

When ready to cut a release candidate, merge `develop` into `staging`:

```sh
git checkout staging
git merge develop
git push
```

The `rc-release.yml` workflow runs automatically and:

1. Enters pre-release mode if not already active (`changeset pre enter rc`)
2. Runs `changeset version` — bumps affected packages to `X.Y.Z-rc.N`
3. Publishes to npm
4. Pushes per-package git tags (e.g. `@vanya2h/eslint-config@0.7.0-rc.0`)
5. Syncs the version bump commit back to `develop`

For follow-up fixes, repeat step 1 on a new feature branch and merge to `develop`, then merge `develop` to `staging` again. Each push to `staging` increments the RC counter (`rc.0`, `rc.1`, …).

### 3. Generate release notes and open the stable release PR

Once the RC is verified, run from `staging`:

```
/release-docs
```

This creates `docs/releases/YYYY-MM-DD.md` and opens a PR against `main` with the release notes as the body.

### 4. Publish the stable release

Merge the release PR into `main`. The `release.yml` workflow runs automatically and:

1. Exits pre-release mode (`changeset pre exit`)
2. Runs `changeset version` — strips the `-rc.N` suffix, producing `X.Y.Z`
3. Publishes to npm
4. Pushes per-package git tags (e.g. `@vanya2h/eslint-config@0.7.0`)
5. Syncs the version bump commit back to `staging` and `develop`

### Reference

| Command | Purpose |
| ------- | ------- |
| `/commit` | Commit changes with an auto-generated changeset |
| `/pr` | Open a PR to `develop` |
| `/release-docs` | Generate release notes and open a PR to `main` |
| `corepack pnpm build` | Build all packages |
| `corepack pnpm test` | Run all tests |
| `corepack pnpm lint` | Lint all packages |
| `corepack pnpm check-types` | Type-check all packages |

Release notes live in [`docs/releases/`](docs/releases/).
