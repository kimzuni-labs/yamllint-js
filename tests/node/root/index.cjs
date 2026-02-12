const { defineConfig } = require("yamllint-js");

if (typeof defineConfig === "undefined") {
	process.exitCode = 1;
}
