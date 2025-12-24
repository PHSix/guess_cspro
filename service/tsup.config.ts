import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node18",
  outDir: "dist",
  clean: true,
  dts: false,
  sourcemap: true,
  splitting: false,
  minify: false,
  // Bundle workspace dependencies (@guess-cspro/shared) into output
  // noExternal: true means bundle everything except node_modules built-ins
  noExternal: ["@guess-cspro/shared"],
  // Handle TypeScript files directly
  esbuildOptions(options) {
    options.conditions = ["node"];
  },
});
