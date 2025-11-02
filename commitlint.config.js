import config from "@commitlint/config-conventional";



/** @type {import("@commitlint/types").UserConfig} */

export default {
	extends: [
		"@commitlint/config-conventional",
	],
	rules: {
		"type-enum": [
			2,
			"always",
			[
				...config.rules["type-enum"][2],
				"port",
			],
		],
	},
};
