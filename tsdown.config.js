import { defineConfig } from "tsdown";

import tsconfig from "./tsconfig.json" with { type: "json" };



export default defineConfig([
	{
		clean: true,
		entry: [
			"./src/main.ts",
			"./src/index.ts",
			"./src/internal.ts",
		],
		copy: [
			"src/conf",
		],
		unbundle: true,
		outDir: "./dist",
		platform: "node",
		target: tsconfig.compilerOptions.target,
		hash: false,
		dts: true,
		minify: "dce-only",
	},
]);
