# `@vanya2h/eslint-config`

Shareable [ESLint](https://eslint.org) flat configs for TypeScript projects.

## Installation

```sh
pnpm add -D eslint @vanya2h/eslint-config
```

### With Prettier integration (optional)

```sh
pnpm add -D prettier eslint-plugin-prettier eslint-config-prettier @vanya2h/prettier-config
```

## Configs

### `base`

General-purpose TypeScript config. All other configs extend this one.

| Plugin                             | Purpose                                                                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `@eslint/js`                       | Core JS recommended rules                                                                                                |
| `typescript-eslint`                | TypeScript-aware rules                                                                                                   |
| `eslint-plugin-simple-import-sort` | Enforces consistent import ordering                                                                                      |
| `eslint-plugin-turbo`              | Flags undeclared Turborepo env vars                                                                                      |
| `eslint-plugin-prettier`           | Runs Prettier as an ESLint rule — only active when `eslint-plugin-prettier` and `@vanya2h/prettier-config` are installed |

```js
// eslint.config.js
import { config } from "@vanya2h/eslint-config/base";

export default [
  ...config,
  {
    ignores: ["dist/**"],
  },
];
```

### `node`

Extends `base` with Node.js-specific rules via `eslint-plugin-n`.

| Plugin            | Purpose                                           |
| ----------------- | ------------------------------------------------- |
| `eslint-plugin-n` | Node.js best practices, disallows unsafe path ops |

```js
// eslint.config.js
import { config } from "@vanya2h/eslint-config/node";

export default [
  ...config,
  {
    ignores: ["dist/**"],
  },
];
```

### `react`

Extends `base` with React and browser globals.

| Plugin                      | Purpose                                 |
| --------------------------- | --------------------------------------- |
| `eslint-plugin-react`       | React rules, auto-detects React version |
| `eslint-plugin-react-hooks` | Enforces rules of hooks                 |

```js
// eslint.config.js
import { config } from "@vanya2h/eslint-config/react";

export default [
  ...config,
  {
    ignores: ["dist/**"],
  },
];
```
