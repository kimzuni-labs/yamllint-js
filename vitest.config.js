import { defineConfig } from "vitest/config";



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
