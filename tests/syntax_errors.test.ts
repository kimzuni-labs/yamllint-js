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

import { ruleTestCase } from "./common";



describe("Syntax Error Test Case", async () => {
	const check = await ruleTestCase("syntax")();

	test("syntax errors", async () => {
		await check([
			"---",
			"this is not: valid: YAML",
			"",
		], [
			[2, 14],
		]);

		await check([
			"---",
			"this is: valid YAML",
			"",
			"this is an error: [",
			"",
			"...",
			"",
		], [
			[6, 1],
		]);

		await check([
			"%YAML 1.2",
			"%TAG ! tag:clarkevans.com,2002:",
			"doc: ument",
			"...",
			"",
		], [
			[3, 1],
		]);
	});

	test("empty flows", async () => {
		await check([
			"---",
			"- []",
			"- {}",
			"- [",
			"]",
			"- {",
			"}",
			"...",
			"",
		], [
		]);
	});

	test("explicit mapping", async () => {
		await check([
			"---",
			"? key",
			": - value 1",
			"  - value 2",
			"...",
			"",
		], [
		]);

		await check([
			"---",
			"?",
			"  key",
			": {a: 1}",
			"...",
			"",
		], [
		]);

		await check([
			"---",
			"?",
			"  key",
			":",
			"  val",
			"...",
			"",
		], [
		]);
	});

	test("mapping between sequences", async () => {
		await check([
			"---",
			"? - Detroit Tigers",
			"  - Chicago cubs",
			":",
			"  - 2001-07-23",
			"",
			"? [New York Yankees,",
			"   Atlanta Braves]",
			": [2001-07-02, 2001-08-12,",
			"   2001-08-14]",
			"",
		], [
		]);
	});

	test("sets", async () => {
		await check([
			"---",
			"? key one",
			"? key two",
			"? [non, scalar, key]",
			"? key with value",
			": value",
			"...",
			"",
		], [
		]);

		await check([
			"---",
			"? - multi",
			"  - line",
			"  - keys",
			"? in:",
			"    a:",
			"      set",
			"...",
			"",
		], [
		]);
	});
});
