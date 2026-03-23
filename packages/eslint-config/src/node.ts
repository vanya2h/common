import { Linter } from "eslint";
import pluginN from "eslint-plugin-n";
import { config as baseConfig } from "./base.js";

export const config: Linter.Config[] = [
  ...baseConfig,
  pluginN.configs["flat/recommended"],
  {
    rules: {
      // we're off this because should rely on typescript's rules
      "n/no-missing-import": "off",
      "n/prefer-promises/fs": "error",
      "n/no-path-concat": "error",
    },
  },
] as const;
