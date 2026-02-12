/*!
 * Copyright (C) 2016 Adrien Vergé
 * Copyright (C) 2025 kimzuni
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/* eslint-disable no-console */

import type { Readable } from "node:stream";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import type { AG } from "./types";
import { APP, LEVELS, PROBLEM_LEVELS } from "./constants";
import { getHomedir } from "./utils";
import { YamlLintConfig, loadConfigFile } from "./config";
import * as linter from "./linter";



type Problems = ReturnType<typeof linter.run>;

const colors = {
	reset: 0,
	dim: 2,
	underline: 4,
	red: 31,
	yellow: 33,
};



export async function* findFilesRecursively(items: string[], conf: YamlLintConfig): AG<string> {
	for (const item of items) {
		const isDirectory = await fs.stat(item)
			.then(x => x.isDirectory())
			.catch(() => false);

		if (isDirectory) {
			if (path.basename(item) === "node_modules") continue;

			const dirents = await fs.readdir(item, { withFileTypes: true, recursive: false, encoding: "utf-8" });

			const directories = [];
			for (const dirent of dirents) {
				const filepath = path.join(dirent.parentPath, dirent.name);
				if (dirent.isDirectory()) {
					directories.push(filepath);
				} else if (conf.isYamlFile(filepath) && !conf.isFileIgnored(filepath)) {
					yield filepath;
				}
			}

			yield* findFilesRecursively(directories, conf);
		} else {
			yield item;
		}
	}
}



export function supportsColor() {
	const supportedPlatform = !(
		os.platform() === "win32"
		&& !(
			process.env.ANSICON !== undefined
			|| process.env.TERM === "ANSI"
		)
	);
	return supportedPlatform && process.stdout.isTTY;
}



export const Format = {
	parsable(problem, filename) {
		return `${filename}:${problem.line}:${problem.column}: [${problem.level}] ${problem.message}`;
	},
	standard(problem) {
		let line = `  ${problem.line}:${problem.column}`;
		line += " ".repeat(Math.max(12 - line.length, 0));
		line += problem.level;
		line += " ".repeat(Math.max(21 - line.length, 0));
		line += problem.desc;
		if (problem.rule) {
			line += `  (${problem.rule})`;
		}
		return line;
	},
	colored(problem) {
		const color = problem.level === "error" ? "red" : "yellow";
		let line = `  \x1b[${colors.dim}m${problem.line}:${problem.column}\x1b[${colors.reset}m`;
		line += " ".repeat(Math.max(20 - line.length, 0));
		line += `\x1b[${colors[color]}m${problem.level}\x1b[${colors.reset}m`;
		line += " ".repeat(Math.max(38 - line.length, 0));
		line += problem.desc;
		if (problem.rule) {
			line += `  \x1b[${colors.dim}m(${problem.rule})\x1b[${colors.reset}m`;
		}
		return line;
	},
	github(problem, filename) {
		let line = `::${problem.level} file=${filename},line=${problem.line},col=${problem.column}::${problem.line}:${problem.column} `;
		if (problem.rule) {
			line += `[${problem.rule}] `;
		}
		line += problem.desc;
		return line;
	},
} satisfies Record<string, (problem: linter.LintProblem, filename: string) => string>;

type FormatType = keyof typeof Format | "auto";
const formatTypes = [...Object.keys(Format), "auto"];



export async function showProblems(
	problems: Problems,
	file: string,
	argsFormat: FormatType = "auto",
	noWarn = false,
) {
	let maxLevel = 0;
	let first = true;

	argsFormat = formatTypes.includes(argsFormat) ? argsFormat : "auto";
	if (argsFormat === "auto") {
		if (process.env.GITHUB_ACTIONS !== undefined && process.env.GITHUB_WORKFLOW !== undefined) {
			argsFormat = "github";
		} else if (supportsColor()) {
			argsFormat = "colored";
		}
	}

	for await (const problem of problems) {
		maxLevel = Math.max(maxLevel, LEVELS.indexOf(problem.level));
		if (noWarn && problem.level !== "error") {
			continue;
		}

		if (argsFormat === "parsable") {
			console.log(Format.parsable(problem, file));
		} else if (argsFormat === "github") {
			if (first) {
				console.log(`::group::${file}`);
				first = false;
			}
			console.log(Format.github(problem, file));
		} else if (argsFormat === "colored") {
			if (first) {
				console.log(`\x1b[${colors.underline}m${file}\x1b[${colors.reset}m`);
				first = false;
			}
			console.log(Format.colored(problem));
		} else {
			if (first) {
				console.log(file);
				first = false;
			}
			console.log(Format.standard(problem));
		}
	}

	if (!first && argsFormat === "github") {
		console.log("::endgroup::");
	} else if (!first && argsFormat !== "parsable") {
		console.log();
	}

	return maxLevel;
}



export const parseArgs = (argv: string[]) => {
	const isStdin = argv.includes("-");
	return yargs(argv)
		.scriptName("yamllint")
		.version(APP.VERSION)
		.command("$0 [FILE_OR_DIR...]", APP.DESCRIPTION)
		.usage([
			"usage: yamllint [-h] [-] [-c CONFIG_FILE | -d CONFIG_DATA] [--list-files] [-f {parsable,standard,colored,github,auto}] [-s] [--no-warnings] [-v] [FILE_OR_DIR ...]",
			"",
			APP.DESCRIPTION,
		].join("\n"))

		.positional("FILE_OR_DIR", {
			description: "files to check",
			type: "string",
			array: true,
		})
		.options({
			help: {
				alias: "h",
				describe: "show this help message and exit",
			},
			"": {
				alias: "",
				describe: "read from standard input",
				type: "string",
			},
			"config-file": {
				alias: "c",
				describe: "path to a custom configuration",
				type: "string",
			},
			"config-data": {
				alias: "d",
				describe: "custom configuration (as YAML source)",
				type: "string",
			},
			"list-files": {
				describe: "list files to lint and exit",
				type: "boolean",
			},
			format: {
				alias: "f",
				describe: "format for parsing output",
				choices: [...formatTypes, "auto"],
			},
			strict: {
				alias: "s",
				describe: "return non-zero exit code on warnings as well as errors",
				type: "boolean",
			},
			"no-warnings": {
				describe: "output only error level problems",
				type: "boolean",
			},
		})
		.alias("v", "version")
		.describe("version", "show program's version number and exit")

		.parserConfiguration({
			"nargs-eats-options": true,
			"boolean-negation": false,
		})
		.demandCommand()
		.strictCommands()
		.conflicts("config-file", "config-data")
		.strict()
		.wrap(null)
		.check((args) => {
			if (!args.help) {
				if (!isStdin && !args.FILE_OR_DIR?.length) {
					throw new Error("one of the arguments FILE_OR_DIR - is required");
				} else if (isStdin && args.FILE_OR_DIR?.length) {
					throw new Error("argument -: not allowed with argument FILE_OR_DIR");
				}
			}
			return true;
		})
		.exitProcess(false)
		.parse();
};



/**
 * Run yamllint and display problems, then set `process.exitCode`
 *
 * @param argv `hideBin(process.argv)`
 * @param stdin `process.stdin`
 */
export async function run(argv = hideBin(process.argv), stdin: Readable = process.stdin) {
	const isStdin = argv.includes("-");
	let args: Awaited<ReturnType<typeof parseArgs>>;
	try {
		args = await parseArgs(argv);
	} catch {
		process.exitCode = -1;
		return;
	}

	let userGlobalConfig;
	if (process.env.YAMLLINT_CONFIG_FILE !== undefined) {
		userGlobalConfig = process.env.YAMLLINT_CONFIG_FILE;

	// User-global config is supposed to be in ~/.config/yamllint/config
	} else if (process.env.XDG_CONFIG_HOME !== undefined) {
		userGlobalConfig = path.join(process.env.XDG_CONFIG_HOME, "yamllint", "config");
	} else {
		userGlobalConfig = path.join(getHomedir(), ".config", "yamllint", "config");
	}

	function getValue<
		T extends "string" | "array" | "boolean" = "string",
	>(
		value: unknown,
		type?: T,
	): (
		T extends "boolean"
			? boolean
			: T extends "array"
				? string[]
				: string | undefined
	);
	function getValue(value: unknown, type: "string" | "array" | "boolean" = "string") {
		if (type === "boolean") return !!value;

		const values = Array.isArray(value) ? value : [value];
		const arr = [];
		for (const curr of values) {
			if (typeof curr === "string") arr.push(curr);
		}
		return type === "array" ? arr : arr[0];
	}

	let conf: YamlLintConfig;
	let configData = getValue(args.configData);
	const configFile = getValue(args.configFile);
	try {
		if (configData !== undefined) {
			if (configData !== "" && !configData.includes(":")) {
				configData = `extends: ${configData}`;
			}
			conf = await YamlLintConfig.init({ content: configData });
		} else if (configFile !== undefined) {
			conf = await YamlLintConfig.init({ file: configFile });
		} else {
			const load = await loadConfigFile();
			if (load !== null) {
				conf = await YamlLintConfig.init({ _data: load.config });
			} else if (
				await fs.stat(userGlobalConfig)
					.then(x => x.isFile())
					.catch(() => false)
			) {
				conf = await YamlLintConfig.init({ file: userGlobalConfig });
			} else {
				conf = await YamlLintConfig.init({ content: "extends: default" });
			}
		}
	} catch (e) {
		console.error(String(e));
		process.exitCode = -1;
		return;
	}

	const files = getValue(args.FILE_OR_DIR, "array");
	const fileGen = findFilesRecursively(files, conf);
	const listFiles = getValue(args.listFiles, "boolean");
	if (listFiles) {
		for await (const file of fileGen) {
			if (!conf.isFileIgnored(file)) {
				console.log(file);
			}
		}
		process.exitCode = 0;
		return;
	}

	let maxLevel = 0;
	const format = getValue(args.format, "string") as FormatType;
	const noWarnings = getValue(args.noWarnings, "boolean");
	if (files.length) {
		for await (const file of fileGen) {
			const filepath = file.startsWith("./") ? file.slice(2) : file;
			let problems: Problems;
			try {
				const buffer = await fs.readFile(file);
				problems = linter.run(buffer, conf, filepath);
			} catch (e) {
				console.error(String(e));
				process.exitCode = -1;
				return;
			}
			const probLevel = await showProblems(problems, file, format, noWarnings);
			maxLevel = Math.max(maxLevel, probLevel);
		}
	}

	// read yaml from stdin
	if (isStdin) {
		let problems: Problems;
		try {
			/*
			 * The .buffer part makes sure that we get the raw bytes. We need to
			 * get the raw bytes so that we can autodetect the character
			 * encoding.
			 */
			problems = linter.run(stdin, conf);
			const probLevel = await showProblems(problems, "stdin", format, noWarnings);
			maxLevel = Math.max(maxLevel, probLevel);
		} catch (e) {
			console.error(String(e));
			process.exitCode = -1;
			return;
		}
	}

	let exitCode;
	if (maxLevel === PROBLEM_LEVELS.error) {
		exitCode = 1;
	} else if (maxLevel === PROBLEM_LEVELS.warning) {
		exitCode = args.strict !== true ? 0 : 2;
	} else {
		exitCode = 0;
	}
	process.exitCode = exitCode;
}
