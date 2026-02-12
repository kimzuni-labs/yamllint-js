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

import { describe, test } from "vitest";

import { ruleTestCase } from "../common";



describe("Commas Test Case", () => {
	const conf = ruleTestCase("commas");

	test("disabled", async () => {
		const check = await conf("commas: disable");

		await check([
			"---",
			"dict: {a: b ,   c: '1 2 3',    d: e , f: [g,      h]}",
			"array: [",
			"  elem  ,",
			"  key: val ,",
			"]",
			"map: {",
			"  key1: val1 ,",
			"  key2: val2,",
			"}",
			"...",
			"",
		], [
		]);

		await check([
			"---",
			"- [one, two , three,four]",
			"- {five,six , seven, eight}",
			"- [",
			"  nine,  ten",
			"  , eleven",
			"  ,twelve",
			"]",
			"- {",
			"  thirteen: 13,  fourteen",
			"  , fifteen: 15",
			"  ,sixteen: 16",
			"}",
			"",
		], [
		]);
	});

	describe("before max", () => {
		test("normal", async () => {
			const check = await conf(
				"commas:",
				"  max-spaces-before: 0",
				"  min-spaces-after: 0",
				"  max-spaces-after: -1",
			);

			await check([
				"---",
				"array: [1, 2,  3, 4]",
				"...",
				"",
			], [
			]);

			await check([
				"---",
				"array: [1, 2 ,  3, 4]",
				"...",
				"",
			], [
				[2, 13],
			]);

			await check([
				"---",
				"array: [1 , 2,  3      , 4]",
				"...",
				"",
			], [
				[2, 10],
				[2, 23],
			]);

			await check([
				"---",
				"dict: {a: b, c: '1 2 3', d: e,  f: [g, h]}",
				"...",
				"",
			], [
			]);

			await check([
				"---",
				"dict: {a: b, c: '1 2 3' , d: e,  f: [g, h]}",
				"...",
				"",
			], [
				[2, 24],
			]);

			await check([
				"---",
				"dict: {a: b , c: '1 2 3', d: e,  f: [g    , h]}",
				"...",
				"",
			], [
				[2, 12],
				[2, 42],
			]);

			await check([
				"---",
				"array: [",
				"  elem,",
				"  key: val,",
				"]",
				"",
			], [
			]);

			await check([
				"---",
				"array: [",
				"  elem ,",
				"  key: val,",
				"]",
				"",
			], [
				[3, 7],
			]);

			await check([
				"---",
				"map: {",
				"  key1: val1,",
				"  key2: val2,",
				"}",
				"",
			], [
			]);

			await check([
				"---",
				"map: {",
				"  key1: val1,",
				"  key2: val2 ,",
				"}",
				"",
			], [
				[4, 13],
			]);
		});

		test("with comma on new line", async () => {
			let check: Awaited<ReturnType<typeof conf>>;

			check = await conf(
				"commas:",
				"  max-spaces-before: 0",
				"  min-spaces-after: 0",
				"  max-spaces-after: -1",
			);

			await check([
				"---",
				"flow-seq: [1, 2, 3",
				"           , 4, 5, 6]",
				"...",
				"",
			], [
				[3, 11],
			]);

			await check([
				"---",
				"flow-map: {a: 1, b: 2",
				"           , c: 3}",
				"...",
				"",
			], [
				[3, 11],
			]);



			check = await conf(
				"commas:",
				"  max-spaces-before: 0",
				"  min-spaces-after: 0",
				"  max-spaces-after: -1",
				"indentation: disable",
			);

			await check([
				"---",
				"flow-seq: [1, 2, 3",
				"         , 4, 5, 6]",
				"...",
				"",
			], [
				[3, 9],
			]);

			await check([
				"---",
				"flow-map: {a: 1, b: 2",
				"         , c: 3}",
				"...",
				"",
			], [
				[3, 9],
			]);

			await check([
				"---",
				"[",
				"1,",
				"2",
				", 3",
				"]",
				"",
			], [
				[5, 1],
			]);

			await check([
				"---",
				"{",
				"a: 1,",
				"b: 2",
				", c: 3",
				"}",
				"",
			], [
				[5, 1],
			]);
		});

		test("3", async () => {
			const check = await conf(
				"commas:",
				"  max-spaces-before: 3",
				"  min-spaces-after: 0",
				"  max-spaces-after: -1",
			);

			await check([
				"---",
				"array: [1 , 2, 3   , 4]",
				"...",
				"",
			], [
			]);

			await check([
				"---",
				"array: [1 , 2, 3    , 4]",
				"...",
				"",
			], [
				[2, 20],
			]);

			await check([
				"---",
				"array: [",
				"  elem1   ,",
				"  elem2    ,",
				"  key: val,",
				"]",
				"",
			], [
				[4, 11],
			]);
		});
	});

	describe("after", () => {
		test("min", async () => {
			const check = await conf(
				"commas:",
				"  max-spaces-before: -1",
				"  min-spaces-after: 1",
				"  max-spaces-after: -1",
			);

			await check([
				"---",
				"- [one, two , three,four]",
				"- {five,six , seven, eight}",
				"- [",
				"  nine,  ten",
				"  , eleven",
				"  ,twelve",
				"]",
				"- {",
				"  thirteen: 13,  fourteen",
				"  , fifteen: 15",
				"  ,sixteen: 16",
				"}",
				"",
			], [
				[2, 21],
				[3, 9],
				[7, 4],
				[12, 4],
			]);
		});

		test("max", async () => {
			const check = await conf(
				"commas:",
				"  max-spaces-before: -1",
				"  min-spaces-after: 0",
				"  max-spaces-after: 1",
			);

			await check([
				"---",
				"array: [1, 2, 3, 4]",
				"...",
				"",
			], [
			]);

			await check([
				"---",
				"array: [1, 2,  3, 4]",
				"...",
				"",
			], [
				[2, 15],
			]);

			await check([
				"---",
				"array: [1,  2, 3,     4]",
				"...",
				"",
			], [
				[2, 12],
				[2, 22],
			]);

			await check([
				"---",
				"dict: {a: b , c: '1 2 3', d: e, f: [g, h]}",
				"...",
				"",
			], [
			]);

			await check([
				"---",
				"dict: {a: b , c: '1 2 3',  d: e, f: [g, h]}",
				"...",
				"",
			], [
				[2, 27],
			]);

			await check([
				"---",
				"dict: {a: b ,  c: '1 2 3', d: e, f: [g,     h]}",
				"...",
				"",
			], [
				[2, 15],
				[2, 44],
			]);

			await check([
				"---",
				"array: [",
				"  elem,",
				"  key: val,",
				"]",
				"",
			], [
			]);

			await check([
				"---",
				"array: [",
				"  elem,  key: val,",
				"]",
				"",
			], [
				[3, 9],
			]);

			await check([
				"---",
				"map: {",
				"  key1: val1,   key2: [val2,  val3]",
				"}",
				"",
			], [
				[3, 16],
				[3, 30],
			]);
		});

		test("max 3", async () => {
			const check = await conf(
				"commas:",
				"  max-spaces-before: -1",
				"  min-spaces-after: 1",
				"  max-spaces-after: 3",
			);

			await check([
				"---",
				"array: [1,  2, 3,   4]",
				"...",
				"",
			], [
			]);

			await check([
				"---",
				"array: [1,  2, 3,    4]",
				"...",
				"",
			], [
				[2, 21],
			]);

			await check([
				"---",
				"dict: {a: b ,   c: '1 2 3',    d: e, f: [g,      h]}",
				"...",
				"",
			], [
				[2, 31],
				[2, 49],
			]);
		});
	});

	test("both before/after", async () => {
		let check: Awaited<ReturnType<typeof conf>>;

		check = await conf(
			"commas:",
			"  max-spaces-before: 0",
			"  min-spaces-after: 1",
			"  max-spaces-after: 1",
		);

		await check([
			"---",
			"dict: {a: b ,   c: '1 2 3',    d: e , f: [g,      h]}",
			"array: [",
			"  elem  ,",
			"  key: val ,",
			"]",
			"map: {",
			"  key1: val1 ,",
			"  key2: val2,",
			"}",
			"...",
			"",
		], [
			[2, 12],
			[2, 16],
			[2, 31],
			[2, 36],
			[2, 50],
			[4, 8],
			[5, 11],
			[8, 13],
		]);



		check = await conf(
			"commas:",
			"  max-spaces-before: 0",
			"  min-spaces-after: 1",
			"  max-spaces-after: 1",
			"indentation: disable",
		);

		await check([
			"---",
			"- [one, two , three,four]",
			"- {five,six , seven, eight}",
			"- [",
			"  nine,  ten",
			"  , eleven",
			"  ,twelve",
			"]",
			"- {",
			"  thirteen: 13,  fourteen",
			"  , fifteen: 15",
			"  ,sixteen: 16",
			"}",
			"",
		], [
			[2, 12],
			[2, 21],
			[3, 9],
			[3, 12],
			[5, 9],
			[6, 2],
			[7, 2],
			[7, 4],
			[10, 17],
			[11, 2],
			[12, 2],
			[12, 4],
		]);
	});
});
