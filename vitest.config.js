import { spawnSync } from "node:child_process";
import { defineConfig } from "vitest/config";



spawnSync("npm", ["run", "build:nodts"]);

export default defineConfig({
	test: {
		coverage: {
			exclude: [
				"**/tests/**",
				"package.json",
			],
			provider: "v8",
			reportsDirectory: "./coverage",
			reporter: [
				"text",
				"lcov",
				"html",
			],
		},
	},
});
