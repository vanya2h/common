import path from "node:path";
import { defineConfig } from "tsup";
import { config } from "./config.js";

export default defineConfig({
  format: ["cjs", "esm"],
  dts: true,
  outDir: config.distDir,
  entry: {
    common: path.join(config.srcDir, "common/index.ts"),
    typeUtils: path.join(config.srcDir, "typeUtils/index.ts"),
    zod: path.join(config.srcDir, "zod/index.ts"),
    models: path.join(config.srcDir, "models/index.ts"),
    index: path.join(config.srcDir, "index.ts"),
  },
});
