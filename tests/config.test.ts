/*
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

/* eslint-disable @typescript-eslint/no-floating-promises */

import assert from "node:assert/strict";
import { describe, test, before, after } from "node:test";
import fs from "node:fs/promises";
import z from "zod";

import type { Rule } from "../src/types";
import {
	YamlLintConfig,
	YamlLintConfigError,
	validateRuleConf,
} from "../src/config";

import {
	buildTempWorkspace,
	tempWorkspace,
	type BuildTempWorkspaceReturnType,
} from "./common";



const newConf = (...strings: string[]) => YamlLintConfig.init({ content: strings.join("\n") });

const assertBasicError = async (
	block: () => Promise<unknown>,
	cb?: (e: Error) => unknown,
) => {
	await assert.rejects(
		block,
		(e) => {
			assert.ok(e instanceof Error);
			if (cb) cb(e);
			return true;
		},
	);
};

const assertConfigError = async (
	block: () => Promise<unknown>,
	cb?: (e: YamlLintConfigError) => unknown,
) => {
	await assert.rejects(
		block,
		(e) => {
			assert.ok(e instanceof YamlLintConfigError);
			if (cb) cb(e);
			return true;
		},
	);
};



describe("Simple Config Test Case", () => {
	test("parse config", async () => {
		const conf = await newConf(
			"rules:",
			"  colons:",
			"    max-spaces-before: 0",
			"    max-spaces-after: 1",
			"",
		);

		assert.deepStrictEqual(Object.keys(conf.rules), ["colons"]);
		assert.ok(conf.rules.colons);
		assert.equal(conf.rules.colons["max-spaces-before"], 0);
		assert.equal(conf.rules.colons["max-spaces-after"], 1);

		assert.equal(conf.enabledRules().length, 1);
	});

	test("invalid conf", async () => {
		await assertConfigError(() => newConf("not: valid: yaml"));
	});

	test("unknown rule", async () => {
		await assertConfigError(() => newConf(
			"rules:",
			"  this-one-does-not-exist: enable",
			"",
		), (e) => {
			assert.equal(e.message, "invalid config: no such rule: \"this-one-does-not-exist\"");
		});
	});

	test("missing option", async () => {
		const run = async (
			config: string[],
			before: number,
			after: number,
		) => {
			const conf = await newConf(...config);
			assert.ok(conf.rules.colons);
			assert.equal(conf.rules.colons["max-spaces-before"], before);
			assert.equal(conf.rules.colons["max-spaces-after"], after);
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
		await assertConfigError(() => newConf(
			"rules:",
			"  colons:",
			"    max-spaces-before: 0",
			"    max-spaces-after: 1",
			"    abcdef: true",
			"",
		), (e) => {
			assert.equal(e.message, "invalid config: unknown option \"abcdef\" for rule \"colons\"");
		});
	});

	// required rule: indentation
	test.skip("yes/no for booleans", async () => {
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
			assert.ok(conf.rules.indentation);
			assert.equal(conf.rules.indentation["indent-sequences"], indentSequences);
			assert.equal(conf.rules.indentation["check-multi-line-strings"], checkMultiLineStrings);
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

		await assertConfigError(() => run([
			"rules:",
			"  indentation:",
			"    spaces: 2",
			"    indent-sequences: YES!",
			"    check-multi-line-strings: false",
			"",
		], [
			"",
			false,
		]), (e) => {
			assert.ok(e.message.startsWith("invalid config: option \"indent-sequences\" of \"indentation\" should be in "));
		});
	});

	test("enable disable keywords", async () => {
		const conf = await newConf(
			"rules:",
			"  colons: enable",
			"  hyphens: disable",
			"",
		);
		assert.ok(conf.rules.colons);
		assert.equal(conf.rules.colons.level, "error");
		assert.equal(conf.rules.colons["max-spaces-after"], 1);
		assert.equal(conf.rules.colons["max-spaces-before"], 0);
		assert.equal(conf.rules.hyphens, false);
	});

	test("validate rule conf", async () => {
		const fake = {
			ID: "fake",
		} as Rule;

		assert.equal(await validateRuleConf(fake, false), false);
		assert.deepStrictEqual(await validateRuleConf(fake, {}), { level: "error" });

		await validateRuleConf(fake, { level: undefined });
		await validateRuleConf(fake, { level: "error" });
		await validateRuleConf(fake, { level: "warning" });
		await validateRuleConf(fake, { level: null });
		await assertConfigError(() => validateRuleConf(fake, { level: "invalid" }));

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
		await assertConfigError(() => validateRuleConf(fake, { height: 8 }));

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
		await assertConfigError(() => validateRuleConf(fake, { a: 1, b: 0 }));

		fake.CONF = z.object({
			choice: z.union([z.literal(true), z.literal(88), z.literal("str")]),
		});
		fake.DEFAULT = {
			choice: 88,
		};
		await validateRuleConf(fake, { choice: true });
		await validateRuleConf(fake, { choice: 88 });
		await validateRuleConf(fake, { choice: "str" });
		await assertConfigError(() => validateRuleConf(fake, { choice: false }));
		await assertConfigError(() => validateRuleConf(fake, { choice: 99 }));
		await assertConfigError(() => validateRuleConf(fake, { choice: "abc" }));

		fake.CONF = z.object({
			choice: z.union([z.int(), z.literal("hardcoded")]),
		});
		fake.DEFAULT = {
			choice: 1337,
		};
		await validateRuleConf(fake, { choice: 42 });
		await validateRuleConf(fake, { choice: "hardcoded" });
		await validateRuleConf(fake, {});
		await assertConfigError(() => validateRuleConf(fake, { choice: false }));
		await assertConfigError(() => validateRuleConf(fake, { choice: "abc" }));

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
		await assertConfigError(() => validateRuleConf(fake, { multiple: "item1" }));
		await assertConfigError(() => validateRuleConf(fake, { multiple: [""] }));
		await assertConfigError(() => validateRuleConf(fake, { multiple: ["item1", 4] }));
		await assertConfigError(() => validateRuleConf(fake, { multiple: ["item4"] }));
	});

	test("invalid rule", async () => {
		await assertConfigError(() => newConf(
			"rules:",
			"",
		), (e) => {
			assert.equal(e.message, "invalid config: rules should be a mapping");
		});

		await assertConfigError(() => newConf(
			"rules:",
			"  colons: invalid",
			"",
		), (e) => {
			assert.equal(e.message, "invalid config: rule \"colons\": should be either \"enable\", \"disable\" or a mapping");
		});
	});

	test("invalid ignore", async () => {
		await assertConfigError(() => newConf(
			"ignore: true",
			"",
		), (e) => {
			assert.equal(e.message, "invalid config: ignore should contain file patterns");
		});
	});

	test("invalid rule ignore", async () => {
		await assertConfigError(() => newConf(
			"rules:",
			"  colons:",
			"    ignore: true",
			"",
		), (e) => {
			assert.equal(e.message, "invalid config: ignore should contain file patterns");
		});
	});

	test("invalid rule ignore from file", async () => {
		await assertConfigError(() => newConf(
			"rules:",
			"  colons:",
			"    ignore-from-file: 1337",
			"",
		));
	});

	test("invalid locale", async () => {
		await assertConfigError(() => newConf(
			"locale: true",
			"",
		), (e) => {
			assert.equal(e.message, "invalid config: locale should be a string");
		});
	});

	test("invalid yaml files", async () => {
		await assertConfigError(() => newConf(
			"yaml-files: true",
			"",
		), (e) => {
			assert.equal(e.message, "invalid config: yaml-files should be a list of file patterns");
		});
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
		assert.deepStrictEqual(Object.keys(conf.rules), ["colons", "hyphens"]);
		assert.ok(conf.rules.colons);
		assert.equal(conf.rules.colons["max-spaces-before"], 0);
		assert.equal(conf.rules.colons["max-spaces-after"], 1);
		assert.ok(conf.rules.hyphens);
		assert.equal(conf.rules.hyphens["max-spaces-after"], 2);
		assert.equal(conf.enabledRules().length, 2);
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

			assert.deepStrictEqual(Object.keys(conf.rules), ["colons", "hyphens"]);
			assert.ok(conf.rules.colons);
			assert.equal(conf.rules.colons["max-spaces-before"], 0);
			assert.equal(conf.rules.colons["max-spaces-after"], 1);
			assert.ok(conf.rules.hyphens);
			assert.equal(conf.rules.hyphens["max-spaces-after"], 2);
			assert.equal(conf.enabledRules().length, 2);
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

			assert.deepStrictEqual(Object.keys(conf.rules), ["colons", "hyphens"]);
			assert.equal(conf.rules.colons, false);
			assert.ok(conf.rules.hyphens);
			assert.equal(conf.rules.hyphens["max-spaces-after"], 2);
			assert.equal(conf.enabledRules().length, 1);
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

			assert.deepStrictEqual(Object.keys(conf.rules), ["colons", "hyphens"]);
			assert.ok(conf.rules.colons);
			assert.equal(conf.rules.colons["max-spaces-before"], 3);
			assert.equal(conf.rules.colons["max-spaces-after"], 4);
			assert.ok(conf.rules.hyphens);
			assert.equal(conf.rules.hyphens["max-spaces-after"], 2);
			assert.equal(conf.enabledRules().length, 2);
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

			assert.deepStrictEqual(Object.keys(conf.rules), ["colons", "hyphens"]);
			assert.ok(conf.rules.colons);
			assert.equal(conf.rules.colons["max-spaces-before"], 0);
			assert.equal(conf.rules.colons["max-spaces-after"], 1);
			assert.ok(conf.rules.hyphens);
			assert.equal(conf.rules.hyphens["max-spaces-after"], 2);
			assert.equal(conf.enabledRules().length, 2);
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

			assert.ok(conf.rules.braces);
			assert.equal(conf.rules.braces["min-spaces-inside"], 0);
			assert.equal(conf.rules.braces["max-spaces-inside"], 1248);
			assert.equal(conf.rules.braces["min-spaces-inside-empty"], 2357);
			assert.equal(conf.rules.braces["max-spaces-inside-empty"], -1);



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

			assert.ok(conf.rules.colons);
			assert.equal(conf.rules.colons["max-spaces-before"], 1337);
			assert.equal(conf.rules.colons["max-spaces-after"], 1);



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

			assert.ok(conf.rules.colons);
			assert.equal(conf.rules.colons["max-spaces-before"], 0);
			assert.equal(conf.rules.colons["max-spaces-after"], 1);
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

			assert.equal(conf.isFileIgnored("test.template.yaml"), true);
			assert.equal(conf.isFileIgnored("test.yaml"), false);
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

		assert.deepStrictEqual(Object.keys(conf.rules).sort(), Object.keys(old.rules).sort());
		for (const rule in conf.rules) {
			assert.deepStrictEqual(conf.rules[rule], old.rules[rule]);
		}
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
			assert.ok(old.rules["empty-lines"]);
			old.rules["empty-lines"].max = 42;
			old.rules["empty-lines"]["max-start"] = 43;
			old.rules["empty-lines"]["max-end"] = 44;

			assert.ok(conf.rules["empty-lines"]);
			assert.equal(conf.rules["empty-lines"].max, 42);
			assert.equal(conf.rules["empty-lines"]["max-start"], 43);
			assert.equal(conf.rules["empty-lines"]["max-end"], 44);
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
			assert.ok(old.rules["empty-lines"]);
			old.rules["empty-lines"]["max-start"] = 42;

			assert.ok(conf.rules["empty-lines"]);
			assert.equal(conf.rules["empty-lines"].max, 2);
			assert.equal(conf.rules["empty-lines"]["max-start"], 42);
			assert.equal(conf.rules["empty-lines"]["max-end"], 0);
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

	let cleanup: BuildTempWorkspaceReturnType["cleanup"] = async () => {
		// pass
	};
	after(() => cleanup());
	before(async () => {
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
		cleanup = temp.cleanup;
	});



	test("mutually exclusive ignore keys", async () => {
		await assertConfigError(() => newConf(
			"extends: default",
			"ignore-from-file: .gitignore",
			"ignore: |",
			"  *.dont-line-me.yaml",
			"  /bin/",
			"",
		));
	});

	test("ignore from file not exist", async () => {
		await assertBasicError(() => newConf(
			"extends: default",
			"ignore-from-file: not_found_file",
			"",
		), (e) => {
			assert.ok("code" in e && e.code === "ENOENT");
		});
	});

	test("ignore from file incorrect type", async () => {
		await assertConfigError(() => newConf(
			"extends: default",
			"ignore-from-file: 0",
			"",
		));
		await assertConfigError(() => newConf(
			"extends: default",
			"ignore-from-file: [0]",
			"",
		));
	});



	// ...required cli
});
