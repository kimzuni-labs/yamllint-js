/** @type {import("./src").UserConfig} */

export default {
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
};
