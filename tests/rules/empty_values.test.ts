/*!
 * Copyright (C) 2017 Greg Dubicki
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



describe("Empty Values Test Case", () => {
	const conf = ruleTestCase("empty-values");

	test("disabled", async () => {
		const check = await conf(
			"empty-values: disable",
			"braces: disable",
			"commas: disable",
		);

		await check([
			"---",
			"foo:",
			"",
		], [
		]);

		await check([
			"---",
			"foo:",
			"  bar:",
			"",
		], [
		]);

		await check([
			"---",
			"{a:}",
			"",
		], [
		]);

		await check([
			"---",
			"foo: {a:}",
			"",
		], [
		]);

		await check([
			"---",
			"- {a:}",
			"- {a:, b: 2}",
			"- {a: 1, b:}",
			"- {a: 1, b: , }",
			"",
		], [
		]);

		await check([
			"---",
			"{a: {b: , c: {d: 4, e:}}, f:}",
			"",
		], [
		]);
	});

	describe("block mappings", () => {
		test("disabled", async () => {
			const check = await conf(
				"empty-values:",
				"  forbid-in-block-mappings: false",
				"  forbid-in-flow-mappings: false",
				"  forbid-in-block-sequences: false",
			);

			await check([
				"---",
				"foo:",
				"",
			], [
			]);

			await check([
				"---",
				"foo:",
				"bar: aaa",
				"",
			], [
			]);
		});

		test("single line", async () => {
			const check = await conf(
				"empty-values:",
				"  forbid-in-block-mappings: true",
				"  forbid-in-flow-mappings: false",
				"  forbid-in-block-sequences: false",
			);

			await check([
				"---",
				"implicitly-null:",
				"",
			], [
				[2, 17],
			]);

			await check([
				"---",
				"implicitly-null:with-colons:in-key:",
				"",
			], [
				[2, 36],
			]);

			await check([
				"---",
				"implicitly-null:with-colons:in-key2:",
				"",
			], [
				[2, 37],
			]);
		});

		test("all lines", async () => {
			const check = await conf(
				"empty-values:",
				"  forbid-in-block-mappings: true",
				"  forbid-in-flow-mappings: false",
				"  forbid-in-block-sequences: false",
			);

			await check([
				"---",
				"foo:",
				"bar:",
				"foobar:",
				"",
			], [
				[2, 5],
				[3, 5],
				[4, 8],
			]);
		});

		test("explicit end of document", async () => {
			const check = await conf(
				"empty-values:",
				"  forbid-in-block-mappings: true",
				"  forbid-in-flow-mappings: false",
				"  forbid-in-block-sequences: false",
			);

			await check([
				"---",
				"foo:",
				"...",
				"",
			], [
				[2, 5],
			]);
		});

		test("not end of document", async () => {
			const check = await conf(
				"empty-values:",
				"  forbid-in-block-mappings: true",
				"  forbid-in-flow-mappings: false",
				"  forbid-in-block-sequences: false",
			);

			await check([
				"---",
				"foo:",
				"bar:",
				" aaa",
				"",
			], [
				[2, 5],
			]);
		});

		test("different level", async () => {
			const check = await conf(
				"empty-values:",
				"  forbid-in-block-mappings: true",
				"  forbid-in-flow-mappings: false",
				"  forbid-in-block-sequences: false",
			);

			await check([
				"---",
				"foo:",
				" bar:",
				"aaa: bbb",
				"",
			], [
				[3, 6],
			]);
		});

		test("empty flow mapping", async () => {
			const check = await conf(
				"empty-values:",
				"  forbid-in-block-mappings: true",
				"  forbid-in-flow-mappings: false",
				"  forbid-in-block-sequences: false",
				"braces: disable",
				"commas: disable",
			);

			await check([
				"---",
				"foo: {a:}",
				"",
			], [
			]);

			await check([
				"---",
				"- {a:, b: 2}",
				"- {a: 1, b:}",
				"- {a: 1, b: , }",
				"",
			], [
			]);
		});

		test("empty block sequence", async () => {
			const check = await conf(
				"empty-values:",
				"  forbid-in-block-mappings: true",
				"  forbid-in-flow-mappings: false",
				"  forbid-in-block-sequences: false",
			);

			await check([
				"---",
				"foo:",
				"  -",
				"",
			], [
			]);
		});

		test("not empty or explicit null", async () => {
			const check = await conf(
				"empty-values:",
				"  forbid-in-block-mappings: true",
				"  forbid-in-flow-mappings: false",
				"  forbid-in-block-sequences: false",
			);

			await check([
				"---",
				"foo:",
				" bar:",
				"  aaa",
				"",
			], [
			]);

			await check([
				"---",
				"explicitly-null: null",
				"",
			], [
			]);

			await check([
				"---",
				"explicitly-null:with-colons:in-key: null",
				"",
			], [
			]);

			await check([
				"---",
				"false-null: nulL",
				"",
			], [
			]);

			await check([
				"---",
				"empty-string: ''",
				"",
			], [
			]);

			await check([
				"---",
				"nullable-boolean: false",
				"",
			], [
			]);

			await check([
				"---",
				"nullable-int: 0",
				"",
			], [
			]);

			await check([
				"---",
				"First occurrence: &anchor Foo",
				"Second occurrence: *anchor",
				"",
			], [
			]);
		});

		test("various explicit null", async () => {
			const check = await conf(
				"empty-values:",
				"  forbid-in-block-mappings: true",
				"  forbid-in-flow-mappings: false",
				"  forbid-in-block-sequences: false",
			);

			await check([
				"---",
				"null-alias: ~",
				"",
			], [
			]);

			await check([
				"---",
				"null-key1: {?: val}",
				"",
			], [
			]);

			await check([
				"---",
				"null-key2: {? !!null '': val}",
				"",
			], [
			]);
		});

		test("comments", async () => {
			const check = await conf(
				"empty-values:",
				"  forbid-in-block-mappings: true",
				"  forbid-in-flow-mappings: false",
				"  forbid-in-block-sequences: false",
				"comments: disable",
			);

			await check([
				"---",
				"empty:  # comment",
				"foo:",
				"  bar: # comment",
				"",
			], [
				[2, 7],
				[4, 7],
			]);
		});
	});

	describe("flow mappings", () => {
		test("disabled", async () => {
			const check = await conf(
				"empty-values:",
				"  forbid-in-block-mappings: false",
				"  forbid-in-flow-mappings: false",
				"  forbid-in-block-sequences: false",
				"braces: disable",
				"commas: disable",
			);

			await check([
				"---",
				"{a:}",
				"",
			], [
			]);

			await check([
				"---",
				"foo: {a:}",
				"",
			], [
			]);

			await check([
				"---",
				"- {a:}",
				"- {a:, b: 2}",
				"- {a: 1, b:}",
				"- {a: 1, b: , }",
				"",
			], [
			]);

			await check([
				"---",
				"{a: {b: , c: {d: 4, e:}}, f:}",
				"",
			], [
			]);
		});

		test("single line", async () => {
			const check = await conf(
				"empty-values:",
				"  forbid-in-block-mappings: false",
				"  forbid-in-flow-mappings: true",
				"  forbid-in-block-sequences: false",
				"braces: disable",
				"commas: disable",
			);

			await check([
				"---",
				"{a:}",
				"",
			], [
				[2, 4],
			]);

			await check([
				"---",
				"foo: {a:}",
				"",
			], [
				[2, 9],
			]);

			await check([
				"---",
				"- {a:}",
				"- {a:, b: 2}",
				"- {a: 1, b:}",
				"- {a: 1, b: , }",
				"",
			], [
				[2, 6],
				[3, 6],
				[4, 12],
				[5, 12],
			]);

			await check([
				"---",
				"{a: {b: , c: {d: 4, e:}}, f:}",
				"",
			], [
				[2, 8],
				[2, 23],
				[2, 29],
			]);
		});

		test("multi line", async () => {
			const check = await conf(
				"empty-values:",
				"  forbid-in-block-mappings: false",
				"  forbid-in-flow-mappings: true",
				"  forbid-in-block-sequences: false",
				"braces: disable",
				"commas: disable",
			);

			await check([
				"---",
				"foo: {",
				"  a:",
				"}",
				"",
			], [
				[3, 5],
			]);

			await check([
				"---",
				"{",
				"  a: {",
				"    b: ,",
				"    c: {",
				"      d: 4,",
				"      e:",
				"    }",
				"  },",
				"  f:",
				"}",
				"",
			], [
				[4, 7],
				[7, 9],
				[10, 5],
			]);
		});

		test("various explicit null", async () => {
			const check = await conf(
				"empty-values:",
				"  forbid-in-block-mappings: false",
				"  forbid-in-flow-mappings: true",
				"  forbid-in-block-sequences: false",
				"braces: disable",
				"commas: disable",
			);

			await check([
				"---",
				"{explicit-null: null}",
				"",
			], [
			]);

			await check([
				"---",
				"{null-alias: ~}",
				"",
			], [
			]);

			await check([
				"---",
				"null-key1: {?: val}",
				"",
			], [
			]);

			await check([
				"---",
				"null-key2: {? !!null '': val}",
				"",
			], [
			]);
		});

		test("comments", async () => {
			const check = await conf(
				"empty-values:",
				"  forbid-in-block-mappings: false",
				"  forbid-in-flow-mappings: true",
				"  forbid-in-block-sequences: false",
				"braces: disable",
				"commas: disable",
				"comments: disable",
			);

			await check([
				"---",
				"{",
				"  a: {",
				"    b: ,  # comment",
				"    c: {",
				"      d: 4,  # comment",
				"      e:  # comment",
				"    }",
				"  },",
				"  f:  # comment",
				"}",
				"",
			], [
				[4, 7],
				[7, 9],
				[10, 5],
			]);
		});
	});

	describe("block sequences", () => {
		test("disable", async () => {
			const check = await conf(
				"empty-values:",
				"  forbid-in-block-mappings: false",
				"  forbid-in-flow-mappings: false",
				"  forbid-in-block-sequences: false",
			);

			await check([
				"---",
				"foo:",
				"  - bar",
				"  -",
				"",
			], [
			]);

			await check([
				"---",
				"foo:",
				"  -",
				"",
			], [
			]);
		});

		test("primitive item", async () => {
			const check = await conf(
				"empty-values:",
				"  forbid-in-block-mappings: false",
				"  forbid-in-flow-mappings: false",
				"  forbid-in-block-sequences: true",
			);

			await check([
				"---",
				"foo:",
				"  -",
				"",
			], [
				[3, 4],
			]);

			await check([
				"---",
				"foo:",
				"  - bar",
				"  -",
				"",
			], [
				[4, 4],
			]);

			await check([
				"---",
				"foo:",
				"  - 1",
				"  - 2",
				"  -",
				"",
			], [
				[5, 4],
			]);

			await check([
				"---",
				"foo:",
				"  - true",
				"",
			], [
			]);
		});

		test("complex objects", async () => {
			const check = await conf(
				"empty-values:",
				"  forbid-in-block-mappings: false",
				"  forbid-in-flow-mappings: false",
				"  forbid-in-block-sequences: true",
			);

			await check([
				"---",
				"foo:",
				"  - a: 1",
				"",
			], [
			]);

			await check([
				"---",
				"foo:",
				"  - a: 1",
				"  -",
				"",
			], [
				[4, 4],
			]);

			await check([
				"---",
				"foo:",
				"  - a: 1",
				"    b: 2",
				"  -",
				"",
			], [
				[5, 4],
			]);

			await check([
				"---",
				"foo:",
				"  - a: 1",
				"  - b: 2",
				"  -",
				"",
			], [
				[5, 4],
			]);

			await check([
				"---",
				"foo:",
				"  - - a: 1",
				"    - b: 2",
				"    -",
				"",
			], [
				[5, 6],
			]);

			await check([
				"---",
				"foo:",
				"  - - a: 1",
				"    - b: 2",
				"  -",
				"",
			], [
				[5, 4],
			]);
		});

		test("various explicit null", async () => {
			const check = await conf(
				"empty-values:",
				"  forbid-in-block-mappings: false",
				"  forbid-in-flow-mappings: false",
				"  forbid-in-block-sequences: true",
			);

			await check([
				"---",
				"foo:",
				"  - null",
				"",
			], [
			]);

			await check([
				"---",
				"- null",
				"",
			], [
			]);

			await check([
				"---",
				"foo:",
				"  - bar: null",
				"  - null",
				"",
			], [
			]);

			await check([
				"---",
				"- null",
				"- null",
				"",
			], [
			]);

			await check([
				"---",
				"- - null",
				"  - null",
				"",
			], [
			]);
		});
	});
});
