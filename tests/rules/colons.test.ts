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

import { describe, test } from "node:test";

import { ruleTestCase } from "../common";



describe("Colons Test Case", () => {
	const conf = ruleTestCase("colons");

	test("disabled", async () => {
		const check = await conf(
			"colons: disable",
		);

		await check([
			"---",
			"object:",
			"  k1 : v1",
			"obj2:",
			"  k2     :",
			"    - 8",
			"  k3:",
			"    val",
			"  property   : value",
			"  prop2      : val2",
			"  propriété  : [valeur]",
			"  o:",
			"    k1: [v1, v2]",
			"  p:",
			"    - k3: >",
			"        val",
			"    - o: {k1: v1}",
			"    - p: kdjf",
			"    - q: val0",
			"    - q2:",
			"        - val1",
			"...",
			"",
		], [
		]);

		await check([
			"---",
			"object:",
			"  k1:   v1",
			"obj2:",
			"  k2:",
			"    - 8",
			"  k3:",
			"    val",
			"  property:     value",
			"  prop2:        val2",
			"  propriété:    [valeur]",
			"  o:",
			"    k1:  [v1, v2]",
			"",
		], [
		]);

		await check([
			"---",
			"obj:",
			"  p:",
			"    - k1: >",
			"        val",
			"    - k3:  >",
			"        val",
			"    - o: {k1: v1}",
			"    - o:  {k1: v1}",
			"    - q2:",
			"        - val1",
			"...",
			"",
		], [
		]);

		await check([
			"---",
			"a: {b: {c:  d, e : f}}",
			"",
		], [
		]);
	});

	describe("before", () => {
		test("enabled", async () => {
			const check = await conf(
				"colons: {max-spaces-before: 0, max-spaces-after: -1}",
			);

			await check([
				"---",
				"object:",
				"  k1:",
				"    - a",
				"    - b",
				"  k2: v2",
				"...",
				"",
			], [
			]);

			await check([
				"---",
				"object:",
				"  k1 :",
				"    - a",
				"    - b",
				"  k2: v2",
				"...",
				"",
			], [
				[3, 5],
			]);

			await check([
				"---",
				"lib :",
				"  - var",
				"...",
				"",
			], [
				[2, 4],
			]);

			await check([
				"---",
				"- lib :",
				"    - var",
				"...",
				"",
			], [
				[2, 6],
			]);

			await check([
				"---",
				"a: {b: {c : d, e : f}}",
				"",
			], [
				[2, 10],
				[2, 17],
			]);
		});

		test("max", async () => {
			const check = await conf(
				"colons: {max-spaces-before: 3, max-spaces-after: -1}",
			);

			await check([
				"---",
				"object :",
				"  k1   :",
				"    - a",
				"    - b",
				"  k2  : v2",
				"...",
				"",
			], [
			]);

			await check([
				"---",
				"object :",
				"  k1    :",
				"    - a",
				"    - b",
				"  k2  : v2",
				"...",
				"",
			], [
				[3, 8],
			]);
		});

		test("with explicit block mappings", async () => {
			const check = await conf(
				"colons: {max-spaces-before: 0, max-spaces-after: 1}",
			);

			await check([
				"---",
				"object:",
				"  ? key",
				"  : value",
				"...",
				"",
			], [
			]);

			await check([
				"---",
				"object :",
				"  ? key",
				"  : value",
				"...",
				"",
			], [
				[2, 7],
			]);

			await check([
				"---",
				"? >",
				"    multi-line",
				"    key",
				": >",
				"    multi-line",
				"    value",
				"...",
				"",
			], [
			]);

			await check([
				"---",
				"- ? >",
				"      multi-line",
				"      key",
				"  : >",
				"      multi-line",
				"      value",
				"...",
				"",
			], [
			]);

			await check([
				"---",
				"- ? >",
				"      multi-line",
				"      key",
				"  :  >",
				"       multi-line",
				"       value",
				"...",
				"",
			], [
				[5, 5],
			]);
		});
	});

	describe("after", () => {
		test("enabled", async () => {
			const check = await conf(
				"colons: {max-spaces-before: -1, max-spaces-after: 1}",
			);

			await check([
				"---",
				"key: value",
				"",
			], [
			]);

			await check([
				"---",
				"key:  value",
				"",
			], [
				[2, 6],
			]);

			await check([
				"---",
				"object:",
				"  k1:  [a, b]",
				"  k2: string",
				"",
			], [
				[3, 7],
			]);

			await check([
				"---",
				"object:",
				"  k1: [a, b]",
				"  k2:  string",
				"",
			], [
				[4, 7],
			]);

			await check([
				"---",
				"object:",
				"  other: {key:  value}",
				"...",
				"",
			], [
				[3, 16],
			]);

			await check([
				"---",
				"a: {b: {c:  d, e :  f}}",
				"",
			], [
				[2, 12],
				[2, 20],
			]);
		});

		test("enabled question mark", async () => {
			const check = await conf(
				"colons: {max-spaces-before: -1, max-spaces-after: 1}",
			);

			await check([
				"---",
				"? key",
				": value",
				"",
			], [
			]);

			await check([
				"---",
				"?  key",
				": value",
				"",
			], [
				[2, 3],
			]);

			await check([
				"---",
				"?  key",
				":  value",
				"",
			], [
				[2, 3],
				[3, 3],
			]);

			await check([
				"---",
				"- ?  key",
				"  :  value",
				"",
			], [
				[2, 5],
				[3, 5],
			]);
		});

		test("max", async () => {
			const check = await conf(
				"colons: {max-spaces-before: -1, max-spaces-after: 3}",
			);

			await check([
				"---",
				"object:",
				"  k1:  [a, b]",
				"",
			], [
			]);

			await check([
				"---",
				"object:",
				"  k1:    [a, b]",
				"",
			], [
				[3, 9],
			]);

			await check([
				"---",
				"object:",
				"  k2:  string",
				"",
			], [
			]);

			await check([
				"---",
				"object:",
				"  k2:    string",
				"",
			], [
				[3, 9],
			]);

			await check([
				"---",
				"object:",
				"  other: {key:  value}",
				"...",
				"",
			], [
			]);

			await check([
				"---",
				"object:",
				"  other: {key:    value}",
				"...",
				"",
			], [
				[3, 18],
			]);
		});

		test("with explicit block mappings", async () => {
			const check = await conf(
				"colons: {max-spaces-before: -1, max-spaces-after: 1}",
			);

			await check([
				"---",
				"object:",
				"  ? key",
				"  : value",
				"...",
				"",
			], [
			]);

			await check([
				"---",
				"object:",
				"  ? key",
				"  :  value",
				"...",
				"",
			], [
				[4, 5],
			]);
		});

		test("do not confound with trailing space", async () => {
			const check = await conf(
				"colons: {max-spaces-before: 1, max-spaces-after: 1}",
				"trailing-spaces: disable",
			);

			await check([
				"---",
				"trailing:     ",
				"  - spaces",
				"",
			], [
			]);
		});
	});

	test("both before/after", async () => {
		const check = await conf("colons: {max-spaces-before: 0, max-spaces-after: 1}");

		await check([
			"---",
			"obj:",
			"  string: text",
			"  k:",
			"    - 8",
			"  k3:",
			"    val",
			"  property: [value]",
			"",
		], [
		]);

		await check([
			"---",
			"object:",
			"  k1 :  v1",
			"",
		], [
			[3, 5],
			[3, 8],
		]);

		await check([
			"---",
			"obj:",
			"  string:  text",
			"  k :",
			"    - 8",
			"  k3:",
			"    val",
			"  property: {a: 1, b:  2, c : 3}",
			"",
		], [
			[3, 11],
			[4, 4],
			[8, 23],
			[8, 28],
		]);
	});

	test("with alias as key", async () => {
		const check = await conf("colons: {max-spaces-before: 0, max-spaces-after: 1}");

		await check([
			"---",
			"- anchor: &a key",
			"- *a: 42",
			"- {*a: 42}",
			"- *a : 42",
			"- {*a : 42}",
			"- *a  : 42",
			"- {*a  : 42}",
			"",
		], [
			[3, 7, "syntax"],
			[4, 8, "syntax"],
			[7, 6],
			[8, 7],
		]);
	});
});
