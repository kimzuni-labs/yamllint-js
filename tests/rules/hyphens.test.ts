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



describe("Hyphens Test Case", () => {
	const conf = ruleTestCase("hyphens");

	test("disabled", async () => {
		const check = await conf(
			"hyphens: disable",
		);

		await check([
			"---",
			"- elem1",
			"- elem2",
			"",
		], [
		]);

		await check([
			"---",
			"- elem1",
			"-  elem2",
			"",
		], [
		]);

		await check([
			"---",
			"-  elem1",
			"-  elem2",
			"",
		], [
		]);

		await check([
			"---",
			"-  elem1",
			"- elem2",
			"",
		], [
		]);

		await check([
			"---",
			"object:",
			"  - elem1",
			"  -  elem2",
			"",
		], [
		]);

		await check([
			"---",
			"object:",
			"  -  elem1",
			"  -  elem2",
			"",
		], [
		]);

		await check([
			"---",
			"object:",
			"  subobject:",
			"    - elem1",
			"    -  elem2",
			"",
		], [
		]);

		await check([
			"---",
			"object:",
			"  subobject:",
			"    -  elem1",
			"    -  elem2",
			"",
		], [
		]);
	});

	describe("max", () => {
		test("1", async () => {
			const check = await conf(
				"hyphens: {max-spaces-after: 1}",
			);

			await check([
				"---",
				"- elem1",
				"- elem2",
				"",
			], [
			]);

			await check([
				"---",
				"- elem1",
				"-  elem2",
				"",
			], [
				[3, 3],
			]);

			await check([
				"---",
				"-  elem1",
				"-  elem2",
				"",
			], [
				[2, 3],
				[3, 3],
			]);

			await check([
				"---",
				"-  elem1",
				"- elem2",
				"",
			], [
				[2, 3],
			]);

			await check([
				"---",
				"object:",
				"  - elem1",
				"  -  elem2",
				"",
			], [
				[4, 5],
			]);

			await check([
				"---",
				"object:",
				"  -  elem1",
				"  -  elem2",
				"",
			], [
				[3, 5],
				[4, 5],
			]);

			await check([
				"---",
				"object:",
				"  subobject:",
				"    - elem1",
				"    -  elem2",
				"",
			], [
				[5, 7],
			]);

			await check([
				"---",
				"object:",
				"  subobject:",
				"    -  elem1",
				"    -  elem2",
				"",
			], [
				[4, 7],
				[5, 7],
			]);
		});

		test("3", async () => {
			const check = await conf(
				"hyphens: {max-spaces-after: 3}",
			);

			await check([
				"---",
				"-   elem1",
				"-   elem2",
				"",
			], [
			]);

			await check([
				"---",
				"-    elem1",
				"-   elem2",
				"",
			], [
				[2, 5],
			]);

			await check([
				"---",
				"a:",
				"  b:",
				"    -   elem1",
				"    -   elem2",
				"",
			], [
			]);

			await check([
				"---",
				"a:",
				"  b:",
				"    -    elem1",
				"    -    elem2",
				"",
			], [
				[4, 9],
				[5, 9],
			]);
		});
	});
});
