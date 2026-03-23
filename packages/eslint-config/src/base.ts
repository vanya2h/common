import jsEslint from "@eslint/js";
import { Linter } from "eslint";
import prettierConfig from "eslint-plugin-prettier/recommended";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import turboPlugin from "eslint-plugin-turbo";
import tsEslint from "typescript-eslint";

export const config: Linter.Config[] = [
  jsEslint.configs.recommended,
  prettierConfig,
  ...tsEslint.configs.recommended,
  turboPlugin.configs!["flat/recommended"] as Linter.Config,
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "turbo/no-undeclared-env-vars": "warn",
      "prettier/prettier": "warn",
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            [
              // Node.js built-in modules
              "^node:",
              // External packages (excluding @evergonlabs)
              "^(?!@evergonlabs/)@?\\w",
              // Internal @evergonlabs monorepo packages
              "^@evergonlabs/",
              // Relative imports
              "^\\.\\.(?!/?$)",
              "^\\.\\./?$",
              "^\\./(?=.*/)(?!/?$)",
              "^\\.(?!/?$)",
              "^\\./?$",
              // Side-effect imports
              "^\\u0000",
            ],
          ],
        },
      ],
      "simple-import-sort/exports": "error",
    },
  },
] as const;
