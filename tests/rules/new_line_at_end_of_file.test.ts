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



describe("New Line at End of File Test Case", () => {
	const conf = ruleTestCase("new-line-at-end-of-file");

	test("disabled", async () => {
		const check = await conf(
			"new-line-at-end-of-file: disable",
			"empty-lines: disable",
			"document-start: disable",
		);

		await check([""]);
		await check(["\n"]);
		await check(["word"]);
		await check(["Sentence.\n"]);
	});

	test("enabled", async () => {
		const check = await conf(
			"new-line-at-end-of-file: enable",
			"empty-lines: disable",
			"document-start: disable",
		);

		await check([""]);
		await check(["\n"]);
		await check(["word"], [[1, 5]]);
		await check(["Sentence.\n"]);
		await check([
			"---",
			"yaml: document",
			"...",
		], [
			[3, 4],
		]);
	});
});
