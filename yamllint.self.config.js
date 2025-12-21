import { defineConfig } from "./src";



export default defineConfig({
	extends: "default",
	rules: {
		"line-length": [
			"error",
			{
				max: 120,
			},
		],
		truthy: [
			"error",
			{
				checkKeys: false,
			},
		],
	},
});
