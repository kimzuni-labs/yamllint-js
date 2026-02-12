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



describe("Key Duplicates Test Case", () => {
	const conf = ruleTestCase("key-duplicates");

	test("disabled", async () => {
		const check = await conf(
			"key-duplicates: disable",
		);

		await check([
			"---",
			"block mapping:",
			"  key: a",
			"  otherkey: b",
			"  key: c",
			"",
		], [
		]);

		await check([
			"---",
			"flow mapping:",
			"  {key: a, otherkey: b, key: c}",
			"",
		], [
		]);

		await check([
			"---",
			"duplicated twice:",
			"  - k: a",
			"    ok: b",
			"    k: c",
			"    k: d",
			"",
		], [
		]);

		await check([
			"---",
			"duplicated twice:",
			"  - {k: a, ok: b, k: c, k: d}",
			"",
		], [
		]);

		await check([
			"---",
			"multiple duplicates:",
			"  a: 1",
			"  b: 2",
			"  c: 3",
			"  d: 4",
			"  d: 5",
			"  b: 6",
			"",
		], [
		]);

		await check([
			"---",
			"multiple duplicates:",
			"  {a: 1, b: 2, c: 3, d: 4, d: 5, b: 6}",
			"",
		], [
		]);

		await check([
			"---",
			"at: root",
			"multiple: times",
			"at: root",
			"",
		], [
		]);

		await check([
			"---",
			"nested but OK:",
			"  a: {a: {a: 1}}",
			"  b:",
			"    b: 2",
			"    c: 3",
			"",
		], [
		]);

		await check([
			"---",
			"nested duplicates:",
			"  a: {a: 1, a: 1}",
			"  b:",
			"    c: 3",
			"    d: 4",
			"    d: 4",
			"  b: 2",
			"",
		], [
		]);

		await check([
			"---",
			"duplicates with many styles: 1",
			"\"duplicates with many styles\": 1",
			"'duplicates with many styles': 1",
			"? duplicates with many styles",
			": 1",
			"? >-",
			"    duplicates with",
			"    many styles",
			": 1",
			"",
		], [
		]);

		await check([
			"---",
			"Merge Keys are OK:",
			"anchor_one: &anchor_one",
			"  one: one",
			"anchor_two: &anchor_two",
			"  two: two",
			"anchor_reference:",
			"  <<: *anchor_one",
			"  <<: *anchor_two",
			"",
		], [
		]);

		await check([
			"---",
			"{a: 1, b: 2}}",
			"",
		], [
			[2, 13, "syntax"],
		]);

		await check([
			"---",
			"[a, b, c]]",
			"",
		], [
			[2, 10, "syntax"],
		]);
	});

	test("enabled", async () => {
		const check = await conf(
			"key-duplicates: enable",
		);

		await check([
			"---",
			"block mapping:",
			"  key: a",
			"  otherkey: b",
			"  key: c",
			"",
		], [
			[5, 3],
		]);

		await check([
			"---",
			"flow mapping:",
			"  {key: a, otherkey: b, key: c}",
			"",
		], [
			[3, 25],
		]);

		await check([
			"---",
			"duplicated twice:",
			"  - k: a",
			"    ok: b",
			"    k: c",
			"    k: d",
			"",
		], [
			[5, 5],
			[6, 5],
		]);

		await check([
			"---",
			"duplicated twice:",
			"  - {k: a, ok: b, k: c, k: d}",
			"",
		], [
			[3, 19],
			[3, 25],
		]);

		await check([
			"---",
			"multiple duplicates:",
			"  a: 1",
			"  b: 2",
			"  c: 3",
			"  d: 4",
			"  d: 5",
			"  b: 6",
			"",
		], [
			[7, 3],
			[8, 3],
		]);

		await check([
			"---",
			"multiple duplicates:",
			"  {a: 1, b: 2, c: 3, d: 4, d: 5, b: 6}",
			"",
		], [
			[3, 28],
			[3, 34],
		]);

		await check([
			"---",
			"at: root",
			"multiple: times",
			"at: root",
			"",
		], [
			[4, 1],
		]);

		await check([
			"---",
			"nested but OK:",
			"  a: {a: {a: 1}}",
			"  b:",
			"    b: 2",
			"    c: 3",
			"",
		], [
		]);

		await check([
			"---",
			"nested duplicates:",
			"  a: {a: 1, a: 1}",
			"  b:",
			"    c: 3",
			"    d: 4",
			"    d: 4",
			"  b: 2",
			"",
		], [
			[3, 13],
			[7, 5],
			[8, 3],
		]);

		await check([
			"---",
			"duplicates with many styles: 1",
			"\"duplicates with many styles\": 1",
			"'duplicates with many styles': 1",
			"? duplicates with many styles",
			": 1",
			"? >-",
			"    duplicates with",
			"    many styles",
			": 1",
			"",
		], [
			[3, 1],
			[4, 1],
			[5, 3],
			[7, 3],
		]);

		await check([
			"---",
			"Merge Keys are OK:",
			"anchor_one: &anchor_one",
			"  one: one",
			"anchor_two: &anchor_two",
			"  two: two",
			"anchor_reference:",
			"  <<: *anchor_one",
			"  <<: *anchor_two",
			"",
		], [
		]);

		await check([
			"---",
			"{a: 1, b: 2}}",
			"",
		], [
			[2, 13, "syntax"],
		]);

		await check([
			"---",
			"[a, b, c]]",
			"",
		], [
			[2, 10, "syntax"],
		]);
	});

	test("key tokens in flow sequences", async () => {
		const check = await conf(
			"key-duplicates: enable",
		);

		await check([
			"---",
			"[",
			"  flow: sequence, with, key: value, mappings",
			"]",
			"",
		], [
		]);
	});

	test("forbid duplicated merge keys", async () => {
		const check = await conf(
			"key-duplicates: {forbid-duplicated-merge-keys: true}",
		);

		await check([
			"---",
			"Multiple Merge Keys are NOT OK:",
			"anchor_one: &anchor_one",
			"  one: one",
			"anchor_two: &anchor_two",
			"  two: two",
			"anchor_reference:",
			"  <<: *anchor_one",
			"  <<: *anchor_two",
			"",
		], [
			[9, 3],
		]);

		await check([
			"---",
			"Multiple Merge Keys are NOT OK:",
			"anchor_one: &anchor_one",
			"  one: one",
			"anchor_two: &anchor_two",
			"  two: two",
			"anchor_three: &anchor_three",
			"  two: three",
			"anchor_reference:",
			"  <<: *anchor_one",
			"  <<: *anchor_two",
			"  <<: *anchor_three",
			"",
		], [
			[11, 3],
			[12, 3],
		]);

		await check([
			"---",
			"Multiple Merge Keys are NOT OK:",
			"anchor_one: &anchor_one",
			"  one: one",
			"anchor_two: &anchor_two",
			"  two: two",
			"anchor_reference:",
			"  a: 1",
			"  <<: *anchor_one",
			"  b: 2",
			"  <<: *anchor_two",
			"",
		], [
			[11, 3],
		]);

		await check([
			"---",
			"Single Merge Key is OK:",
			"anchor_one: &anchor_one",
			"  one: one",
			"anchor_two: &anchor_two",
			"  two: two",
			"anchor_reference:",
			"  <<: [*anchor_one, *anchor_two]",
			"",
		], [
		]);

		await check([
			"---",
			"Duplicate keys without Merge Keys:",
			"  key: a",
			"  otherkey: b",
			"  key: c",
			"",
		], [
			[5, 3],
		]);

		await check([
			"---",
			"No Merge Keys:",
			"  key: a",
			"  otherkey: b",
			"",
		], [
		]);
	});
});
