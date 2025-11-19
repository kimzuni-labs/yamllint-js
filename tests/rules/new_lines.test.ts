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
import { EOL } from "node:os";

import { ruleTestCase } from "../common";



describe("New Lines Test Case", () => {
	const conf = ruleTestCase("new-lines");

	const addRules: string[] = [
		"new-line-at-end-of-file: disable",
	];

	test("disabled", async () => {
		const check = await conf(
			...addRules,
			"new-lines: disable",
		);

		await check([
			"",
		], [
		]);

		await check([
			"\r",
		], [
		]);

		await check([
			"\n",
		], [
		]);

		await check([
			"\r\n",
		], [
		]);

		await check([
			"---\ntext\n",
		], [
		]);

		await check([
			"---\r\ntext\r\n",
		], [
		]);
	});

	describe("unix type", () => {
		test("normal", async () => {
			const check = await conf(
				...addRules,
				"new-lines: {type: unix}",
			);

			await check([
				"",
			], [
			]);

			await check([
				"\r",
			], [
			]);

			await check([
				"\n",
			], [
			]);

			await check([
				"\r\n",
			], [
				[1, 1],
			]);

			await check([
				"---\ntext\n",
			], [
			]);

			await check([
				"---\r\ntext\r\n",
			], [
				[1, 4],
			]);
		});

		test("required st sp", async () => {
			/*
			 * If we find a CRLF when looking for Unix newlines, yamllint
			 * should always raise, regardless of logic with
			 * require-starting-space.
			 */

			const check = await conf(
				...addRules,
				"new-lines: {type: unix}",
				"comments:",
				"  require-starting-space: true",
			);

			await check([
				"---\r\n#\r\n",
			], [
				[1, 4],
			]);
		});
	});

	test("dos type", async () => {
		const check = await conf(
			...addRules,
			"new-lines: {type: dos}",
		);

		await check([
			"",
		], [
		]);

		await check([
			"\r",
		], [
		]);

		await check([
			"\n",
		], [
			[1, 1],
		]);

		await check([
			"\r\n",
		], [
		]);

		await check([
			"---\ntext\n",
		], [
			[1, 4],
		]);

		await check([
			"---\r\ntext\r\n",
		], [
		]);
	});

	test("platform type", async () => {
		const check = await conf(
			...addRules,
			"new-lines: {type: platform}",
		);

		const INV = EOL === "\n" ? "\r\n" : "\n";

		await check([
			"",
		], [
		]);

		await check([
			EOL,
		], [
		]);

		await check([
			INV,
		], [
			[1, 1],
		]);

		await check([
			`---${EOL}text${EOL}`,
		], [
		]);

		await check([
			`---${INV}text${INV}`,
		], [
			[1, 4],
		]);

		await check([
			`---${INV}text${EOL}`,
		], [
			[1, 4],
		]);



		/*
		 * FIXME: the following tests currently don't work
		 * because only the first line is checked for line-endings
		 * see: issue #475
		 */

		await check([
			`---${EOL}text${INV}foo${EOL}`,
		], [
			// [2, 5],
		]);

		await check([
			`---${EOL}text${INV}`,
		], [
			// [2, 5],
		]);
	});
});
