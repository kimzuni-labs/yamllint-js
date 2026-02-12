/*!
 * Copyright (C) 2017 Johannes F. Knauf
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

import { describe, test, expect } from "vitest";

import { ruleTestCase, consoleWorkspace } from "../common";



describe("Key Ordering Test Case", () => {
	const conf = ruleTestCase("key-ordering");

	test("disabled", async () => {
		const check = await conf("key-ordering: disable");

		await check([
			"---",
			"block mapping:",
			"  secondkey: a",
			"  firstkey: b",
			"",
		], [
		]);

		await check([
			"---",
			"flow mapping:",
			"  {secondkey: a, firstkey: b}",
			"",
		], [
		]);

		await check([
			"---",
			"second: before_first",
			"at: root",
			"",
		], [
		]);

		await check([
			"---",
			"nested but OK:",
			"  second: {first: 1}",
			"  third:",
			"    second: 2",
			"",
		], [
		]);
	});

	test("enabled", async () => {
		const check = await conf("key-ordering: enable");

		await check([
			"---",
			"block mapping:",
			"  secondkey: a",
			"  firstkey: b",
			"",
		], [
			[4, 3],
		]);

		await check([
			"---",
			"flow mapping:",
			"  {secondkey: a, firstkey: b}",
			"",
		], [
			[3, 18],
		]);

		await check([
			"---",
			"second: before_first",
			"at: root",
			"",
		], [
			[3, 1],
		]);

		await check([
			"---",
			"nested but OK:",
			"  second: {first: 1}",
			"  third:",
			"    second: 2",
			"",
		], [
		]);
	});

	test("word length", async () => {
		const check = await conf("key-ordering: enable");

		await check([
			"---",
			"a: 1",
			"ab: 1",
			"abc: 1",
			"",
		], [
		]);

		await check([
			"---",
			"a: 1",
			"abc: 1",
			"ab: 1",
			"",
		], [
			[4, 1],
		]);
	});

	test("key duplicates", async () => {
		const check = await conf(
			"key-duplicates: disable",
			"key-ordering: enable",
		);

		await check([
			"---",
			"key: 1",
			"key: 2",
			"",
		], [
		]);
	});

	test("normal", async () => {
		const check = await conf(
			"key-ordering: enable",
		);

		await check([
			"---",
			"T-shirt: 1",
			"T-shirts: 2",
			"t-shirt: 3",
			"t-shirts: 4",
			"",
		], [
		]);

		await check([
			"---",
			"T-shirt: 1",
			"t-shirt: 2",
			"T-shirts: 3",
			"t-shirts: 4",
			"",
		], [
			[4, 1],
		]);
	});

	test("accents", async () => {
		const check = await conf(
			"key-ordering: enable",
		);

		await check([
			"---",
			"hair: true",
			"hais: true",
			"haïr: true",
			"haïssable: true",
			"",
		], [
		]);

		await check([
			"---",
			"haïr: true",
			"hais: true",
			"",
		], [
			[3, 1],
		]);
	});

	test("key tokens in flow sequences", async () => {
		const check = await conf(
			"key-ordering: enable",
		);

		await check([
			"---",
			"[",
			"  key: value, mappings, in, flow: sequence",
			"]",
			"",
		], [
		]);
	});

	describe("locale", () => {
		const common = { locale: "en_US.UTF-8" };

		test("case", async () => {
			const check = await conf(
				common,
				"key-ordering: enable",
			);

			await check([
				"---",
				"t-shirt: 1",
				"T-shirt: 2",
				"t-shirts: 3",
				"T-shirts: 4",
				"",
			], [
			]);

			await check([
				"---",
				"t-shirt: 1",
				"t-shirts: 2",
				"T-shirt: 3",
				"T-shirts: 4",
				"",
			], [
				[4, 1],
			]);
		});

		test("accents", async () => {
			const check = await conf(
				common,
				"key-ordering: enable",
			);

			await check([
				"---",
				"hair: true",
				"haïr: true",
				"hais: true",
				"haïssable: true",
				"",
			], [
			]);

			await check([
				"---",
				"hais: true",
				"haïr: true",
				"",
			], [
				[3, 1],
			]);
		});
	});

	describe("ignored keys", () => {
		test("safe patterns", async () => {
			const check = await conf(
				"key-ordering:",
				"  ignored-keys: ['n(a|o)me', '^b']",
			);

			await check([
				"---",
				"a:",
				"b:",
				"c:",
				"name: ignored",
				"first-name: ignored",
				"nome: ignored",
				"gnomes: ignored",
				"d:",
				"e:",
				"boat: ignored",
				".boat: ERROR",
				"call: ERROR",
				"f:",
				"g:",
				"",
			], [
				[12, 1],
				[13, 1],
			]);
		});

		test("unsafe patterns", async () => {
			const { warn } = await consoleWorkspace(["warn"], async () => {
				const check = await conf(
					"key-ordering:",
					"  ignored-keys:",
					"    - '^(a|a)*$'",
					"    - '^(a|a)*$'",
					"",
				);

				await check([
					"---",
					"a: b",
					"",
				], [
				]);
			});

			expect(warn.trimEnd()).toBe("Ignoring unsafe RegExp pattern: ^(a|a)*$");
		});
	});
});
