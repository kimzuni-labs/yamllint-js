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



describe("Comments Indentation Test Case", () => {
	const conf = ruleTestCase("comments-indentation");

	test("disabled", async () => {
		const check = await conf(
			"comments-indentation: disable",
		);

		await check([
			"---",
			" # line 1",
			"# line 2",
			"  # line 3",
			"  # line 4",
			"",
			"obj:",
			" # these",
			"   # are",
			"  # [good]",
			"# bad",
			"      # comments",
			"  a: b",
			"",
			"obj1:",
			"  a: 1",
			"  # comments",
			"",
			"obj2:",
			"  b: 2",
			"",
			"# empty",
			"#",
			"# comment",
			"...",
			"",
		], [
		]);
	});

	test("enabled", async () => {
		const check = await conf(
			"comments-indentation: enable",
		);

		await check([
			"---",
			"# line 1",
			"# line 2",
			"",
		], [
		]);

		await check([
			"---",
			" # line 1",
			"# line 2",
			"",
		], [
			[2, 2],
		]);

		await check([
			"---",
			"  # line 1",
			"  # line 2",
			"",
		], [
			[2, 3],
		]);

		await check([
			"---",
			"obj:",
			"  # normal",
			"  a: b",
			"",
		], [
		]);

		await check([
			"---",
			"obj:",
			" # bad",
			"  a: b",
			"",
		], [
			[3, 2],
		]);

		await check([
			"---",
			"obj:",
			"# bad",
			"  a: b",
			"",
		], [
			[3, 1],
		]);

		await check([
			"---",
			"obj:",
			"   # bad",
			"  a: b",
			"",
		], [
			[3, 4],
		]);

		await check([
			"---",
			"obj:",
			" # these",
			"   # are",
			"  # [good]",
			"# bad",
			"      # comments",
			"  a: b",
			"",
		], [
			[3, 2],
			[4, 4],
			[6, 1],
			[7, 7],
		]);

		await check([
			"---",
			"obj1:",
			"  a: 1",
			"  # the following line is disabled",
			"  # b: 2",
			"",
		], [
		]);

		await check([
			"---",
			"obj1:",
			"  a: 1",
			"  # b: 2",
			"",
			"obj2:",
			"  b: 2",
			"",
		], [
		]);

		await check([
			"---",
			"obj1:",
			"  a: 1",
			"  # b: 2",
			"# this object is useless",
			"obj2: 'no'",
			"",
		], [
		]);

		await check([
			"---",
			"obj1:",
			"  a: 1",
			"# this object is useless",
			"  # b: 2",
			"obj2: 'no'",
			"",
		], [
			[5, 3],
		]);

		await check([
			"---",
			"obj1:",
			"  a: 1",
			"  # comments",
			"  b: 2",
			"",
		], [
		]);

		await check([
			"---",
			"my list for today:",
			"  - todo 1",
			"  - todo 2",
			"  # commented for now",
			"  # - todo 3",
			"...",
			"",
		], [
		]);
	});

	test("first line", async () => {
		const check = await conf(
			"comments-indentation: enable",
		);

		await check([
			"# comment\n",
		], [
		]);

		await check([
			"  # comment\n",
		], [
			[1, 3],
		]);
	});

	test("no newline at end", async () => {
		const check = await conf(
			"comments-indentation: enable",
			"new-line-at-end-of-file: disable",
		);

		await check([
			"# comment",
		], [
		]);

		await check([
			"  # comment",
		], [
			[1, 3],
		]);
	});

	test("empty comment", async () => {
		const check = await conf(
			"comments-indentation: enable",
		);

		await check([
			"---",
			"# key",
			"# normal",
			"#",
			"",
		], [
		]);

		await check([
			"---",
			"# key",
			"# normal",
			" #",
			"",
		], [
			[4, 2],
		]);
	});

	test("inline comment", async () => {
		const check = await conf(
			"comments-indentation: enable",
		);

		await check([
			"---",
			"- a  # inline",
			"# ok",
			"",
		], [
		]);

		await check([
			"---",
			"- a  # inline",
			" # not ok",
			"",
		], [
			[3, 2],
		]);

		await check([
			"---",
			" # not ok",
			"- a  # inline",
			"",
		], [
			[2, 2],
		]);
	});
});
