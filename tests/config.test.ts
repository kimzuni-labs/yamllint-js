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

import { describe, test, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs/promises";
import z from "zod";

import type { Rule } from "../src/types";
import { splitlines } from "../src/utils";
import {
	YamlLintConfig,
	validateRuleConf,
} from "../src/config";

import {
	encode,
	buildTempWorkspace,
	tempWorkspace,
	runContext,
	type RunContextData,
	type BuildTempWorkspaceReturnType,
} from "./common";



const newConf = (...strings: string[]) => YamlLintConfig.init({ content: strings.join("\n") });



describe("Simple Config Test Case", () => {
	describe("parse config", () => {
		const run = async (config: string[]) => {
			const conf = await newConf(...config);
			if (conf.rules.colons !== undefined) {
				expect(conf.rules).all.keys("colons");
				expect(conf.rules.colons).toMatchObject({
					"max-spaces-before": 0,
					"max-spaces-after": 1,
				});
			}
			expect(conf.enabledRules()).toHaveLength(1);
		};

		test("kebab-case", async () => {
			await run([
				"rules:",
				"  colons:",
				"    max-spaces-before: 0",
				"    max-spaces-after: 1",
				"",
			]);
		});

		test("camelCase", async () => {
			await run([
				"rules:",
				"  colons:",
				"    maxSpacesBefore: 0",
				"    maxSpacesAfter: 1",
				"",
			]);
		});

		test("defineConfig-style", async () => {
			await run([
				"rules:",
				"  colons:",
				"    - error",
				"    - maxSpacesBefore: 0",
				"      maxSpacesAfter: 1",
				"",
			]);

			await run([
				"rules:",
				"  hyphens: error",
				"",
			]);
		});
	});

	test("invalid conf", async () => {
		await expect(newConf("not: valid: yaml")).rejects.toThrow();
	});

	test("unknown rule", async () => {
		await expect(newConf(
			"rules:",
			"  this-one-does-not-exist: enable",
			"",
		)).rejects.toThrow("invalid config: no such rule: \"this-one-does-not-exist\"");
	});

	test("missing option", async () => {
		const run = async (
			config: string[],
			before: number,
			after: number,
		) => {
			const conf = await newConf(...config);
			expect(conf.rules.colons).toMatchObject({
				"max-spaces-before": before,
				"max-spaces-after": after,
			});
		};

		await run([
			"rules:",
			"  colons: enable",
			"",
		], 0, 1);

		await run([
			"rules:",
			"  colons:",
			"    max-spaces-before: 9",
			"",
		], 9, 1);
	});

	test("unknown option", async () => {
		await expect(newConf(
			"rules:",
			"  colons:",
			"    max-spaces-before: 0",
			"    max-spaces-after: 1",
			"    abcdef: true",
			"",
		)).rejects.toThrow("invalid config: unknown option \"abcdef\" for rule \"colons\"");
	});

	test("yes/no for booleans", async () => {
		const run = async (
			config: string[],
			[
				indentSequences,
				checkMultiLineStrings,
			]: [
				indentSequences: boolean | string,
				checkMultiLineStrings: boolean,
			],
		) => {
			const conf = await newConf(...config);
			expect(conf.rules.indentation).toMatchObject({
				"indent-sequences": indentSequences,
				"check-multi-line-strings": checkMultiLineStrings,
			});
			return conf;
		};

		await run([
			"rules:",
			"  indentation:",
			"    spaces: 2",
			"    indent-sequences: true",
			"    check-multi-line-strings: false",
			"",
		], [
			true,
			false,
		]);

		await run([
			"rules:",
			"  indentation:",
			"    spaces: 2",
			"    indent-sequences: yes",
			"    check-multi-line-strings: false",
			"",
		], [
			true,
			false,
		]);

		await run([
			"rules:",
			"  indentation:",
			"    spaces: 2",
			"    indent-sequences: whatever",
			"    check-multi-line-strings: false",
			"",
		], [
			"whatever",
			false,
		]);

		await expect(run([
			"rules:",
			"  indentation:",
			"    spaces: 2",
			"    indent-sequences: YES!",
			"    check-multi-line-strings: false",
			"",
		], [
			"",
			false,
		])).rejects.toThrow("invalid config: option \"indent-sequences\" of \"indentation\" should be in ");
	});

	test("enable disable keywords", async () => {
		const conf = await newConf(
			"rules:",
			"  colons: enable",
			"  hyphens: disable",
			"",
		);
		expect(conf.rules.colons).toMatchObject({
			level: "error",
			"max-spaces-before": 0,
			"max-spaces-after": 1,
		});
		expect(conf.rules.hyphens).toBe(false);
	});

	test("validate rule conf", async () => {
		const fake = {
			ID: "fake",
		} as Rule;

		await expect(validateRuleConf(fake, false)).resolves.toBe(false);
		await expect(validateRuleConf(fake, {})).resolves.toStrictEqual({ level: "error" });

		await validateRuleConf(fake, { level: undefined });
		await validateRuleConf(fake, { level: "error" });
		await validateRuleConf(fake, { level: "warning" });
		await validateRuleConf(fake, { level: null });
		await expect(validateRuleConf(fake, { level: "invalid" })).rejects.toThrow();

		// aliases
		await validateRuleConf(fake, { level: "err" });
		await validateRuleConf(fake, { level: "warn" });
		await validateRuleConf(fake, { level: "off" });

		fake.CONF = z.object({
			length: z.int(),
		});
		fake.DEFAULT = {
			length: 80,
		};
		await validateRuleConf(fake, { length: 8 });
		await validateRuleConf(fake, {});
		await expect(validateRuleConf(fake, { height: 8 })).rejects.toThrow();

		fake.CONF = z.object({
			a: z.boolean(),
			b: z.int(),
		});
		fake.DEFAULT = {
			a: true,
			b: -42,
		};
		await validateRuleConf(fake, { a: true, b: 0 });
		await validateRuleConf(fake, { a: true });
		await validateRuleConf(fake, { b: 0 });
		await expect(validateRuleConf(fake, { a: 1, b: 0 })).rejects.toThrow();

		fake.CONF = z.object({
			choice: z.union([z.literal(true), z.literal(88), z.literal("str")]),
		});
		fake.DEFAULT = {
			choice: 88,
		};
		await validateRuleConf(fake, { choice: true });
		await validateRuleConf(fake, { choice: 88 });
		await validateRuleConf(fake, { choice: "str" });
		await expect(validateRuleConf(fake, { choice: false })).rejects.toThrow();
		await expect(validateRuleConf(fake, { choice: 99 })).rejects.toThrow();
		await expect(validateRuleConf(fake, { choice: "abc" })).rejects.toThrow();

		fake.CONF = z.object({
			choice: z.union([z.int(), z.literal("hardcoded")]),
		});
		fake.DEFAULT = {
			choice: 1337,
		};
		await validateRuleConf(fake, { choice: 42 });
		await validateRuleConf(fake, { choice: "hardcoded" });
		await validateRuleConf(fake, {});
		await expect(validateRuleConf(fake, { choice: false })).rejects.toThrow();
		await expect(validateRuleConf(fake, { choice: "abc" })).rejects.toThrow();

		fake.CONF = z.object({
			multiple: z.enum(["item1", "item2", "item3"]).array(),
		});
		fake.DEFAULT = {
			multiple: ["item1"],
		};
		await validateRuleConf(fake, { multiple: [] });
		await validateRuleConf(fake, { multiple: ["item2"] });
		await validateRuleConf(fake, { multiple: ["item2", "item3"] });
		await validateRuleConf(fake, {});
		await expect(validateRuleConf(fake, { multiple: "item1" })).rejects.toThrow();
		await expect(validateRuleConf(fake, { multiple: [""] })).rejects.toThrow();
		await expect(validateRuleConf(fake, { multiple: ["item1", 4] })).rejects.toThrow();
		await expect(validateRuleConf(fake, { multiple: ["item4"] })).rejects.toThrow();
	});

	test("invalid rule", async () => {
		await expect(newConf(
			"rules:",
			"",
		)).rejects.toThrow("invalid config: rules should be a mapping");

		await expect(newConf(
			"rules:",
			"  colons: invalid",
			"",
		)).rejects.toThrow("invalid config: rule \"colons\": should be either \"enable\", \"disable\" or a mapping");
	});

	test("invalid ignore", async () => {
		await expect(newConf(
			"ignore: true",
			"",
		)).rejects.toThrow("invalid config: ignore should contain file patterns");
	});

	test("invalid rule ignore", async () => {
		await expect(newConf(
			"rules:",
			"  colons:",
			"    ignore: true",
			"",
		)).rejects.toThrow("invalid config: ignore should contain file patterns");
	});

	test("invalid rule ignore from file", async () => {
		await expect(newConf(
			"rules:",
			"  colons:",
			"    ignore-from-file: 1337",
			"",
		)).rejects.toThrow();
	});

	test("invalid locale", async () => {
		await expect(newConf(
			"locale: true",
			"",
		)).rejects.toThrow("invalid config: locale should be a string");
	});

	test("invalid yaml files", async () => {
		await expect(newConf(
			"yaml-files: true",
			"",
		)).rejects.toThrow("invalid config: yaml-files should be a list of file patterns");
	});
});



describe("Extended Config Test Case", () => {
	test("extend on object", async () => {
		const oldConf = await newConf(
			"rules:",
			"  colons:",
			"    max-spaces-before: 0",
			"    max-spaces-after: 1",
			"",
		);
		const conf = await newConf(
			"rules:",
			"  hyphens:",
			"    max-spaces-after: 2",
			"",
		);

		conf.extend(oldConf);
		expect(conf.rules).all.keys("colons", "hyphens");
		expect(conf.rules.colons).toMatchObject({
			"max-spaces-before": 0,
			"max-spaces-after": 1,
		});
		expect(conf.rules.hyphens).toMatchObject({
			"max-spaces-after": 2,
		});
		expect(conf.enabledRules()).toHaveLength(2);
	});

	test("extend on file", async () => {
		await tempWorkspace({}, async ({ mkftemp }) => {
			const file = mkftemp(".yaml");
			await fs.writeFile(file, [
				"rules:",
				"  colons:",
				"    max-spaces-before: 0",
				"    max-spaces-after: 1",
				"",
			].join("\n"));

			const conf = await newConf(
				`extends: ${file}`,
				"rules:",
				"  hyphens:",
				"    max-spaces-after: 2",
				"",
			);

			expect(conf.rules).all.keys("colons", "hyphens");
			expect(conf.rules.colons).toMatchObject({
				"max-spaces-before": 0,
				"max-spaces-after": 1,
			});
			expect(conf.rules.hyphens).toMatchObject({
				"max-spaces-after": 2,
			});
			expect(conf.enabledRules()).toHaveLength(2);
		});
	});

	test("extend remove rule", async () => {
		await tempWorkspace({}, async ({ mkftemp }) => {
			const file = mkftemp(".yaml");
			await fs.writeFile(file, [
				"rules:",
				"  colons:",
				"    max-spaces-before: 0",
				"    max-spaces-after: 1",
				"  hyphens:",
				"    max-spaces-after: 2",
				"",
			].join("\n"));

			const conf = await newConf(
				`extends: ${file}`,
				"rules:",
				"  colons: disable",
				"",
			);

			expect(conf.rules).all.keys("colons", "hyphens");
			expect(conf.rules.colons).toBe(false);
			expect(conf.rules.hyphens).toMatchObject({
				"max-spaces-after": 2,
			});
			expect(conf.enabledRules()).toHaveLength(1);
		});
	});

	test("extend edit rule", async () => {
		await tempWorkspace({}, async ({ mkftemp }) => {
			const file = mkftemp(".yaml");
			await fs.writeFile(file, [
				"rules:",
				"  colons:",
				"    max-spaces-before: 0",
				"    max-spaces-after: 1",
				"  hyphens:",
				"    max-spaces-after: 2",
				"",
			].join("\n"));

			const conf = await newConf(
				`extends: ${file}`,
				"rules:",
				"  colons:",
				"    max-spaces-before: 3",
				"    max-spaces-after: 4",
				"",
			);

			expect(conf.rules).all.keys("colons", "hyphens");
			expect(conf.rules.colons).toMatchObject({
				"max-spaces-before": 3,
				"max-spaces-after": 4,
			});
			expect(conf.rules.hyphens).toMatchObject({
				"max-spaces-after": 2,
			});
			expect(conf.enabledRules()).toHaveLength(2);
		});
	});

	test("extend reeenable rule", async () => {
		await tempWorkspace({}, async ({ mkftemp }) => {
			const file = mkftemp(".yaml");
			await fs.writeFile(file, [
				"rules:",
				"  colons:",
				"    max-spaces-before: 0",
				"    max-spaces-after: 1",
				"  hyphens: disable",
				"",
			].join("\n"));

			const conf = await newConf(
				`extends: ${file}`,
				"rules:",
				"  hyphens:",
				"    max-spaces-after: 2",
				"",
			);

			expect(conf.rules).all.keys("colons", "hyphens");
			expect(conf.rules.colons).toMatchObject({
				"max-spaces-before": 0,
				"max-spaces-after": 1,
			});
			expect(conf.rules.hyphens).toMatchObject({
				"max-spaces-after": 2,
			});
			expect(conf.enabledRules()).toHaveLength(2);
		});
	});

	test("extend recursive default values", async () => {
		await tempWorkspace({}, async ({ mkftemp }) => {
			let conf: YamlLintConfig;
			let file: string;

			file = mkftemp(".yaml");
			await fs.writeFile(file, [
				"rules:",
				"  braces:",
				"    max-spaces-inside: 1248",
				"",
			].join("\n"));

			conf = await newConf(
				`extends: ${file}`,
				"rules:",
				"  braces:",
				"    min-spaces-inside-empty: 2357",
				"",
			);

			expect(conf.rules.braces).toMatchObject({
				"min-spaces-inside": 0,
				"max-spaces-inside": 1248,
				"min-spaces-inside-empty": 2357,
				"max-spaces-inside-empty": -1,
			});



			file = mkftemp(".yaml");
			await fs.writeFile(file, [
				"rules:",
				"  colons:",
				"    max-spaces-before: 1337",
				"",
			].join("\n"));

			conf = await newConf(
				`extends: ${file}`,
				"rules:",
				"  colons: enable",
				"",
			);

			expect(conf.rules.colons).toMatchObject({
				"max-spaces-before": 1337,
				"max-spaces-after": 1,
			});



			file = mkftemp(".yaml");
			await fs.writeFile(file, [
				"rules:",
				"  colons:",
				"    max-spaces-before: 1337",
				"",
			].join("\n"));

			const file2 = mkftemp(".yaml");
			await fs.writeFile(file2, [
				`extends: ${file}`,
				"rules:",
				"  colons: disable",
				"",
			].join("\n"));

			conf = await newConf(
				`extends: ${file2}`,
				"rules:",
				"  colons: enable",
				"",
			);

			expect(conf.rules.colons).toMatchObject({
				"max-spaces-before": 0,
				"max-spaces-after": 1,
			});
		});
	});

	test("extended ignore str", async () => {
		await tempWorkspace({}, async ({ mkftemp }) => {
			const file = mkftemp(".yaml");
			await fs.writeFile(file, [
				"ignore: |",
				"  *.template.yaml",
				"",
			].join("\n"));

			const conf = await newConf(`extends: ${file}\n`);

			expect(conf.isFileIgnored("test.template.yaml")).toBe(true);
			expect(conf.isFileIgnored("test.yaml")).toBe(false);
		});
	});
});



describe("Extended Library Config Test Case", () => {
	const run = async (
		config: string[],
		fn: (old: YamlLintConfig, conf: YamlLintConfig) => void | Promise<void>,
	) => {
		const old = await newConf("extends: default");
		const conf = await newConf(...config);

		await fn(old, conf);

		expect(conf.rules).all.keys(Object.keys(old.rules));
		expect(conf.rules).toStrictEqual(old.rules);
	};

	test("extends config disable rule", async () => {
		await run([
			"extends: default",
			"rules:",
			"  trailing-spaces: disable",
			"",
		], (old) => {
			old.rules["trailing-spaces"] = false;
		});
	});

	test("extends config override whole rule", async () => {
		await run([
			"extends: default",
			"rules:",
			"  empty-lines:",
			"    max: 42",
			"    max-start: 43",
			"    max-end: 44",
			"",
		], (old, conf) => {
			expect.assert.ok(old.rules["empty-lines"]);
			old.rules["empty-lines"].max = 42;
			old.rules["empty-lines"]["max-start"] = 43;
			old.rules["empty-lines"]["max-end"] = 44;

			expect(conf.rules["empty-lines"]).toMatchObject({
				max: 42,
				"max-start": 43,
				"max-end": 44,
			});
		});
	});

	test("extends config override rule partly", async () => {
		await run([
			"extends: default",
			"rules:",
			"  empty-lines:",
			"    max-start: 42",
			"",
		], (old, conf) => {
			expect.assert.ok(old.rules["empty-lines"]);
			old.rules["empty-lines"]["max-start"] = 42;

			expect(conf.rules["empty-lines"]).toMatchObject({
				max: 2,
				"max-start": 42,
				"max-end": 0,
			});
		});
	});
});



describe("Ignore Config Test Case", () => {
	const badYaml = [
		"---",
		"- key: val1",
		"  key: val2",
		"- trailing space ",
		"-    lonely hyphen",
		"",
	];

	let dirname: BuildTempWorkspaceReturnType["dirname"];
	let resolve: BuildTempWorkspaceReturnType["resolve"];
	let cleanup: BuildTempWorkspaceReturnType["cleanup"] = async () => {
		// pass
	};
	afterAll(() => cleanup());
	beforeAll(async () => {
		const temp = await buildTempWorkspace({
			"bin/file.lint-me-anyway.yaml": badYaml,
			"bin/file.yaml": badYaml,
			"file-at-root.yaml": badYaml,
			"file.dont-lint-me.yaml": badYaml,
			"ign-dup/file.yaml": badYaml,
			"ign-dup/sub/dir/file.yaml": badYaml,
			"ign-trail/file.yaml": badYaml,
			"include/ign-dup/sub/dir/file.yaml": badYaml,
			"s/s/ign-trail/file.yaml": badYaml,
			"s/s/ign-trail/s/s/file.yaml": badYaml,
			"s/s/ign-trail/s/s/file2.lint-me-anyway.yaml": badYaml,
		});
		dirname = temp.dirname;
		resolve = temp.resolve;
		cleanup = temp.cleanup;
	});



	test("mutually exclusive ignore keys", async () => {
		await expect(newConf(
			"extends: default",
			"ignore-from-file: .gitignore",
			"ignore: |",
			"  *.dont-line-me.yaml",
			"  /bin/",
			"",
		)).rejects.toThrow();
	});

	test("ignore from file not exist", async () => {
		await expect(newConf(
			"extends: default",
			"ignore-from-file: not_found_file",
			"",
		)).rejects.toThrow("ENOENT");
	});

	test("ignore from file incorrect type", async () => {
		await expect(newConf(
			"extends: default",
			"ignore-from-file: 0",
			"",
		)).rejects.toThrow();
		await expect(newConf(
			"extends: default",
			"ignore-from-file: [0]",
			"",
		)).rejects.toThrow();
	});



	const docstart = "[warning] missing document start \"---\" (document-start)";
	const keydup = "[error] duplication of key \"key\" in mapping (key-duplicates)";
	const trailing = "[error] trailing spaces (trailing-spaces)";
	const hyphen = "[error] too many spaces after hyphen (hyphens)";
	const ignoreWorkspace = async (
		config: string[] | Record<string, string[]> | undefined,
		args: string[],
		cb: (data: Pick<RunContextData, "returncode"> & { out: string[] }) => void,
	) => {
		const files = !config ? undefined : Array.isArray(config) ? { ".yamllint": config } : config;
		try {
			if (files) {
				for (const filename in files) {
					await fs.writeFile(
						resolve(filename),
						files[filename].join("\n"),
					);
				}
			}

			const { returncode, stdout } = await runContext({
				chdir: dirname,
				args: ["-f", "parsable", ...args],
			});
			const out = splitlines(stdout).sort();
			cb({ returncode, out });
		} finally {
			if (files) {
				for (const filename in files) {
					await fs.rm(resolve(filename));
				}
			}
		}
	};

	test("no ignore", async () => {
		await ignoreWorkspace(undefined, ["."], ({ returncode, out }) => {
			expect(returncode).not.toEqual(0);
			expect(out).toStrictEqual([
				`bin/file.lint-me-anyway.yaml:3:3: ${keydup}`,
				`bin/file.lint-me-anyway.yaml:4:17: ${trailing}`,
				`bin/file.lint-me-anyway.yaml:5:5: ${hyphen}`,
				`bin/file.yaml:3:3: ${keydup}`,
				`bin/file.yaml:4:17: ${trailing}`,
				`bin/file.yaml:5:5: ${hyphen}`,
				`file-at-root.yaml:3:3: ${keydup}`,
				`file-at-root.yaml:4:17: ${trailing}`,
				`file-at-root.yaml:5:5: ${hyphen}`,
				`file.dont-lint-me.yaml:3:3: ${keydup}`,
				`file.dont-lint-me.yaml:4:17: ${trailing}`,
				`file.dont-lint-me.yaml:5:5: ${hyphen}`,
				`ign-dup/file.yaml:3:3: ${keydup}`,
				`ign-dup/file.yaml:4:17: ${trailing}`,
				`ign-dup/file.yaml:5:5: ${hyphen}`,
				`ign-dup/sub/dir/file.yaml:3:3: ${keydup}`,
				`ign-dup/sub/dir/file.yaml:4:17: ${trailing}`,
				`ign-dup/sub/dir/file.yaml:5:5: ${hyphen}`,
				`ign-trail/file.yaml:3:3: ${keydup}`,
				`ign-trail/file.yaml:4:17: ${trailing}`,
				`ign-trail/file.yaml:5:5: ${hyphen}`,
				`include/ign-dup/sub/dir/file.yaml:3:3: ${keydup}`,
				`include/ign-dup/sub/dir/file.yaml:4:17: ${trailing}`,
				`include/ign-dup/sub/dir/file.yaml:5:5: ${hyphen}`,
				`s/s/ign-trail/file.yaml:3:3: ${keydup}`,
				`s/s/ign-trail/file.yaml:4:17: ${trailing}`,
				`s/s/ign-trail/file.yaml:5:5: ${hyphen}`,
				`s/s/ign-trail/s/s/file.yaml:3:3: ${keydup}`,
				`s/s/ign-trail/s/s/file.yaml:4:17: ${trailing}`,
				`s/s/ign-trail/s/s/file.yaml:5:5: ${hyphen}`,
				`s/s/ign-trail/s/s/file2.lint-me-anyway.yaml:3:3: ${keydup}`,
				`s/s/ign-trail/s/s/file2.lint-me-anyway.yaml:4:17: ${trailing}`,
				`s/s/ign-trail/s/s/file2.lint-me-anyway.yaml:5:5: ${hyphen}`,
			]);
		});
	});

	test("run with ignore str", async () => {
		await ignoreWorkspace([
			"extends: default",
			"ignore: |",
			"  *.dont-lint-me.yaml",
			"  /bin/*",
			"  !/bin/*.lint-me-anyway.yaml",
			"rules:",
			"  key-duplicates:",
			"    ignore: |",
			"      /ign-dup",
			"  trailing-spaces:",
			"    ignore: |",
			"      **/ign-trail/**",
			"      !**/ign-trail/**/",
			"      !**/*.lint-me-anyway.yaml",
			"",
		], [
			".",
		], ({ out }) => {
			expect(out).toStrictEqual([
				`.yamllint:1:1: ${docstart}`,
				`bin/file.lint-me-anyway.yaml:3:3: ${keydup}`,
				`bin/file.lint-me-anyway.yaml:4:17: ${trailing}`,
				`bin/file.lint-me-anyway.yaml:5:5: ${hyphen}`,
				`file-at-root.yaml:3:3: ${keydup}`,
				`file-at-root.yaml:4:17: ${trailing}`,
				`file-at-root.yaml:5:5: ${hyphen}`,
				`ign-dup/file.yaml:4:17: ${trailing}`,
				`ign-dup/file.yaml:5:5: ${hyphen}`,
				`ign-dup/sub/dir/file.yaml:4:17: ${trailing}`,
				`ign-dup/sub/dir/file.yaml:5:5: ${hyphen}`,
				`ign-trail/file.yaml:3:3: ${keydup}`,
				`ign-trail/file.yaml:5:5: ${hyphen}`,
				`include/ign-dup/sub/dir/file.yaml:3:3: ${keydup}`,
				`include/ign-dup/sub/dir/file.yaml:4:17: ${trailing}`,
				`include/ign-dup/sub/dir/file.yaml:5:5: ${hyphen}`,
				`s/s/ign-trail/file.yaml:3:3: ${keydup}`,
				`s/s/ign-trail/file.yaml:5:5: ${hyphen}`,
				`s/s/ign-trail/s/s/file.yaml:3:3: ${keydup}`,
				`s/s/ign-trail/s/s/file.yaml:5:5: ${hyphen}`,
				`s/s/ign-trail/s/s/file2.lint-me-anyway.yaml:3:3: ${keydup}`,
				`s/s/ign-trail/s/s/file2.lint-me-anyway.yaml:4:17: ${trailing}`,
				`s/s/ign-trail/s/s/file2.lint-me-anyway.yaml:5:5: ${hyphen}`,
			]);
		});
	});

	test("run with ignore list", async () => {
		await ignoreWorkspace([
			"extends: default",
			"ignore:",
			"  - '*.dont-lint-me.yaml'",
			"  - '/bin/*'",
			"  - '!/bin/*.lint-me-anyway.yaml'",
			"rules:",
			"  key-duplicates:",
			"    ignore:",
			"      - '/ign-dup'",
			"  trailing-spaces:",
			"    ignore:",
			"      - '**/ign-trail/**'",
			"      - '!**/ign-trail/**/'",
			"      - '!**/*.lint-me-anyway.yaml'",
			"",
		], [
			".",
		], ({ out }) => {
			expect(out).toStrictEqual([
				`.yamllint:1:1: ${docstart}`,
				`bin/file.lint-me-anyway.yaml:3:3: ${keydup}`,
				`bin/file.lint-me-anyway.yaml:4:17: ${trailing}`,
				`bin/file.lint-me-anyway.yaml:5:5: ${hyphen}`,
				`file-at-root.yaml:3:3: ${keydup}`,
				`file-at-root.yaml:4:17: ${trailing}`,
				`file-at-root.yaml:5:5: ${hyphen}`,
				`ign-dup/file.yaml:4:17: ${trailing}`,
				`ign-dup/file.yaml:5:5: ${hyphen}`,
				`ign-dup/sub/dir/file.yaml:4:17: ${trailing}`,
				`ign-dup/sub/dir/file.yaml:5:5: ${hyphen}`,
				`ign-trail/file.yaml:3:3: ${keydup}`,
				`ign-trail/file.yaml:5:5: ${hyphen}`,
				`include/ign-dup/sub/dir/file.yaml:3:3: ${keydup}`,
				`include/ign-dup/sub/dir/file.yaml:4:17: ${trailing}`,
				`include/ign-dup/sub/dir/file.yaml:5:5: ${hyphen}`,
				`s/s/ign-trail/file.yaml:3:3: ${keydup}`,
				`s/s/ign-trail/file.yaml:5:5: ${hyphen}`,
				`s/s/ign-trail/s/s/file.yaml:3:3: ${keydup}`,
				`s/s/ign-trail/s/s/file.yaml:5:5: ${hyphen}`,
				`s/s/ign-trail/s/s/file2.lint-me-anyway.yaml:3:3: ${keydup}`,
				`s/s/ign-trail/s/s/file2.lint-me-anyway.yaml:4:17: ${trailing}`,
				`s/s/ign-trail/s/s/file2.lint-me-anyway.yaml:5:5: ${hyphen}`,
			]);
		});
	});

	test("run with ignore from file", async () => {
		await ignoreWorkspace({
			".yamllint": [
				"extends: default",
				"ignore-from-file: .gitignore",
				"rules:",
				"  key-duplicates:",
				"    ignore-from-file: .ignore-key-duplicates",
				"",
			],
			".gitignore": [
				"*.dont-lint-me.yaml",
				"/bin/*",
				"!/bin/*.lint-me-anyway.yaml",
			],
			".ignore-key-duplicates": [
				"/ign-dup",
			],
		}, [
			".",
		], ({ out }) => {
			expect(out).toStrictEqual([
				`.yamllint:1:1: ${docstart}`,
				`bin/file.lint-me-anyway.yaml:3:3: ${keydup}`,
				`bin/file.lint-me-anyway.yaml:4:17: ${trailing}`,
				`bin/file.lint-me-anyway.yaml:5:5: ${hyphen}`,
				`file-at-root.yaml:3:3: ${keydup}`,
				`file-at-root.yaml:4:17: ${trailing}`,
				`file-at-root.yaml:5:5: ${hyphen}`,
				`ign-dup/file.yaml:4:17: ${trailing}`,
				`ign-dup/file.yaml:5:5: ${hyphen}`,
				`ign-dup/sub/dir/file.yaml:4:17: ${trailing}`,
				`ign-dup/sub/dir/file.yaml:5:5: ${hyphen}`,
				`ign-trail/file.yaml:3:3: ${keydup}`,
				`ign-trail/file.yaml:4:17: ${trailing}`,
				`ign-trail/file.yaml:5:5: ${hyphen}`,
				`include/ign-dup/sub/dir/file.yaml:3:3: ${keydup}`,
				`include/ign-dup/sub/dir/file.yaml:4:17: ${trailing}`,
				`include/ign-dup/sub/dir/file.yaml:5:5: ${hyphen}`,
				`s/s/ign-trail/file.yaml:3:3: ${keydup}`,
				`s/s/ign-trail/file.yaml:4:17: ${trailing}`,
				`s/s/ign-trail/file.yaml:5:5: ${hyphen}`,
				`s/s/ign-trail/s/s/file.yaml:3:3: ${keydup}`,
				`s/s/ign-trail/s/s/file.yaml:4:17: ${trailing}`,
				`s/s/ign-trail/s/s/file.yaml:5:5: ${hyphen}`,
				`s/s/ign-trail/s/s/file2.lint-me-anyway.yaml:3:3: ${keydup}`,
				`s/s/ign-trail/s/s/file2.lint-me-anyway.yaml:4:17: ${trailing}`,
				`s/s/ign-trail/s/s/file2.lint-me-anyway.yaml:5:5: ${hyphen}`,
			]);
		});
	});

	test("run with ignored from file", async () => {
		await ignoreWorkspace({
			".yamllint": [
				"extends: default",
				"ignore-from-file: [.gitignore, .yamlignore]",
				"",
			],
			".gitignore": [
				"*.dont-lint-me.yaml",
				"/bin/*",
			],
			".yamlignore": [
				"!/bin/*.lint-me-anyway.yaml",
			],
		}, [
			".",
		], ({ out }) => {
			expect(out).toStrictEqual([
				`.yamllint:1:1: ${docstart}`,
				`bin/file.lint-me-anyway.yaml:3:3: ${keydup}`,
				`bin/file.lint-me-anyway.yaml:4:17: ${trailing}`,
				`bin/file.lint-me-anyway.yaml:5:5: ${hyphen}`,
				`file-at-root.yaml:3:3: ${keydup}`,
				`file-at-root.yaml:4:17: ${trailing}`,
				`file-at-root.yaml:5:5: ${hyphen}`,
				`ign-dup/file.yaml:3:3: ${keydup}`,
				`ign-dup/file.yaml:4:17: ${trailing}`,
				`ign-dup/file.yaml:5:5: ${hyphen}`,
				`ign-dup/sub/dir/file.yaml:3:3: ${keydup}`,
				`ign-dup/sub/dir/file.yaml:4:17: ${trailing}`,
				`ign-dup/sub/dir/file.yaml:5:5: ${hyphen}`,
				`ign-trail/file.yaml:3:3: ${keydup}`,
				`ign-trail/file.yaml:4:17: ${trailing}`,
				`ign-trail/file.yaml:5:5: ${hyphen}`,
				`include/ign-dup/sub/dir/file.yaml:3:3: ${keydup}`,
				`include/ign-dup/sub/dir/file.yaml:4:17: ${trailing}`,
				`include/ign-dup/sub/dir/file.yaml:5:5: ${hyphen}`,
				`s/s/ign-trail/file.yaml:3:3: ${keydup}`,
				`s/s/ign-trail/file.yaml:4:17: ${trailing}`,
				`s/s/ign-trail/file.yaml:5:5: ${hyphen}`,
				`s/s/ign-trail/s/s/file.yaml:3:3: ${keydup}`,
				`s/s/ign-trail/s/s/file.yaml:4:17: ${trailing}`,
				`s/s/ign-trail/s/s/file.yaml:5:5: ${hyphen}`,
				`s/s/ign-trail/s/s/file2.lint-me-anyway.yaml:3:3: ${keydup}`,
				`s/s/ign-trail/s/s/file2.lint-me-anyway.yaml:4:17: ${trailing}`,
				`s/s/ign-trail/s/s/file2.lint-me-anyway.yaml:5:5: ${hyphen}`,
			]);
		});
	});

	test("run with ignore with broken symlink", async () => {
		await tempWorkspace({
			"file-without-yaml-extension": "42\n",
			"link.yaml": "symlink://file-without-yaml-extension",
			"link-404.yaml": "symlink://file-that-does-not-exist",
		}, async ({ resolve }) => {
			const ctx = await runContext("-f", "parsable", ".");
			expect(ctx.returncode).not.toEqual(0);

			await fs.writeFile(resolve(".yamllint"), [
				"extends: default",
				"ignore: |",
				"  *404.yaml",
				"",
			].join("\n"));

			const { returncode, stdout } = await runContext("-f", "parsable", ".");
			const out = splitlines(stdout).sort();
			expect(returncode).toEqual(0);
			expect(out).toStrictEqual([
				`.yamllint:1:1: ${docstart}`,
				`link.yaml:1:1: ${docstart}`,
			]);
		});
	});

	test("run with ignore on ignored file", async () => {
		await ignoreWorkspace([
			"ignore: file.dont-lint-me.yaml",
			"rules:",
			"  trailing-spaces: enable",
			"  key-duplicates:",
			"    ignore: file-at-root.yaml",
			"",
		], [
			"file.dont-lint-me.yaml",
			"file-at-root.yaml",
		], ({ out }) => {
			expect(out).toStrictEqual([
				`file-at-root.yaml:4:17: ${trailing}`,
			]);
		});
	});

	test("ignored from file with multiple encodings", async () => {
		const createIgnoreFile = async (text: string, codec: string) => {
			const filepath = resolve(`${codec}.ignore`);
			await fs.writeFile(
				filepath,
				encode(text, codec),
			);
			return filepath;
		};

		const ignoreFiles = await Promise.all([
			["bin/file.lint-me-anyway.yaml\n", "utf_32_be"],
			["bin/file.yaml\n", "utf_32_be_sig"],
			["file-at-root.yaml\n", "utf_32_le"],
			["file.dont-lint-me.yaml\n", "utf_32_le_sig"],

			["ign-dup/file.yaml\n", "utf_16_be"],
			["ign-dup/sub/dir/file.yaml\n", "utf_16_be_sig"],
			["ign-trail/file.yaml\n", "utf_16_le"],
			["include/ign-dup/sub/dir/file.yaml\n", "utf_16_le_sig"],

			["s/s/ign-trail/file.yaml\n", "utf_8"],
			["s/s/ign-trail/s/s/file.yaml\ns/s/ign-trail/s/s/file2.lint-me-anyway.yaml\n.yamllint\n", "utf_8_sig"],
		].map(([text, codec]) => createIgnoreFile(text, codec)));

		const conf = [
			"---",
			"extends: default",
			`ignore-from-file: [${ignoreFiles.join(", ")}]`,
			"",
		];

		await ignoreWorkspace(undefined, [
			"-d", conf.join("\n"), ".",
		], ({ returncode }) => {
			expect(returncode).toEqual(0);
		});
	});
});
