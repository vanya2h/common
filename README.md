# @vanya2h/common

Monorepo with shared utility packages used across my projects.

## Packages

| Package                                                    | Description                                        |
| ---------------------------------------------------------- | -------------------------------------------------- |
| [`@vanya2h/eslint-config`](packages/eslint-config)         | Shared ESLint configs (base, node, react)          |
| [`@vanya2h/prettier-config`](packages/prettier-config)     | Shared Prettier config                             |
| [`@vanya2h/typescript-config`](packages/typescript-config) | Shared TypeScript configs (base, node, lib, react) |
| [`@vanya2h/utils`](packages/utils)                         | Common TypeScript utilities and type helpers       |

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
