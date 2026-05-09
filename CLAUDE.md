# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Always install from the repo root with corepack — never run `pnpm install` per-package:

```sh
corepack pnpm install
```

Turbo orchestrates builds across the workspace; per-task scripts live on each package and are invoked through these root scripts:

- `corepack pnpm build` — `tsup` build for every package, respecting `^build` dep order
- `corepack pnpm test` — runs `vitest run --passWithNoTests` per package; depends on `build` (so tests run against compiled `dist/`)
- `corepack pnpm lint` / `lint:fix` — eslint across the workspace
- `corepack pnpm check-types` — `tsc -b --noEmit` per package

To work on a single package, `cd packages/<pkg>` and run its scripts directly (`pnpm dev` for `tsup --watch`, `pnpm test`, `pnpm lint`, `pnpm check-types`). To run a single vitest file, use `pnpm vitest run path/to/file.test.ts` from inside the package.

Releases use Changesets in **pre-release `rc` mode** (see `.changeset/pre.json`). Add a changeset with `corepack pnpm changeset`, version with `changeset:version`, publish with `changeset:publish`.

## Architecture

Monorepo of independently-published `@vanya2h/*` libraries plus one Claude Code skill. Workspace declared in `pnpm-workspace.yaml` (`packages/*`); turbo is the task runner; node `>=25` and pnpm `10.32.1` are required (enforced via `engines` and `packageManager`).

### Package layout and dependency graph

Internal `workspace:*` deps form this graph — keep it in mind when changing public APIs:

- `utils` — base utilities (`common`, `typeUtils`, `zod`, `models`); the only multi-entry package (`tsup` emits one bundle per subpath, mirrored in `exports`).
- `utils-rxjs` → depends on `utils`. RxJS helpers: `batcher`, `createCache`, `persistBehaviorSubject` (with localStorage / stub-transport persistors), `wrapped` status helpers.
- `store` → depends on `utils` + `utils-rxjs`. Reactive global store with schema-keyed caching (`createGlobalStore`, `createStoreDescriptor`, `fromFetcher`).
- `async-actions` — standalone. Composable async action pipelines (`ActionSingle`, `ActionsSet`) on top of `tiny-typed-emitter` and `immutable.List`.
- `utils-wagmi` → depends on `utils`. Wagmi/viem account + client helpers.
- `eslint-config`, `prettier-config`, `typescript-config` — shared dev-time configs. `eslint-config` exports `base` / `node` / `react` subpaths; the root `eslint.config.js` consumes the `node` config.

When adding workspace deps between these, mirror the existing pattern: `"@vanya2h/x": "workspace:*"` in `dependencies`, plus `@vanya2h/eslint-config` and `@vanya2h/typescript-config` in `devDependencies`.

### Build conventions (every published package)

Each package follows the same shape — when scaffolding a new one, copy from `packages/utils-rxjs/`:

- `tsup.config.ts` emits `cjs` + `esm` + `d.ts` to `dist/`, with entries derived from a local `config.ts` (`srcDir`, `distDir`).
- `package.json` `exports` declares `import` / `types` / `default` (cjs) for each entrypoint; `files: ["dist", "package.json"]`.
- `prepublishOnly` runs `pnpm run build`; `clean` is `rimraf ./dist`.
- Tests are colocated (`src/**/index.test.ts`) and run via `vitest run --passWithNoTests` against the source (vitest doesn't need the build).

Note `turbo.json` makes `test` depend on `build` — turbo will rebuild upstream packages before testing a downstream one. The root `vitest.workspace.js` is **stale** (points to non-existent `code/` paths); per-package `vitest.config.ts` is what's actually used.

### Changesets

`.changeset/config.json` declares a **fixed** version group: `eslint-config`, `prettier-config`, `typescript-config`, `utils`, `async-actions`, `store` all bump together. `utils-rxjs` and `utils-wagmi` are versioned independently. `baseBranch` is `main`, but PRs typically target `develop` (see the `/pr` skill).

### Shipped Claude Code skill

`skills/integrate-configs/SKILL.md` is published two ways: via `npx skills add vanya2h/common -a claude-code` and via the Claude plugin marketplace (`/plugin marketplace add vanya2h/common`). It installs the three shared configs into a target project. `.claude/skills/integrate-configs` is a symlink to `skills/integrate-configs` — edit only the canonical copy.
