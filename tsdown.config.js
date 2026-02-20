import { defineConfig } from "tsdown";

import tsconfig from "./tsconfig.json" with { type: "json" };



/** @type {import("tsdown").UserConfig} */

const config = {
	unbundle: true,
	outDir: "./dist",
	platform: "node",
	target: tsconfig.compilerOptions.target,
	hash: false,
	dts: false,
	minify: "dce-only",
};

export default defineConfig([
	{
		...config,
		clean: true,
		entry: [
			"./src/index.ts",
			"./src/internal.ts",
		],
		copy: [
			"src/conf",
		],
		format: "cjs",
	},
	{
		...config,
		entry: [
			"./src/main.ts",
			"./src/index.ts",
			"./src/internal.ts",
		],
		format: "esm",
	},
]);
