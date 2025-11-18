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



describe("Brackets Test Case", () => {
	const conf = ruleTestCase("brackets");

	test("disabled", async () => {
		const check = await conf(
			"brackets: disable",
		);

		await check([
			"---",
			"array1: []",
			"array2: [ ]",
			"array3: [   a, b]",
			"array4: [a, b, c ]",
			"array5: [a, b, c ]",
			"array6: [  a, b, c ]",
			"array7: [   a, b, c ]",
			"",
		], [
		]);
	});

	describe("forbid", () => {
		test("false", async () => {
			const check = await conf(
				"brackets:",
				"  forbid: false",
			);

			await check([
				"---",
				"array: []",
				"",
			], [
			]);

			await check([
				"---",
				"array: [a, b]",
				"",
			], [
			]);

			await check([
				"---",
				"array: [",
				"  a,",
				"  b",
				"]",
				"",
			], [
			]);
		});

		test("true", async () => {
			const check = await conf(
				"brackets:",
				"  forbid: true",
			);

			await check([
				"---",
				"array:",
				"  - a",
				"  - b",
				"",
			], [
			]);

			await check([
				"---",
				"array: []",
				"",
			], [
				[2, 9],
			]);

			await check([
				"---",
				"array: [a, b]",
				"",
			], [
				[2, 9],
			]);

			await check([
				"---",
				"array: [",
				"  a,",
				"  b",
				"]",
				"",
			], [
				[2, 9],
			]);
		});

		test("non-empty", async () => {
			const check = await conf(
				"brackets:",
				"  forbid: non-empty",
			);

			await check([
				"---",
				"array:",
				"  - a",
				"  - b",
				"",
			], [
			]);

			await check([
				"---",
				"array: []",
				"",
			], [
			]);

			await check([
				"---",
				"array: [",
				"# a comment",
				"]",
				"",
			], [
			]);

			await check([
				"---",
				"array: [a, b]",
				"",
			], [
				[2, 9],
			]);

			await check([
				"---",
				"array: [",
				"  a,",
				"  b",
				"]",
				"",
			], [
				[2, 9],
			]);
		});
	});

	describe("spaces", () => {
		test("min", async () => {
			let check: Awaited<ReturnType<typeof conf>>;

			check = await conf(
				"brackets:",
				"  min-spaces-inside: 0",
				"  max-spaces-inside: -1",
				"  min-spaces-inside-empty: -1",
				"  max-spaces-inside-empty: -1",
			);

			await check([
				"---",
				"array: []",
				"",
			], [
			]);



			check = await conf(
				"brackets:",
				"  min-spaces-inside: 1",
				"  max-spaces-inside: -1",
				"  min-spaces-inside-empty: -1",
				"  max-spaces-inside-empty: -1",
			);

			await check([
				"---",
				"array: []",
				"",
			], [
				[2, 9],
			]);

			await check([
				"---",
				"array: [ ]",
				"",
			], [
			]);

			await check([
				"---",
				"array: [a, b]",
				"",
			], [
				[2, 9],
				[2, 13],
			]);

			await check([
				"---",
				"array: [ a, b ]",
				"",
			], [
			]);

			await check([
				"---",
				"array: [",
				"  a,",
				"  b",
				"]",
				"",
			], [
			]);



			check = await conf(
				"brackets:",
				"  min-spaces-inside: 3",
				"  max-spaces-inside: -1",
				"  min-spaces-inside-empty: -1",
				"  max-spaces-inside-empty: -1",
			);

			await check([
				"---",
				"array: [ a, b ]",
				"",
			], [
				[2, 10],
				[2, 15],
			]);

			await check([
				"---",
				"array: [   a, b   ]",
				"",
			], [
			]);
		});

		test("max", async () => {
			let check: Awaited<ReturnType<typeof conf>>;

			check = await conf(
				"brackets:",
				"  min-spaces-inside: -1",
				"  max-spaces-inside: 0",
				"  min-spaces-inside-empty: -1",
				"  max-spaces-inside-empty: -1",
			);

			await check([
				"---",
				"array: []",
				"",
			], [
			]);

			await check([
				"---",
				"array: [ ]",
				"",
			], [
				[2, 9],
			]);

			await check([
				"---",
				"array: [a, b]",
				"",
			], [
			]);

			await check([
				"---",
				"array: [ a, b ]",
				"",
			], [
				[2, 9],
				[2, 14],
			]);

			await check([
				"---",
				"array: [   a, b   ]",
				"",
			], [
				[2, 11],
				[2, 18],
			]);

			await check([
				"---",
				"array: [",
				"  a,",
				"  b",
				"]",
				"",
			], [
			]);



			check = await conf(
				"brackets:",
				"  min-spaces-inside: -1",
				"  max-spaces-inside: 3",
				"  min-spaces-inside-empty: -1",
				"  max-spaces-inside-empty: -1",
			);

			await check([
				"---",
				"array: [   a, b   ]",
				"",
			], [
			]);

			await check([
				"---",
				"array: [    a, b     ]",
				"",
			], [
				[2, 12],
				[2, 21],
			]);
		});

		test("both", async () => {
			let check: Awaited<ReturnType<typeof conf>>;

			check = await conf(
				"brackets:",
				"  min-spaces-inside: 0",
				"  max-spaces-inside: 0",
				"  min-spaces-inside-empty: -1",
				"  max-spaces-inside-empty: -1",
			);

			await check([
				"---",
				"array: []",
				"",
			], [
			]);

			await check([
				"---",
				"array: [ ]",
				"",
			], [
				[2, 9],
			]);

			await check([
				"---",
				"array: [   a, b]",
				"",
			], [
				[2, 11],
			]);



			check = await conf(
				"brackets:",
				"  min-spaces-inside: 1",
				"  max-spaces-inside: 1",
				"  min-spaces-inside-empty: -1",
				"  max-spaces-inside-empty: -1",
			);

			await check([
				"---",
				"array: [a, b, c ]",
				"",
			], [
				[2, 9],
			]);



			check = await conf(
				"brackets:",
				"  min-spaces-inside: 0",
				"  max-spaces-inside: 2",
				"  min-spaces-inside-empty: -1",
				"  max-spaces-inside-empty: -1",
			);

			await check([
				"---",
				"array: [a, b, c ]",
				"",
			], [
			]);

			await check([
				"---",
				"array: [  a, b, c ]",
				"",
			], [
			]);

			await check([
				"---",
				"array: [   a, b, c ]",
				"",
			], [
				[2, 11],
			]);
		});
	});

	describe("spaces empty", () => {
		test("min", async () => {
			let check: Awaited<ReturnType<typeof conf>>;

			check = await conf(
				"brackets:",
				"  min-spaces-inside: -1",
				"  max-spaces-inside: -1",
				"  min-spaces-inside-empty: 0",
				"  max-spaces-inside-empty: -1",
			);

			await check([
				"---",
				"array: []",
				"",
			], [
			]);



			check = await conf(
				"brackets:",
				"  min-spaces-inside: -1",
				"  max-spaces-inside: -1",
				"  min-spaces-inside-empty: 1",
				"  max-spaces-inside-empty: -1",
			);

			await check([
				"---",
				"array: []",
				"",
			], [
				[2, 9],
			]);

			await check([
				"---",
				"array: [ ]",
				"",
			], [
			]);



			check = await conf(
				"brackets:",
				"  min-spaces-inside: -1",
				"  max-spaces-inside: -1",
				"  min-spaces-inside-empty: 3",
				"  max-spaces-inside-empty: -1",
			);

			await check([
				"---",
				"array: []",
				"",
			], [
				[2, 9],
			]);

			await check([
				"---",
				"array: [   ]",
				"",
			], [
			]);
		});

		test("max", async () => {
			let check: Awaited<ReturnType<typeof conf>>;

			check = await conf(
				"brackets:",
				"  min-spaces-inside: -1",
				"  max-spaces-inside: -1",
				"  min-spaces-inside-empty: -1",
				"  max-spaces-inside-empty: 0",
			);

			await check([
				"---",
				"array: []",
				"",
			], [
			]);

			await check([
				"---",
				"array: [ ]",
				"",
			], [
				[2, 9],
			]);



			check = await conf(
				"brackets:",
				"  min-spaces-inside: -1",
				"  max-spaces-inside: -1",
				"  min-spaces-inside-empty: -1",
				"  max-spaces-inside-empty: 1",
			);

			await check([
				"---",
				"array: []",
				"",
			], [
			]);

			await check([
				"---",
				"array: [ ]",
				"",
			], [
			]);

			await check([
				"---",
				"array: [  ]",
				"",
			], [
				[2, 10],
			]);



			check = await conf(
				"brackets:",
				"  min-spaces-inside: -1",
				"  max-spaces-inside: -1",
				"  min-spaces-inside-empty: -1",
				"  max-spaces-inside-empty: 3",
			);

			await check([
				"---",
				"array: []",
				"",
			], [
			]);

			await check([
				"---",
				"array: [   ]",
				"",
			], [
			]);

			await check([
				"---",
				"array: [    ]",
				"",
			], [
				[2, 12],
			]);
		});



		test("both", async () => {
			const check = await conf(
				"brackets:",
				"  min-spaces-inside: -1",
				"  max-spaces-inside: -1",
				"  min-spaces-inside-empty: 1",
				"  max-spaces-inside-empty: 2",
			);

			await check([
				"---",
				"array: []",
				"",
			], [
				[2, 9],
			]);

			await check([
				"---",
				"array: [ ]",
				"",
			], [
			]);

			await check([
				"---",
				"array: [  ]",
				"",
			], [
			]);

			await check([
				"---",
				"array: [   ]",
				"",
			], [
				[2, 11],
			]);
		});
	});

	test("mixed empty nonempty", async () => {
		let check: Awaited<ReturnType<typeof conf>>;

		check = await conf(
			"brackets:",
			"  min-spaces-inside: 1",
			"  max-spaces-inside: -1",
			"  min-spaces-inside-empty: 0",
			"  max-spaces-inside-empty: 0",
		);

		await check([
			"---",
			"array: [ a, b ]",
			"",
		], [
		]);

		await check([
			"---",
			"array: [a, b]",
			"",
		], [
			[2, 9],
			[2, 13],
		]);

		await check([
			"---",
			"array: []",
			"",
		], [
		]);

		await check([
			"---",
			"array: [ ]",
			"",
		], [
			[2, 9],
		]);



		check = await conf(
			"brackets:",
			"  min-spaces-inside: -1",
			"  max-spaces-inside: 0",
			"  min-spaces-inside-empty: 1",
			"  max-spaces-inside-empty: 1",
		);

		await check([
			"---",
			"array: [ a, b ]",
			"",
		], [
			[2, 9],
			[2, 14],
		]);

		await check([
			"---",
			"array: [a, b]",
			"",
		], [
		]);

		await check([
			"---",
			"array: []",
			"",
		], [
			[2, 9],
		]);

		await check([
			"---",
			"array: [ ]",
			"",
		], [
		]);



		check = await conf(
			"brackets:",
			"  min-spaces-inside: 1",
			"  max-spaces-inside: 2",
			"  min-spaces-inside-empty: 1",
			"  max-spaces-inside-empty: 1",
		);

		await check([
			"---",
			"array: [ a, b  ]",
			"",
		], [
		]);

		await check([
			"---",
			"array: [a, b   ]",
			"",
		], [
			[2, 9],
			[2, 15],
		]);

		await check([
			"---",
			"array: []",
			"",
		], [
			[2, 9],
		]);

		await check([
			"---",
			"array: [ ]",
			"",
		], [
		]);

		await check([
			"---",
			"array: [   ]",
			"",
		], [
			[2, 11],
		]);



		check = await conf(
			"brackets:",
			"  min-spaces-inside: 1",
			"  max-spaces-inside: 1",
			"  min-spaces-inside-empty: 1",
			"  max-spaces-inside-empty: 1",
		);

		await check([
			"---",
			"array: [ a, b ]",
			"",
		], [
		]);

		await check([
			"---",
			"array: [a, b]",
			"",
		], [
			[2, 9],
			[2, 13],
		]);

		await check([
			"---",
			"array: []",
			"",
		], [
			[2, 9],
		]);

		await check([
			"---",
			"array: [ ]",
			"",
		], [
		]);
	});
});
