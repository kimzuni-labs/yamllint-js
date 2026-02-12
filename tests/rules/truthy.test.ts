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

/* eslint-disable @stylistic/line-comment-position, @stylistic/no-multi-spaces */

import { describe, test } from "vitest";

import { ruleTestCase } from "../common";



describe("Truthy Test Case", () => {
	const conf = ruleTestCase("truthy");

	test("disabled", async () => {
		const check = await conf("truthy: disable");

		await check([
			"---",
			"1: True",
			"",
		], [
		]);

		await check([
			"---",
			"True: 1",
			"",
		], [
		]);
	});

	test("enabled", async () => {
		const check = await conf(
			"truthy: enable",
			"document-start: disable",
		);

		await check([
			"---",
			"1: True",
			"True: 1",
			"",
		], [
			[2, 4],
			[3, 1],
		]);

		await check([
			"---",
			"1: 'True'",
			"'True': 1",
			"",
		], [
		]);

		await check([
			"%YAML 1.1",
			"---",
			"[",
			"  true, false,",
			"  'false', 'FALSE',",
			"  'true', 'True',",
			"  True, FALSE,",
			"  on, OFF,",
			"  NO, Yes",
			"]",
			"",
		], [
			[7, 3],
			[7, 9],
			[8, 3],
			[8, 7],
			[9, 3],
			[9, 7],
		]);

		await check([
			"y: 1",
			"yes: 2",
			"on: 3",
			"true: 4",
			"True: 5",
			"...",
			"%YAML 1.2",
			"---",
			"y: 1",
			"yes: 2",
			"on: 3",
			"true: 4",
			"True: 5",
			"...",
			"%YAML 1.1",
			"---",
			"y: 1",
			"yes: 2",
			"on: 3",
			"true: 4",
			"True: 5",
			"---",
			"y: 1",
			"yes: 2",
			"on: 3",
			"true: 4",
			"True: 5",
			"",
		], [
			[2, 1],
			[3, 1],
			[5, 1],
			[13, 1],
			[18, 1],
			[19, 1],
			[21, 1],
			[24, 1],
			[25, 1],
			[27, 1],
		]);
	});

	describe("allowed values", () => {
		test("different", async () => {
			const check = await conf(
				"truthy:",
				"  allowed-values: ['yes', 'no']",
			);

			await check([
				"---",
				"key1: foo",
				"key2: yes",
				"key3: bar",
				"key4: no",
				"",
			], [
			]);

			await check([
				"%YAML 1.1",
				"---",
				"key1: true",
				"key2: Yes",
				"key3: false",
				"key4: no",
				"key5: yes",
				"",
			], [
				[3, 7],
				[4, 7],
				[5, 7],
			]);
		});

		test("combined", async () => {
			const check = await conf(
				"truthy:",
				"  allowed-values: ['yes', 'no', 'true', 'false']",
			);

			await check([
				"---",
				"key1: foo",
				"key2: yes",
				"key3: bar",
				"key4: no",
				"",
			], [
			]);

			await check([
				"---",
				"key1: true",
				"key2: True",
				"key3: false",
				"key4: no",
				"key5: yes",
				"",
			], [
				[3, 7],
			]);

			await check([
				"%YAML 1.1",
				"---",
				"key1: true",
				"key2: Yes",
				"key3: false",
				"key4: no",
				"key5: yes",
				"",
			], [
				[4, 7],
			]);

			await check([
				"%YAML 1.2",
				"---",
				"key1: true",
				"key2: Yes",
				"key3: false",
				"key4: no",
				"key5: yes",
				"",
			], [
			]);
		});

		test("no", async () => {
			const check = await conf(
				"truthy:",
				"  allowed-values: []",
			);

			await check([
				"---",
				"key1: foo",
				"key2: bar",
				"",
			], [
			]);

			await check([
				"---",
				"key1: true",
				"key2: yes",
				"key3: false",
				"key4: no",
				"",
			], [
				[2, 7],
				[3, 7],
				[4, 7],
				[5, 7],
			]);

			await check([
				"%YAML 1.1",
				"---",
				"key1: true",
				"key2: yes",
				"key3: false",
				"key4: no",
				"",
			], [
				[3, 7],
				[4, 7],
				[5, 7],
				[6, 7],
			]);

			await check([
				"%YAML 1.2",
				"---",
				"key1: true",
				"key2: yes",
				"key3: false",
				"key4: no",
				"",
			], [
				[3, 7],
				[5, 7],
			]);
		});
	});

	test("explicit types", async () => {
		const check = await conf(
			"truthy: enable",
		);

		await check([
			"---",
			"string1: !!str True",
			"string2: !!str yes",
			"string3: !!str off",
			"encoded: !!binary |",
			"           True",
			"           OFF",
			"           pad==",  // this decodes as 'N\xbb\x9e8Qii'
			"boolean1: !!bool true",
			"boolean2: !!bool 'false'",
			"boolean3: !!bool FALSE",
			"boolean4: !!bool True",
			"boolean5: !!bool off",
			"boolean6: !!bool NO",
			"",
		], [
		]);
	});

	test("check keys disabled", async () => {
		const check = await conf(
			"truthy:",
			"  allowed-values: []",
			"  check-keys: false",
			"key-duplicates: disable",
		);

		await check([
			"---",
			"YES: 0",
			"Yes: 0",
			"yes: 0",
			"No: 0",
			"No: 0",
			"no: 0",
			"TRUE: 0",
			"True: 0",
			"true: 0",
			"FALSE: 0",
			"False: 0",
			"false: 0",
			"ON: 0",
			"On: 0",
			"on: 0",
			"OFF: 0",
			"Off: 0",
			"off: 0",
			"YES:",
			"  Yes:",
			"    yes:",
			"      on: 0",
			"",
		], [
		]);
	});
});
