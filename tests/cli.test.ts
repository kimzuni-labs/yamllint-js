/*!
 * Copyright (C) 2016 Adrien Vergé
 * Copyright (C) 2023–2025 Jason Yundt
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

import { vi, describe, test, expect, beforeAll, afterAll } from "vitest";
import { Readable } from "node:stream";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import glob from "fast-glob";

import { APP } from "../src/constants";
import * as cli from "../src/cli";
import { YamlLintConfig } from "../src/config";
import { splitlines } from "../src/utils";

import {
	buildTempWorkspace,
	tempWorkspace,
	tempWorkspaceWithFilesInManyCodecs,
	runContext,
	withTTYWorkspace,
	noTTYWorkspace,
	type RunContextData,
	type BuildTempWorkspaceReturnType,
} from "./common";



type CheckContextData = [
	returnCode: RegExp | RunContextData["returncode"],
	stdout: RegExp | RunContextData["stdout"],
	stderr: RegExp | RunContextData["stderr"],
];
const checkContext = (
	ctx: RunContextData,
	data: CheckContextData,
	{
		trim = true,
	}: {
		trim?: boolean;
	} = {},
) => {
	// TypeError: Cannot set property stdin of #<process> which has only a getter
	if (ctx.returncode === null) return;

	if (trim) {
		ctx.stdout = ctx.stdout.trim();
		ctx.stderr = ctx.stderr.trim();
	}
	const values = {
		returncode: data[0],
		stdout: data[1],
		stderr: data[2],
	};

	const run = (key: keyof RunContextData) => {
		if (values[key] instanceof RegExp) {
			expect(String(ctx[key])).toMatch(values[key]);
		} else {
			expect(ctx[key]).toBe(values[key]);
		}
	};

	run("returncode");
	run("stdout");
	run("stderr");
};



describe("Command Line Test Case", () => {
	let dirname: BuildTempWorkspaceReturnType["dirname"];
	let resolve: BuildTempWorkspaceReturnType["resolve"];
	let mkftemp: BuildTempWorkspaceReturnType["mkftemp"];
	let cleanup: BuildTempWorkspaceReturnType["cleanup"] = async () => {
		// pass
	};
	afterAll(() => cleanup());
	beforeAll(async () => {
		const temp = await buildTempWorkspace({
			// .yaml file at root
			"a.yaml": [
				"---",
				"- 1   ",
				"- 2",
			],

			// file with only one warning
			"warn.yaml": "key: value\n",

			// .yml file at root
			"empty.yml": "",

			// file in dir
			"sub/ok.yaml": "---\nkey: value\n",

			// directory that looks like a yaml file
			"sub/directory.yaml/not-yaml.txt": "",
			"sub/directory.yaml/empty.yml": "",

			// file in very nested dir
			"s/s/s/s/s/s/s/s/s/s/s/s/s/s/s/file.yaml": [
				"---",
				"key: value",
				"key: other value",
				"",
			],

			// empty dir
			"empty-dir": null,

			// symbolic link
			"symlinks/file-without-yaml-extension": "42",
			"symlinks/link.yaml": "symlink://file-without-yaml-extension",

			// non-YAML file
			"no-yaml.json": "---\nkey: value\n",

			// non-ASCII chars
			"non-ascii/éçäγλνπ¥/utf-8": Buffer.from([
				"---",
				"- hétérogénéité",
				"# 19.99 €",
				"- お早う御座います。",
				"# الأَبْجَدِيَّة العَرَبِيَّة",
				"",
			].join("\n")),

			// dos line endings yaml
			"dos.yml": "---\r\ndos: true",

			// different key-ordering by locale
			"c.yaml": [
				"---",
				"A: true",
				"a: true",
			],
			"en.yaml": [
				"---",
				"a: true",
				"A: true",
			],

			// node_modules
			"node_modules/path/to/file.yaml": [
				"a: 1",
			],

			// node_modules
			"subdir/node_modules/path/to/file.yaml": [
				"b: 2",
			],
		});
		dirname = temp.dirname;
		resolve = temp.resolve;
		mkftemp = temp.mkftemp;
		cleanup = temp.cleanup;
	});



	/**
	 * alias for `temp.resolve`
	 */
	const p = (...paths: string[]) => resolve(...paths);
	const findFiles = async (
		items: string[],
		conf: YamlLintConfig,
	) => {
		const gen = cli.findFilesRecursively(items, conf);
		const arr = [];
		for await (const cur of gen) arr.push(cur);
		return arr.sort();
	};

	const writeFile = (filepath: string, content: string) => (
		fs.mkdir(path.dirname(filepath), { recursive: true })
			.then(() => fs.writeFile(filepath, content))
	);



	test("find files recursively", async () => {
		let conf: YamlLintConfig;

		const run = async (
			conf: YamlLintConfig,
			items: string[],
			expected: string[],
		) => {
			await expect(findFiles(
				(items.length ? items : [""]).map(x => p(x)),
				conf,
			)).resolves.toStrictEqual(expected.map(x => p(x)));
		};



		conf = await YamlLintConfig.init({ content: "extends: default" });

		await run(conf, [
		], [
			"a.yaml",
			"c.yaml",
			"dos.yml",
			"empty.yml",
			"en.yaml",
			"s/s/s/s/s/s/s/s/s/s/s/s/s/s/s/file.yaml",
			"sub/directory.yaml/empty.yml",
			"sub/ok.yaml",
			"symlinks/link.yaml",
			"warn.yaml",
		]);

		await run(conf, [
			"sub/ok.yaml",
			"empty-dir",
		], [
			"sub/ok.yaml",
		]);

		await run(conf, [
			"empty.yml",
			"s",
		], [
			"empty.yml",
			"s/s/s/s/s/s/s/s/s/s/s/s/s/s/s/file.yaml",
		]);

		await run(conf, [
			"sub",
			"/etc/another/file",
		], [
			"/etc/another/file",
			"sub/directory.yaml/empty.yml",
			"sub/ok.yaml",
		]);



		conf = await YamlLintConfig.init({ content: [
			"extends: default",
			"yaml-files:",
			"  - '*.yaml' ",
		].join("\n") });

		await run(conf, [
		], [
			"a.yaml",
			"c.yaml",
			"en.yaml",
			"s/s/s/s/s/s/s/s/s/s/s/s/s/s/s/file.yaml",
			"sub/ok.yaml",
			"symlinks/link.yaml",
			"warn.yaml",
		]);



		conf = await YamlLintConfig.init({ content: [
			"extends: default",
			"yaml-files:",
			"  - '*.yml'",
		].join("\n") });

		await run(conf, [
		], [
			"dos.yml",
			"empty.yml",
			"sub/directory.yaml/empty.yml",
		]);



		conf = await YamlLintConfig.init({ content: [
			"extends: default",
			"yaml-files:",
			"  - '*.json'",
		].join("\n") });

		await run(conf, [
		], [
			"no-yaml.json",
		]);



		conf = await YamlLintConfig.init({ content: [
			"extends: default",
			"yaml-files:",
			"  - '*'",
		].join("\n") });

		await run(conf, [
		], [
			"a.yaml",
			"c.yaml",
			"dos.yml",
			"empty.yml",
			"en.yaml",
			"no-yaml.json",
			"non-ascii/éçäγλνπ¥/utf-8",
			"s/s/s/s/s/s/s/s/s/s/s/s/s/s/s/file.yaml",
			"sub/directory.yaml/empty.yml",
			"sub/directory.yaml/not-yaml.txt",
			"sub/ok.yaml",
			"symlinks/file-without-yaml-extension",
			"symlinks/link.yaml",
			"warn.yaml",
		]);



		conf = await YamlLintConfig.init({ content: [
			"extends: default",
			"yaml-files:",
			"  - '*.yaml'",
			"  - '*'",
			"  - '**'",
		].join("\n") });

		await run(conf, [
		], [
			"a.yaml",
			"c.yaml",
			"dos.yml",
			"empty.yml",
			"en.yaml",
			"no-yaml.json",
			"non-ascii/éçäγλνπ¥/utf-8",
			"s/s/s/s/s/s/s/s/s/s/s/s/s/s/s/file.yaml",
			"sub/directory.yaml/empty.yml",
			"sub/directory.yaml/not-yaml.txt",
			"sub/ok.yaml",
			"symlinks/file-without-yaml-extension",
			"symlinks/link.yaml",
			"warn.yaml",
		]);



		conf = await YamlLintConfig.init({ content: [
			"extends: default",
			"yaml-files:",
			"  - 's/**'",
			"  - '**/utf-8'",
		].join("\n") });

		await run(conf, [
		], [
			"non-ascii/éçäγλνπ¥/utf-8",
		]);
	});

	test("run with help option", async () => {
		const ctx = await runContext("--help");
		checkContext(ctx, [
			0,
			/^usage/,
			"",
		]);
	});

	test("run with bad arguments", async () => {
		let ctx: RunContextData;

		ctx = await runContext();
		checkContext(ctx, [
			/[^0]/,
			"",
			/^usage/,
		]);

		ctx = await runContext("--unknown-arg");
		checkContext(ctx, [
			/[^0]/,
			"",
			/^usage/,
		]);

		ctx = await runContext("-c", "./conf.yaml", "-d", "relaxed", "file");
		checkContext(ctx, [
			/[^0]/,
			"",
			/config-file and config-data are mutually exclusive/,
		]);

		// checks if reading from stdin and files are mutually exclusive
		ctx = await runContext("-", "file");
		checkContext(ctx, [
			/[^0]/,
			"",
			/^usage/,
		]);
	});

	test("run with bad config", async () => {
		const ctx = await runContext("-d", "rules: {a: b}", "file");
		checkContext(ctx, [
			/[^0]/,
			"",
			/invalid config: no such rule/,
		]);
	});

	test("run with empty config", async () => {
		const ctx = await runContext("-d", "", "file");
		checkContext(ctx, [
			/[^0]/,
			"",
			/invalid config: not a mapping/,
		]);
	});

	test("run with implicit extends config", async () => {
		const filepath = p("warn.yaml");

		const ctx = await runContext("-d", "default", "-f", "parsable", filepath);
		checkContext(ctx, [
			0,
			`${filepath}:1:1: [warning] missing document start "---" (document-start)`,
			"",
		]);
	});

	test("run with config file", async () => {
		const config = p("config");

		await writeFile(config, "rules: {trailing-spaces: disable}");
		const ctx1 = await runContext("-c", config, p("a.yaml"));
		expect(ctx1.returncode).toBe(0);

		await writeFile(config, "rules: {trailing-spaces: enable}");
		const ctx2 = await runContext("-c", config, p("a.yaml"));
		expect(ctx2.returncode).toBe(1);
	});

	test("run with user global config file", async () => {
		const env = { HOME: dirname };
		const config = p(".config", "yamllint", "config");

		await writeFile(config, "rules: {trailing-spaces: disable}");
		const ctx1 = await runContext({ env, args: [p("a.yaml")] });
		expect(ctx1.returncode).toBe(0);

		await writeFile(config, "rules: {trailing-spaces: enable}");
		const ctx2 = await runContext({ env, args: [p("a.yaml")] });
		expect(ctx2.returncode).toBe(1);
	});

	test("run with user xdg config home in env", async () => {
		const env = { XDG_CONFIG_HOME: dirname };
		const config = p("yamllint", "config");

		await writeFile(config, "extends: relaxed");
		const ctx = await runContext({ env, args: ["-f", "parsable", p("warn.yaml")] });
		checkContext(ctx, [
			0,
			"",
			"",
		]);
	});

	test("run with user yamllint config file in env", async () => {
		const YAMLLINT_CONFIG_FILE = mkftemp();
		const env = { YAMLLINT_CONFIG_FILE };

		await writeFile(YAMLLINT_CONFIG_FILE, "rules: {trailing-spaces: disable}");
		const ctx1 = await runContext({ env, args: [p("a.yaml")] });
		expect(ctx1.returncode).toBe(0);

		await writeFile(YAMLLINT_CONFIG_FILE, "rules: {trailing-spaces: enable}");
		const ctx2 = await runContext({ env, args: [p("a.yaml")] });
		expect(ctx2.returncode).toBe(1);
	});

	test("run with locale", async () => {
		/*
		 * check for availability of locale, otherwise skip the test
		 * reset to default before running the test,
		 * as the first two runs don't use setlocale()
		 */

		const run = async (
			locale: string | undefined,
			filename: string,
			returncode: number,
		) => {
			const ctx = await runContext("-d", `${locale ? `locale: ${locale}\n` : ""}rules: { key-ordering: enable }`, p(filename));
			expect(ctx.returncode).toBe(returncode);
		};

		/*
		 * Array.sort + en.yaml should fail
		 */
		await run(undefined, "en.yaml", 1);

		/*
		 * Array.sort + c.yaml should pass
		 */
		await run(undefined, "c.yaml", 0);

		/*
		 * en_US + en.yaml should pass
		 */
		await run("en_US.UTF-8", "en.yaml", 0);

		/*
		 * en_US + c.yaml should fail
		 */
		await run("en_US.UTF-8", "c.yaml", 1);
	});

	test("run version", async () => {
		const ctx = await runContext("--version");
		checkContext(ctx, [
			0,
			APP.VERSION,
			"",
		]);
	});

	test("run non existing file", async () => {
		const filepath = p("i-do-not-exist.yaml");
		const ctx = await runContext("-f", "parsable", filepath);
		checkContext(ctx, [
			/[^0]/,
			"",
			/no such file or directory/,
		]);
	});

	test("run one problem file", async () => {
		const filepath = p("a.yaml");
		const ctx = await runContext("-f", "parsable", filepath);
		checkContext(ctx, [
			1,
			[
				`${filepath}:2:4: [error] trailing spaces (trailing-spaces)`,
				`${filepath}:3:4: [error] no new line character at the end of file (new-line-at-end-of-file)`,
			].join("\n"),
			"",
		]);
	});

	test("run one warning", async () => {
		const filepath = p("warn.yaml");
		const ctx = await runContext("-f", "parsable", filepath);
		expect(ctx.returncode).toBe(0);
	});

	test("run warning in strict mode", async () => {
		const filepath = p("warn.yaml");
		const ctx = await runContext("-f", "parsable", "--strict", filepath);
		expect(ctx.returncode).toBe(2);
	});

	test("run one ok file", async () => {
		const filepath = p("sub", "ok.yaml");
		const ctx = await runContext("-f", "parsable", filepath);
		checkContext(ctx, [
			0,
			"",
			"",
		]);
	});

	test("run empty file", async () => {
		const filepath = p("empty.yml");
		const ctx = await runContext("-f", "parsable", filepath);
		checkContext(ctx, [
			0,
			"",
			"",
		]);
	});

	test("run non ascii file", async () => {
		const filepath = p("non-ascii", "éçäγλνπ¥", "utf-8");
		const ctx = await runContext("-f", "parsable", filepath);
		checkContext(ctx, [
			0,
			"",
			"",
		]);
	});

	test("run multiple files", async () => {
		const files = [
			p("empty.yml"),
			p("s"),
		];
		const filepath = files[1] + "/s/s/s/s/s/s/s/s/s/s/s/s/s/s/file.yaml";
		const ctx = await runContext("-f", "parsable", ...files);
		checkContext(ctx, [
			1,
			`${filepath}:3:1: [error] duplication of key "key" in mapping (key-duplicates)`,
			"",
		]);
	});

	describe("should detect supported color", () => {
		test("win32", async () => {
			await withTTYWorkspace(async () => {
				let platformSpy;
				try {
					platformSpy = vi.spyOn(os, "platform").mockImplementation(() => "win32");
					const filepath = p("a.yaml");

					await expect(runContext({
						env: {},
						args: [filepath],
					}).then(x => x.stdout)).resolves.not.toMatch("\x1b");

					await expect(runContext({
						env: { ANSICON: "" },
						args: [filepath],
					}).then(x => x.stdout)).resolves.toMatch("\x1b");

					await expect(runContext({
						env: { TERM: "ANSI" },
						args: [filepath],
					}).then(x => x.stdout)).resolves.toMatch("\x1b");
				} finally {
					platformSpy?.mockRestore();
				}
			});
		});

		test("linux", async () => {
			await withTTYWorkspace(async () => {
				let platformSpy;
				try {
					platformSpy = vi.spyOn(os, "platform").mockImplementation(() => "linux");
					const filepath = p("a.yaml");

					await expect(runContext({
						env: {},
						args: [filepath],
					}).then(x => x.stdout)).resolves.toMatch("\x1b");
				} finally {
					platformSpy?.mockRestore();
				}
			});
		});
	});

	test("run piped output nocolor", async () => {
		const filepath = p("a.yaml");
		const ctx = await runContext("-f", "standard", filepath);
		checkContext(ctx, [
			1,
			[
				filepath,
				"  2:4       error    trailing spaces  (trailing-spaces)",
				"  3:4       error    no new line character at the end of file  (new-line-at-end-of-file)",
			].join("\n"),
			"",
		]);
	});

	test("run default format output in tty", async () => {
		await withTTYWorkspace(async () => {
			const filepath = p("a.yaml");
			const ctx = await runContext(filepath);
			checkContext(ctx, [
				1,
				[
					`\x1b[4m${filepath}\x1b[0m`,
					"  \x1b[2m2:4\x1b[0m       \x1b[31merror\x1b[0m    trailing spaces  \x1b[2m(trailing-spaces)\x1b[0m",
					"  \x1b[2m3:4\x1b[0m       \x1b[31merror\x1b[0m    no new line character at the end of file  \x1b[2m(new-line-at-end-of-file)\x1b[0m",
				].join("\n"),
				"",
			]);
		});
	});

	test("run default format output without tty", async () => {
		await noTTYWorkspace(async () => {
			const filepath = p("a.yaml");
			const ctx = await runContext(filepath);
			checkContext(ctx, [
				1,
				[
					filepath,
					"  2:4       error    trailing spaces  (trailing-spaces)",
					"  3:4       error    no new line character at the end of file  (new-line-at-end-of-file)",
				].join("\n"),
				"",
			]);
		});
	});

	test("run auto output without tty output", async () => {
		await noTTYWorkspace(async () => {
			const filepath = p("a.yaml");
			const ctx = await runContext(filepath, "--format", "auto");
			checkContext(ctx, [
				1,
				[
					filepath,
					"  2:4       error    trailing spaces  (trailing-spaces)",
					"  3:4       error    no new line character at the end of file  (new-line-at-end-of-file)",
				].join("\n"),
				"",
			]);
		});
	});

	test("run format colored", async () => {
		const filepath = p("a.yaml");
		const ctx = await runContext(filepath, "--format", "colored");
		checkContext(ctx, [
			1,
			[
				`\x1b[4m${filepath}\x1b[0m`,
				"  \x1b[2m2:4\x1b[0m       \x1b[31merror\x1b[0m    trailing spaces  \x1b[2m(trailing-spaces)\x1b[0m",
				"  \x1b[2m3:4\x1b[0m       \x1b[31merror\x1b[0m    no new line character at the end of file  \x1b[2m(new-line-at-end-of-file)\x1b[0m",
			].join("\n"),
			"",
		]);
	});

	test("run format colored warning", async () => {
		const filepath = p("warn.yaml");
		const ctx = await runContext(filepath, "--format", "colored");
		checkContext(ctx, [
			0,
			[
				`\x1b[4m${filepath}\x1b[0m`,
				"  \x1b[2m1:1\x1b[0m       \x1b[33mwarning\x1b[0m  missing document start \"---\"  \x1b[2m(document-start)\x1b[0m",
			].join("\n"),
			"",
		]);
	});

	test("run format github", async () => {
		const filepath = p("a.yaml");
		const ctx = await runContext(filepath, "--format", "github");
		checkContext(ctx, [
			1,
			[
				`::group::${filepath}`,
				`::error file=${filepath},line=2,col=4::2:4 [trailing-spaces] trailing spaces`,
				`::error file=${filepath},line=3,col=4::3:4 [new-line-at-end-of-file] no new line character at the end of file`,
				"::endgroup::",
			].join("\n"),
			"",
		]);
	});

	test("github actions detection", async () => {
		const filepath = p("a.yaml");
		const GITHUB_ACTIONS = "something";
		const GITHUB_WORKFLOW = "something";
		const env = { GITHUB_ACTIONS, GITHUB_WORKFLOW };

		const ctx = await runContext({ env, args: [filepath] });
		checkContext(ctx, [
			1,
			[
				`::group::${filepath}`,
				`::error file=${filepath},line=2,col=4::2:4 [trailing-spaces] trailing spaces`,
				`::error file=${filepath},line=3,col=4::3:4 [new-line-at-end-of-file] no new line character at the end of file`,
				"::endgroup::",
			].join("\n"),
			"",
		]);
	});

	test("run read from stdin", async () => {
		/*
		 * prepares stdin with an invalid yaml string so that we can
		 * check for its specific error, and be assured that stdin was
		 * read
		 */
		const ctx = await runContext({
			stdin: Readable.from("I am a string\ntherefore: I am an error\n"),
			args: ["-", "-f", "parsable"],
		});
		checkContext(ctx, [
			1,
			/^stdin:1:1: \[error\] syntax error: Implicit keys need to be on a single line \(syntax\)/,
			"",
		]);

		// invalid input type
		const { stderr } = await runContext({
			stdin: 123 as unknown as Readable,
			args: ["-", "-f", "parsable"],
		});
		expect(stderr).toMatch(/input should be a string or a stream/);
	});

	test("run no warnings", async () => {
		const filepath1 = p("a.yaml");
		const ctx1 = await runContext(filepath1, "--no-warnings", "-f", "standard");
		checkContext(ctx1, [
			1,
			[
				filepath1,
				"  2:4       error    trailing spaces  (trailing-spaces)",
				"  3:4       error    no new line character at the end of file  (new-line-at-end-of-file)",
			].join("\n"),
			"",
		]);

		const filepath2 = p("warn.yaml");
		const ctx2 = await runContext(filepath2, "--no-warnings", "-f", "standard");
		expect(ctx2.returncode).toBe(0);
	});

	test("run no warnings and strict", async () => {
		const filepath = p("warn.yaml");
		const ctx = await runContext(filepath, "--no-warnings", "-s");
		expect(ctx.returncode).toBe(2);
	});

	test("run non universal newline", async () => {
		const filepath = p("dos.yml");

		const dos = await runContext("-d", "rules:\n  new-lines:\n    type: dos", filepath, "-f", "standard");
		checkContext(dos, [
			0,
			"",
			"",
		]);

		const unix = await runContext("-d", "rules:\n  new-lines:\n    type: unix", filepath, "-f", "standard");
		checkContext(unix, [
			1,
			[
				filepath,
				"  1:4       error    wrong new line character: expected \\n  (new-lines)",
			].join("\n"),
			"",
		]);
	});

	test("run list files", async () => {
		const run = async (
			config: string | undefined,
			paths: string[],
			filepaths: string[],
		) => {
			const configArgs = config === undefined ? [] : ["-d", config];
			const ctx = await runContext({
				chdir: dirname,
				args: ["--list-files", ...configArgs, ...paths],
			});
			expect(ctx.returncode).toBe(0);
			expect(splitlines(ctx.stdout).sort()).toStrictEqual(filepaths);
		};

		await run(
			undefined,
			["."],
			[
				"a.yaml",
				"c.yaml",
				"dos.yml",
				"empty.yml",
				"en.yaml",
				"s/s/s/s/s/s/s/s/s/s/s/s/s/s/s/file.yaml",
				"sub/directory.yaml/empty.yml",
				"sub/ok.yaml",
				"symlinks/link.yaml",
				"warn.yaml",
			],
		);

		await run(
			"{ignore: '*.yml', yaml-files: ['*.*']}",
			["."],
			[
				"a.yaml",
				"c.yaml",
				"en.yaml",
				"no-yaml.json",
				"s/s/s/s/s/s/s/s/s/s/s/s/s/s/s/file.yaml",
				"sub/directory.yaml/not-yaml.txt",
				"sub/ok.yaml",
				"symlinks/link.yaml",
				"warn.yaml",
			],
		);

		await run(
			"ignore: ['*.yaml', '*.yml', '!a.yaml']",
			["."],
			[
				"a.yaml",
			],
		);

		await run(
			"ignore: ['*.yaml', '*.yml', '!a.yaml']",
			["a.yaml", "en.yaml", "c.yaml"],
			[
				"a.yaml",
			],
		);
	});
});



describe("Command Line Config Test Case", () => {
	const confFiles = [".yamllint", ".yamllint.yml", ".yamllint.yaml"];
	const run = async ({
		workspace,
		returnCode = 0,
		stdout = "",
		stderr = "",
		configFile,
		workdir,
	}: {
		workspace: Record<string, string | string[]>;
		returnCode?: CheckContextData[0];
		stdout?: CheckContextData[1];
		stderr?: CheckContextData[2];
		configFile?: string;
		workdir?: string;
	}) => {
		await tempWorkspace(workspace, async () => {
			if (workdir) process.chdir(workdir);
			const args = ["-f", "parsable", "."];
			if (configFile) args.push("-c", configFile);
			const ctx = await runContext(...args);
			checkContext(ctx, [
				returnCode,
				stdout,
				stderr,
			]);
		});
	};

	describe("config file", () => {
		const workspace = { "a.yml": "hello: world\n" };
		const confs = {
			yaml: [
				"---",
				"extends: relaxed",
				"",
			],
			package: [
				"{",
				`  "${APP.NAME}": {`,
				"    \"extends\": \"relaxed\"",
				"  }",
				"}",
			],
			cjs: [
				"module.exports = {",
				"  extends: 'relaxed'",
				"};",
			],
			esm: [
				"export default {",
				"  extends: 'relaxed'",
				"};",
			],
		};

		test("no config file", async () => {
			await run({
				workspace,
				stdout: "a.yml:1:1: [warning] missing document start \"---\" (document-start)",
			});
		});

		test("not support format", async () => {
			await run({
				workspace: { ...workspace, "yamllint-js.config.mjs": "" },
				stdout: "a.yml:1:1: [warning] missing document start \"---\" (document-start)",
			});

			await run({
				configFile: "file.js",
				workspace: { ...workspace, "file.js": "" },
				returnCode: -1,
				stderr: /^Error:/,
			});
		});

		describe("yaml", () => {
			for (const confFile of confFiles) {
				test(confFile, async () => {
					await run({
						workspace: { ...workspace, [confFile]: confs.yaml },
					});
				});
			}
		});

		test("package.json", async () => {
			const confFile = "package.json";
			await run({
				workspace: { ...workspace, [confFile]: confs.package },
			});
		});

		const exts = [
			[".js", [confs.cjs, confs.esm]],
			[".cjs", [confs.cjs]],
			[".mjs", [confs.esm]],
			[".ts", [confs.esm]],
			[".cts", [confs.esm]],
			[".mts", [confs.esm]],
		] satisfies Array<[string, string[][]]>;

		for (const [ext, data] of exts) {
			test(ext, async () => {
				const confFile = `${APP.NAME}.config${ext}`;
				for (const conf of data) {
					await run({
						workspace: { ...workspace, [confFile]: conf },
					});
				}
			});
		}

		describe("empty file", () => {
			for (const confFile of [...confFiles, ...exts.map(([ext]) => `${APP.NAME}.config${ext}`)]) {
				test(confFile, async () => {
					await run({
						workspace: { ...workspace, [confFile]: "" },
						stdout: "a.yml:1:1: [warning] missing document start \"---\" (document-start)",
					});
				});
			}
		});
	});

	describe("parent config file", () => {
		const workdir = "a/b/c/d/e/f";
		const workspace = { "a/b/c/d/e/f/g/a.yml": "hello: world\n" };
		const conf = [
			"---",
			"extends: relaxed",
			"",
		];

		for (const confFile of confFiles) {
			test(confFile, async () => {
				await run({
					workspace,
					workdir,
					stdout: "g/a.yml:1:1: [warning] missing document start \"---\" (document-start)",
				});
				await run({
					workspace: { ...workspace, [confFile]: conf },
					workdir,
					stdout: "",
				});
			});
		}
	});

	test("multiple parent config file", async () => {
		const workdir = "a/b/c";
		const workspace = {
			"a/b/c/3spaces.yml": [
				"array:",
				"   - item",
				"",
			],
			"a/b/c/4spaces.yml": [
				"array:",
				"    - item",
				"",
			],
			"a/.yamllint": [
				"---",
				"extends: relaxed",
				"rules:",
				"  indentation:",
				"    spaces: 4",
				"",
			],
		};
		const conf = [
			"---",
			"extends: relaxed",
			"rules:",
			"  indentation:",
			"    spaces: 3",
			"",
		];

		await run({
			workspace,
			workdir,
			stdout: "3spaces.yml:2:4: [warning] wrong indentation: expected 4 but found 3 (indentation)",
		});
		await run({
			workspace: { ...workspace, "a/b/.yamllint.yml": conf },
			workdir,
			stdout: "4spaces.yml:2:5: [warning] wrong indentation: expected 3 but found 4 (indentation)",
		});
	});
});



describe("Command Line Encoding Test Case", () => {
	const validEncodingsStdinTestHelper = async (
		configPath: string,
		rootDir: string,
	) => {
		const filepaths = await glob(path.join(rootDir, "**"));
		for (const filepath of filepaths) {
			const content = await fs.readFile(filepath);
			const ctx = await runContext({
				stdin: Readable.from(content),
				args: ["-c", configPath, "-"],
			});
			if (rootDir === "sorted_correctly") {
				checkContext(ctx, [
					0,
					/.*/,
					/.*/,
				]);
			} else if (rootDir === "sorted_incorrectly") {
				checkContext(ctx, [
					/[^0]/,
					/.*/,
					/.*/,
				]);
			}
		}
	};

	test("valid encodings", async () => {
		const conf = [
			"---",
			"rules:",
			"  key-ordering: enable",
			"",
		];

		const configFiles = tempWorkspaceWithFilesInManyCodecs("config_{}.yaml", conf);
		const sortedCorrectly = [
			"---",
			"A: YAML",
			"Z: YAML",
			"",
		];
		const sortedCorrectlyFiles = tempWorkspaceWithFilesInManyCodecs(
			"sorted_correctly/{}.yaml",
			sortedCorrectly,
		);
		const sortedIncorrectly = [
			"---",
			"Z: YAML",
			"A: YAML",
			"",
		];
		const sortedIncorrectlyFiles = tempWorkspaceWithFilesInManyCodecs(
			"sorted_incorrectly/{}.yaml",
			sortedIncorrectly,
		);

		const workspace = {
			...configFiles,
			...sortedCorrectlyFiles,
			...sortedIncorrectlyFiles,
		};

		await tempWorkspace(workspace, async () => {
			for (const configPath in configFiles) {
				/*
				 * First, make sure that encoding autodetection works when the
				 * file’s path is given as a command-line argument.
				 */
				const ctx1 = await runContext("-c", configPath, "sorted_correctly");
				expect(ctx1.returncode).toBe(0);

				const ctx2 = await runContext("-c", configPath, "sorted_incorrectly");
				expect(ctx2.returncode).not.toBe(0);

				/*
				 * Second, make sure that encoding autodetection works when the
				 * file is piped to yamllint-js via stdin.
				 */
				await validEncodingsStdinTestHelper(configPath, "sorted_correctly");
				await validEncodingsStdinTestHelper(configPath, "sorted_incorrectly");
			}
		});
	});
});
