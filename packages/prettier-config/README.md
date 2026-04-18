# `@vanya2h/prettier-config`

A standard [Prettier](https://prettier.io) configuration.

## Installation

```sh
pnpm add -D prettier @vanya2h/prettier-config
```

## Usage

### Via `prettier.config.js` (recommended)

```js
export { default } from "@vanya2h/prettier-config";
```

Use this form when you need Prettier to resolve the config correctly (e.g. in pnpm workspaces, or with the VS Code Prettier extension).

### Via `package.json`

```json
{
  "prettier": "@vanya2h/prettier-config"
}
```

### Extending with overrides

```js
import config from "@vanya2h/prettier-config";

export default {
  ...config,
  printWidth: 80,
};
```

## Config

| Option          | Value   |
| --------------- | ------- |
| `semi`          | `true`  |
| `trailingComma` | `"all"` |
| `singleQuote`   | `false` |
| `printWidth`    | `120`   |
| `tabWidth`      | `2`     |
