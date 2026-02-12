/*
 * Copyright (C) 2023 Adrien Vergé
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

/* eslint-disable @stylistic/line-comment-position, @stylistic/no-multi-spaces */

import { describe, test } from "vitest";

import { ruleTestCase, type CheckProblem } from "../common";



describe("Anchors Test Case", () => {
	const conf = ruleTestCase("anchors");

	const check = async (
		config: string[],
		errors1: CheckProblem[] = [],
		errors2: CheckProblem[] = [],
	) => {
		const check = await conf(...config);
		await Promise.all([
			check(keys[0], errors1),
			check(keys[1], errors2),
		]);
	};

	const keys = [
		[
			"---",
			"- &b true",
			"- &i 42",
			"- &s hello",
			"- &f_m {k: v}",
			"- &f_s [1, 2]",
			"- *b",
			"- *i",
			"- *s",
			"- *f_m",
			"- *f_s",
			"---", // redeclare anchors in a new document
			"- &b true",
			"- &i 42",
			"- &s hello",
			"- *b",
			"- *i",
			"- *s",
			"---",
			"block mapping: &b_m",
			"  key: value",
			"extended:",
			"  <<: *b_m",
			"  foo: bar",
			"---",
			"{a: 1, &x b: 2, c: &y 3, *x : 4, e: *y}",
			"...",
			"",
		],
		[
			"---",
			"- &i 42",
			"---",
			"- &b true",
			"- &b true",
			"- &b true",
			"- &s hello",
			"- *b",
			"- *i",    // declared in a previous document
			"- *f_m",  // never declared
			"- *f_m",
			"- *f_m",
			"- *f_s",  // declared after
			"- &f_s [1, 2]",
			"...",
			"---",
			"block mapping: &b_m",
			"  key: value",
			"---",
			"block mapping 1: &b_m_bis",
			"  key: value",
			"block mapping 2: &b_m_bis",
			"  key: value",
			"extended:",
			"  <<: *b_m",
			"  foo: bar",
			"---",
			"{a: 1, &x b: 2, c: &x 3, *x : 4, e: *y}",
			"...",
			"",
		],
	];



	test("disabled", async () => {
		await check([
			"anchors: disable",
		]);
	});

	describe("forbid", () => {
		test("undeclared aliases", async () => {
			await check([
				"anchors:",
				"  forbid-undeclared-aliases: true",
				"  forbid-duplicated-anchors: false",
				"  forbid-unused-anchors: false",
			], [
			], [
				[9, 3],
				[10, 3],
				[11, 3],
				[12, 3],
				[13, 3],
				[25, 7],
				[28, 37],
			]);
		});

		test("duplicated anchors", async () => {
			await check([
				"anchors:",
				"  forbid-undeclared-aliases: false",
				"  forbid-duplicated-anchors: true",
				"  forbid-unused-anchors: false",
			], [
			], [
				[5, 3],
				[6, 3],
				[22, 18],
				[28, 20],
			]);
		});

		test("unused anchors", async () => {
			await check([
				"anchors:",
				"  forbid-undeclared-aliases: false",
				"  forbid-duplicated-anchors: false",
				"  forbid-unused-anchors: true",
			], [
			], [
				[2, 3],
				[7, 3],
				[14, 3],
				[17, 16],
				[22, 18],
			]);
		});
	});
});
