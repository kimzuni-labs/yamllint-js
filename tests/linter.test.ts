/*
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

/* eslint-disable @typescript-eslint/no-floating-promises */

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { Readable } from "node:stream";
import util from "node:util";
import iconv from "iconv-lite";

import { YamlLintConfig } from "../src/config";
import * as linter from "../src/linter";



type Problems = ReturnType<typeof linter.run>;

const ArrayFromAsync = async (problems: Problems) => {
	const arr = [];
	for await (const p of problems) arr.push(p);
	return arr;
};

const isRejects = async (problems: Problems) => {
	await assert.rejects(() => ArrayFromAsync(problems));
};

describe("Linter Test Case", () => {
	const fakeConfig = () => YamlLintConfig.init({ content: "extends: default" });

	test("run on string", async () => {
		await ArrayFromAsync(linter.run("test: document", await fakeConfig()));
	});

	test("run on buffer", async () => {
		await ArrayFromAsync(linter.run(Buffer.from("test: document"), await fakeConfig()));
	});

	test("run on unicode", async () => {
		await ArrayFromAsync(linter.run("test: document", await fakeConfig()));
	});

	test("run on stream", async () => {
		await ArrayFromAsync(linter.run(Readable.from("hello"), await fakeConfig()));
	});

	test("run on int", async () => {
		await isRejects(linter.run(42 as unknown as string, await fakeConfig()));
	});

	test("run on list", async () => {
		await isRejects(linter.run("hello".split("") as unknown as string, await fakeConfig()));
	});

	test("run on non ascii chars", async () => {
		let s: string;

		s = "- hétérogénéité\n# 19.99 €\n";
		await ArrayFromAsync(linter.run(s, await fakeConfig()));
		await ArrayFromAsync(linter.run(iconv.encode(s, "utf-8"), await fakeConfig()));
		await ArrayFromAsync(linter.run(iconv.encode(s, "iso-8859-15"), await fakeConfig()));

		s = "- お早う御座います。\n# الأَبْجَدِيَّة العَرَبِيَّة\n";
		await ArrayFromAsync(linter.run(s, await fakeConfig()));
		await ArrayFromAsync(linter.run(iconv.encode(s, "utf-8"), await fakeConfig()));
	});

	test("linter problem repr without rule", () => {
		const problem = new linter.LintProblem(1, 2, "problem");
		assert.equal(util.inspect(problem), "1:2: problem");
	});

	test("linter problem repr with rule", () => {
		const problem = new linter.LintProblem(1, 2, "problem", "rule-id");
		assert.equal(util.inspect(problem), "1:2: problem (rule-id)");
	});
});
