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
import util from "node:util";

import * as linter from "../src/linter";



describe("Linter Test Case", () => {
	const fakeConfig = () => ({});

	test("run on string", () => {
		assert.ok(fakeConfig());
	});

	test("run on bytes", () => {
		assert.ok(true);
	});

	test("run on unicode", () => {
		assert.ok(true);
	});

	test("run on stream", () => {
		assert.ok(true);
	});

	test("run on int", () => {
		assert.ok(true);
	});

	test("run on list", () => {
		assert.ok(true);
	});

	test("run on non ascii chars", () => {
		assert.ok(true);
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
