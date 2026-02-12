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



describe("Braces Test Case", () => {
	const conf = ruleTestCase("braces");

	test("disabled", async () => {
		const check = await conf(
			"braces: disable",
		);

		await check([
			"---",
			"dict1: {}",
			"dict2: { }",
			"dict3: {   a: 1, b}",
			"dict4: {a: 1, b, c: 3 }",
			"dict5: {a: 1, b, c: 3 }",
			"dict6: {  a: 1, b, c: 3 }",
			"dict7: {   a: 1, b, c: 3 }",
			"",
		], [
		]);
	});

	describe("forbid", () => {
		test("false", async () => {
			const check = await conf(
				"braces:",
				"  forbid: false",
			);

			await check([
				"---",
				"dict: {}",
				"",
			], [
			]);

			await check([
				"---",
				"dict: {a}",
				"",
			], [
			]);

			await check([
				"---",
				"dict: {a: 1}",
				"",
			], [
			]);

			await check([
				"---",
				"dict: {",
				"  a: 1",
				"}",
				"",
			], [
			]);
		});

		test("true", async () => {
			const check = await conf(
				"braces:",
				"  forbid: true",
			);

			await check([
				"---",
				"dict:",
				"  a: 1",
				"",
			], [
			]);

			await check([
				"---",
				"dict: {}",
				"",
			], [
				[2, 8],
			]);

			await check([
				"---",
				"dict: {a}",
				"",
			], [
				[2, 8],
			]);

			await check([
				"---",
				"dict: {a: 1}",
				"",
			], [
				[2, 8],
			]);

			await check([
				"---",
				"dict: {",
				"  a: 1",
				"}",
				"",
			], [
				[2, 8],
			]);
		});

		test("non-empty", async () => {
			const check = await conf(
				"braces:",
				"  forbid: non-empty",
			);

			await check([
				"---",
				"dict:",
				"  a: 1",
				"",
			], [
			]);

			await check([
				"---",
				"dict: {}",
				"",
			], [
			]);

			await check([
				"---",
				"dict: {",
				"}",
				"",
			], [
			]);

			await check([
				"---",
				"dict: {",
				"# commented: value",
				"# another: value2",
				"}",
				"",
			], [
			]);

			await check([
				"---",
				"dict: {a}",
				"",
			], [
				[2, 8],
			]);

			await check([
				"---",
				"dict: {a: 1}",
				"",
			], [
				[2, 8],
			]);

			await check([
				"---",
				"dict: {",
				"  a: 1",
				"}",
				"",
			], [
				[2, 8],
			]);
		});
	});

	describe("spaces", () => {
		test("min", async () => {
			let check: Awaited<ReturnType<typeof conf>>;

			check = await conf(
				"braces:",
				"  min-spaces-inside: 0",
				"  max-spaces-inside: -1",
				"  min-spaces-inside-empty: -1",
				"  max-spaces-inside-empty: -1",
			);

			await check([
				"---",
				"dict: {}",
				"",
			], [
			]);



			check = await conf(
				"braces:",
				"  min-spaces-inside: 1",
				"  max-spaces-inside: -1",
				"  min-spaces-inside-empty: -1",
				"  max-spaces-inside-empty: -1",
			);

			await check([
				"---",
				"dict: {}",
				"",
			], [
				[2, 8],
			]);

			await check([
				"---",
				"dict: { }",
				"",
			], [
			]);

			await check([
				"---",
				"dict: {a: 1, b}",
				"",
			], [
				[2, 8],
				[2, 15],
			]);

			await check([
				"---",
				"dict: { a: 1, b }",
				"",
			], [
			]);

			await check([
				"---",
				"dict: {",
				"  a: 1,",
				"  b,",
				"}",
				"",
			], [
			]);



			check = await conf(
				"braces:",
				"  min-spaces-inside: 3",
				"  max-spaces-inside: -1",
				"  min-spaces-inside-empty: -1",
				"  max-spaces-inside-empty: -1",
			);

			await check([
				"---",
				"dict: { a: 1, b }",
				"",
			], [
				[2, 9],
				[2, 17],
			]);

			await check([
				"---",
				"dict: {   a: 1, b   }",
				"",
			], [
			]);
		});

		test("max", async () => {
			let check: Awaited<ReturnType<typeof conf>>;

			check = await conf(
				"braces:",
				"  min-spaces-inside: -1",
				"  max-spaces-inside: 0",
				"  min-spaces-inside-empty: -1",
				"  max-spaces-inside-empty: -1",
			);

			await check([
				"---",
				"dict: {}",
				"",
			], [
			]);

			await check([
				"---",
				"dict: { }",
				"",
			], [
				[2, 8],
			]);

			await check([
				"---",
				"dict: {a: 1, b}",
				"",
			], [
			]);

			await check([
				"---",
				"dict: { a: 1, b }",
				"",
			], [
				[2, 8],
				[2, 16],
			]);

			await check([
				"---",
				"dict: {   a: 1, b   }",
				"",
			], [
				[2, 10],
				[2, 20],
			]);

			await check([
				"---",
				"dict: {",
				"  a: 1,",
				"  b,",
				"}",
				"",
			], [
			]);



			check = await conf(
				"braces:",
				"  min-spaces-inside: -1",
				"  max-spaces-inside: 3",
				"  min-spaces-inside-empty: -1",
				"  max-spaces-inside-empty: -1",
			);

			await check([
				"---",
				"dict: {   a: 1, b   }",
				"",
			], [
			]);

			await check([
				"---",
				"dict: {    a: 1, b     }",
				"",
			], [
				[2, 11],
				[2, 23],
			]);
		});

		test("both", async () => {
			let check: Awaited<ReturnType<typeof conf>>;

			check = await conf(
				"braces:",
				"  min-spaces-inside: 0",
				"  max-spaces-inside: 0",
				"  min-spaces-inside-empty: -1",
				"  max-spaces-inside-empty: -1",
			);

			await check([
				"---",
				"dict: {}",
				"",
			], [
			]);

			await check([
				"---",
				"dict: { }",
				"",
			], [
				[2, 8],
			]);

			await check([
				"---",
				"dict: {   a: 1, b}",
				"",
			], [
				[2, 10],
			]);



			check = await conf(
				"braces:",
				"  min-spaces-inside: 1",
				"  max-spaces-inside: 1",
				"  min-spaces-inside-empty: -1",
				"  max-spaces-inside-empty: -1",
			);

			await check([
				"---",
				"dict: {a: 1, b, c: 3 }",
				"",
			], [
				[2, 8],
			]);



			check = await conf(
				"braces:",
				"  min-spaces-inside: 0",
				"  max-spaces-inside: 2",
				"  min-spaces-inside-empty: -1",
				"  max-spaces-inside-empty: -1",
			);

			await check([
				"---",
				"dict: {a: 1, b, c: 3 }",
				"",
			], [
			]);

			await check([
				"---",
				"dict: {  a: 1, b, c: 3 }",
				"",
			], [
			]);

			await check([
				"---",
				"dict: {   a: 1, b, c: 3 }",
				"",
			], [
				[2, 10],
			]);
		});
	});

	describe("spaces empty", () => {
		test("min", async () => {
			let check: Awaited<ReturnType<typeof conf>>;

			check = await conf(
				"braces:",
				"  min-spaces-inside: -1",
				"  max-spaces-inside: -1",
				"  min-spaces-inside-empty: 0",
				"  max-spaces-inside-empty: -1",
			);

			await check([
				"---",
				"array: {}",
				"",
			], [
			]);



			check = await conf(
				"braces:",
				"  min-spaces-inside: -1",
				"  max-spaces-inside: -1",
				"  min-spaces-inside-empty: 1",
				"  max-spaces-inside-empty: -1",
			);

			await check([
				"---",
				"array: {}",
				"",
			], [
				[2, 9],
			]);

			await check([
				"---",
				"array: { }",
				"",
			], [
			]);



			check = await conf(
				"braces:",
				"  min-spaces-inside: -1",
				"  max-spaces-inside: -1",
				"  min-spaces-inside-empty: 3",
				"  max-spaces-inside-empty: -1",
			);

			await check([
				"---",
				"array: {}",
				"",
			], [
				[2, 9],
			]);

			await check([
				"---",
				"array: {   }",
				"",
			], [
			]);
		});

		test("max", async () => {
			let check: Awaited<ReturnType<typeof conf>>;

			check = await conf(
				"braces:",
				"  min-spaces-inside: -1",
				"  max-spaces-inside: -1",
				"  min-spaces-inside-empty: -1",
				"  max-spaces-inside-empty: 0",
			);

			await check([
				"---",
				"array: {}",
				"",
			], [
			]);

			await check([
				"---",
				"array: { }",
				"",
			], [
				[2, 9],
			]);



			check = await conf(
				"braces:",
				"  min-spaces-inside: -1",
				"  max-spaces-inside: -1",
				"  min-spaces-inside-empty: -1",
				"  max-spaces-inside-empty: 1",
			);

			await check([
				"---",
				"array: {}",
				"",
			], [
			]);

			await check([
				"---",
				"array: { }",
				"",
			], [
			]);

			await check([
				"---",
				"array: {  }",
				"",
			], [
				[2, 10],
			]);



			check = await conf(
				"braces:",
				"  min-spaces-inside: -1",
				"  max-spaces-inside: -1",
				"  min-spaces-inside-empty: -1",
				"  max-spaces-inside-empty: 3",
			);

			await check([
				"---",
				"array: {}",
				"",
			], [
			]);

			await check([
				"---",
				"array: {   }",
				"",
			], [
			]);

			await check([
				"---",
				"array: {    }",
				"",
			], [
				[2, 12],
			]);
		});

		test("both", async () => {
			const check = await conf(
				"braces:",
				"  min-spaces-inside: -1",
				"  max-spaces-inside: -1",
				"  min-spaces-inside-empty: 1",
				"  max-spaces-inside-empty: 2",
			);

			await check([
				"---",
				"array: {}",
				"",
			], [
				[2, 9],
			]);

			await check([
				"---",
				"array: { }",
				"",
			], [
			]);

			await check([
				"---",
				"array: {  }",
				"",
			], [
			]);

			await check([
				"---",
				"array: {   }",
				"",
			], [
				[2, 11],
			]);
		});
	});

	test("mixed empty nonempty", async () => {
		let check: Awaited<ReturnType<typeof conf>>;

		check = await conf(
			"braces:",
			"  min-spaces-inside: 1",
			"  max-spaces-inside: -1",
			"  min-spaces-inside-empty: 0",
			"  max-spaces-inside-empty: 0",
		);

		await check([
			"---",
			"array: { a: 1, b }",
			"",
		], [
		]);

		await check([
			"---",
			"array: {a: 1, b}",
			"",
		], [
			[2, 9],
			[2, 16],
		]);

		await check([
			"---",
			"array: {}",
			"",
		], [
		]);

		await check([
			"---",
			"array: { }",
			"",
		], [
			[2, 9],
		]);



		check = await conf(
			"braces:",
			"  min-spaces-inside: -1",
			"  max-spaces-inside: 0",
			"  min-spaces-inside-empty: 1",
			"  max-spaces-inside-empty: 1",
		);

		await check([
			"---",
			"array: { a: 1, b }",
			"",
		], [
			[2, 9],
			[2, 17],
		]);

		await check([
			"---",
			"array: {a: 1, b}",
			"",
		], [
		]);

		await check([
			"---",
			"array: {}",
			"",
		], [
			[2, 9],
		]);

		await check([
			"---",
			"array: { }",
			"",
		], [
		]);



		check = await conf(
			"braces:",
			"  min-spaces-inside: 1",
			"  max-spaces-inside: 2",
			"  min-spaces-inside-empty: 1",
			"  max-spaces-inside-empty: 1",
		);

		await check([
			"---",
			"array: { a: 1, b  }",
			"",
		], [
		]);

		await check([
			"---",
			"array: {a: 1, b   }",
			"",
		], [
			[2, 9],
			[2, 18],
		]);

		await check([
			"---",
			"array: {}",
			"",
		], [
			[2, 9],
		]);

		await check([
			"---",
			"array: { }",
			"",
		], [
		]);

		await check([
			"---",
			"array: {   }",
			"",
		], [
			[2, 11],
		]);



		check = await conf(
			"braces:",
			"  min-spaces-inside: 1",
			"  max-spaces-inside: 1",
			"  min-spaces-inside-empty: 1",
			"  max-spaces-inside-empty: 1",
		);

		await check([
			"---",
			"array: { a: 1, b }",
			"",
		], [
		]);

		await check([
			"---",
			"array: {a: 1, b}",
			"",
		], [
			[2, 9],
			[2, 16],
		]);

		await check([
			"---",
			"array: {}",
			"",
		], [
			[2, 9],
		]);

		await check([
			"---",
			"array: { }",
			"",
		], [
		]);
	});
});
