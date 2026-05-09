import nextPlugin from "@next/eslint-plugin-next";
import { Linter } from "eslint";
import { config as reactConfig } from "./react.js";

export const config: Linter.Config[] = [
  ...reactConfig,
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
] as const;
