import { defineConfig } from "tsdown";

import tsconfig from "./tsconfig.json" with { type: "json" };



export default defineConfig([
	{
		clean: true,
		entry: [
			"./src/cli.ts",
			"./src/index.ts",
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
	},
]);
