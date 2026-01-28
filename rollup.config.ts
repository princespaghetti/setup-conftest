// See: https://rollupjs.org/introduction/
import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

const config = {
  input: "src/main.ts",
  output: {
    file: "dist/index.js",
    format: "es",
    sourcemap: true,
  },
  onwarn(warning, defaultHandler) {
    // Ignore circular dependency warnings from dependencies
    if (
      warning.code === "CIRCULAR_DEPENDENCY" &&
      warning.ids?.every((id) => id.includes("node_modules"))
    ) {
      return;
    }
    // Ignore "this is undefined" warnings from dependencies (TypeScript's __awaiter helper)
    if (
      warning.code === "THIS_IS_UNDEFINED" &&
      warning.id?.includes("node_modules")
    ) {
      return;
    }
    defaultHandler(warning);
  },
  plugins: [
    typescript(),
    nodeResolve({ preferBuiltins: true, exportConditions: ["node"] }),
    commonjs(),
  ],
};

export default config;
