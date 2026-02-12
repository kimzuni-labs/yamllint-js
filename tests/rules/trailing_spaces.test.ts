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

import { describe, test } from "vitest";

import { ruleTestCase } from "../common";



describe("Trailing Spaces Test Case", () => {
	const conf = ruleTestCase("trailing-spaces");

	test("disabled", async () => {
		const check = await conf("trailing-spaces: disable");

		await check([
			"",
		], [
		]);

		await check([
			"\n",
		], [
		]);

		await check([
			"    \n",
		], [
		]);

		await check([
			"---",
			"some: text ",
			"",
		], [
		]);
	});

	describe("enabled", () => {
		test("normal", async () => {
			const check = await conf("trailing-spaces: enable");

			await check([
				"",
			], [
			]);

			await check([
				"\n",
			], [
			]);

			await check([
				"    \n",
			], [
				[1, 1],
			]);

			await check([
				"\t\t\t\n",
			], [
				[1, 1],
			]);

			await check([
				"---",
				"some: text ",
				"",
			], [
				[2, 11],
			]);

			await check([
				"---",
				"some: text\t",
				"",
			], [
				[2, 11],
			]);
		});

		test("with dos new lines", async () => {
			const check = await conf("trailing-spaces: enable", "new-lines: {type: dos}");

			await check([
				"---\r",
				"some: text\r",
				"",
			], [
			]);

			await check([
				"---\r",
				"some: text \r",
				"",
			], [
				[2, 11],
			]);
		});
	});
});
