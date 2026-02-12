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

import { ruleTestCase } from "./common";



describe("Yamllint Directives Test Case", () => {
	const conf = ruleTestCase("syntax");

	describe("disable", async () => {
		const config = [
			"commas: disable",
			"trailing-spaces: {}",
			"colons: {max-spaces-before: 1}",
		];

		const check = await conf(...config);

		test("directive", async () => {
			await check([
				"---",
				"- [valid , YAML]",
				"- trailing spaces    ",
				"- bad   : colon",
				"- [valid , YAML]",
				"- bad  : colon and spaces   ",
				"- [valid , YAML]",
				"",
			], [
				[3, 18, "trailing-spaces"],
				[4, 8, "colons"],
				[6, 7, "colons"],
				[6, 26, "trailing-spaces"],
			]);

			await check([
				"---",
				"- [valid , YAML]",
				"- trailing spaces    ",
				"# yamllint disable",
				"- bad   : colon",
				"- [valid , YAML]",
				"- bad  : colon and spaces   ",
				"- [valid , YAML]",
				"",
			], [
				[3, 18, "trailing-spaces"],
			]);

			await check([
				"---",
				"- [valid , YAML]",
				"# yamllint disable",
				"- trailing spaces    ",
				"- bad   : colon",
				"- [valid , YAML]",
				"# yamllint enable",
				"- bad  : colon and spaces   ",
				"- [valid , YAML]",
				"",
			], [
				[8, 7, "colons"],
				[8, 26, "trailing-spaces"],
			]);
		});

		test("directive with rules", async () => {
			await check([
				"---",
				"- [valid , YAML]",
				"- trailing spaces    ",
				"# yamllint disable rule:trailing-spaces",
				"- bad   : colon",
				"- [valid , YAML]",
				"- bad  : colon and spaces   ",
				"- [valid , YAML]",
				"",
			], [
				[3, 18, "trailing-spaces"],
				[5, 8, "colons"],
				[7, 7, "colons"],
			]);

			await check([
				"---",
				"- [valid , YAML]",
				"# yamllint disable rule:trailing-spaces",
				"- trailing spaces    ",
				"- bad   : colon",
				"- [valid , YAML]",
				"# yamllint enable rule:trailing-spaces",
				"- bad  : colon and spaces   ",
				"- [valid , YAML]",
				"",
			], [
				[5, 8, "colons"],
				[8, 7, "colons"],
				[8, 26, "trailing-spaces"],
			]);

			await check([
				"---",
				"- [valid , YAML]",
				"# yamllint disable rule:trailing-spaces",
				"- trailing spaces    ",
				"- bad   : colon",
				"- [valid , YAML]",
				"# yamllint enable",
				"- bad  : colon and spaces   ",
				"- [valid , YAML]",
				"",
			], [
				[5, 8, "colons"],
				[8, 7, "colons"],
				[8, 26, "trailing-spaces"],
			]);

			await check([
				"---",
				"- [valid , YAML]",
				"# yamllint disable",
				"- trailing spaces    ",
				"- bad   : colon",
				"- [valid , YAML]",
				"# yamllint enable rule:trailing-spaces",
				"- bad  : colon and spaces   ",
				"- [valid , YAML]",
				"",
			], [
				[8, 26, "trailing-spaces"],
			]);

			await check([
				"---",
				"- [valid , YAML]",
				"# yamllint disable rule:colons",
				"- trailing spaces    ",
				"# yamllint disable rule:trailing-spaces",
				"- bad   : colon",
				"- [valid , YAML]",
				"# yamllint enable rule:colons",
				"- bad  : colon and spaces   ",
				"- [valid , YAML]",
				"",
			], [
				[4, 18, "trailing-spaces"],
				[9, 7, "colons"],
			]);
		});

		test("line directive", async () => {
			await check([
				"---",
				"- [valid , YAML]",
				"- trailing spaces    ",
				"# yamllint disable-line",
				"- bad   : colon",
				"- [valid , YAML]",
				"- bad  : colon and spaces   ",
				"- [valid , YAML]",
				"",
			], [
				[3, 18, "trailing-spaces"],
				[7, 7, "colons"],
				[7, 26, "trailing-spaces"],
			]);

			await check([
				"---",
				"- [valid , YAML]",
				"- trailing spaces    ",
				"- bad   : colon  # yamllint disable-line",
				"- [valid , YAML]",
				"- bad  : colon and spaces   ",
				"- [valid , YAML]",
				"",
			], [
				[3, 18, "trailing-spaces"],
				[6, 7, "colons"],
				[6, 26, "trailing-spaces"],
			]);

			await check([
				"---",
				"- [valid , YAML]",
				"- trailing spaces    ",
				"- bad   : colon",
				"- [valid , YAML]  # yamllint disable-line",
				"- bad  : colon and spaces   ",
				"- [valid , YAML]",
				"",
			], [
				[3, 18, "trailing-spaces"],
				[4, 8, "colons"],
				[6, 7, "colons"],
				[6, 26, "trailing-spaces"],
			]);
		});

		test("line directive with rules", async () => {
			await check([
				"---",
				"- [valid , YAML]",
				"# yamllint disable-line rule:colons",
				"- trailing spaces    ",
				"- bad   : colon",
				"- [valid , YAML]",
				"- bad  : colon and spaces   ",
				"- [valid , YAML]",
				"",
			], [
				[4, 18, "trailing-spaces"],
				[5, 8, "colons"],
				[7, 7, "colons"],
				[7, 26, "trailing-spaces"],
			]);

			await check([
				"---",
				"- [valid , YAML]",
				"- trailing spaces  # yamllint disable-line rule:colons  ",
				"- bad   : colon",
				"- [valid , YAML]",
				"- bad  : colon and spaces   ",
				"- [valid , YAML]",
				"",
			], [
				[3, 55, "trailing-spaces"],
				[4, 8, "colons"],
				[6, 7, "colons"],
				[6, 26, "trailing-spaces"],
			]);

			await check([
				"---",
				"- [valid , YAML]",
				"- trailing spaces    ",
				"# yamllint disable-line rule:colons",
				"- bad   : colon",
				"- [valid , YAML]",
				"- bad  : colon and spaces   ",
				"- [valid , YAML]",
				"",
			], [
				[3, 18, "trailing-spaces"],
				[7, 7, "colons"],
				[7, 26, "trailing-spaces"],
			]);

			await check([
				"---",
				"- [valid , YAML]",
				"- trailing spaces    ",
				"- bad   : colon  # yamllint disable-line rule:colons",
				"- [valid , YAML]",
				"- bad  : colon and spaces   ",
				"- [valid , YAML]",
				"",
			], [
				[3, 18, "trailing-spaces"],
				[6, 7, "colons"],
				[6, 26, "trailing-spaces"],
			]);

			await check([
				"---",
				"- [valid , YAML]",
				"- trailing spaces    ",
				"- bad   : colon",
				"- [valid , YAML]",
				"# yamllint disable-line rule:colons",
				"- bad  : colon and spaces   ",
				"- [valid , YAML]",
				"",
			], [
				[3, 18, "trailing-spaces"],
				[4, 8, "colons"],
				[7, 26, "trailing-spaces"],
			]);

			await check([
				"---",
				"- [valid , YAML]",
				"- trailing spaces    ",
				"- bad   : colon",
				"- [valid , YAML]",
				"# yamllint disable-line rule:colons rule:trailing-spaces",
				"- bad  : colon and spaces   ",
				"- [valid , YAML]",
				"",
			], [
				[3, 18, "trailing-spaces"],
				[4, 8, "colons"],
			]);
		});

		test("directive with rules and dos lines", async () => {
			const check = await conf(
				...config,
				"new-lines: {type: dos}",
			);

			await check([
				"---\r",
				"- [valid , YAML]\r",
				"# yamllint disable rule:trailing-spaces\r",
				"- trailing spaces    \r",
				"- bad   : colon\r",
				"- [valid , YAML]\r",
				"# yamllint enable rule:trailing-spaces\r",
				"- bad  : colon and spaces   \r",
				"- [valid , YAML]\r",
				"",
			], [
				[5, 8, "colons"],
				[8, 7, "colons"],
				[8, 26, "trailing-spaces"],
			]);

			await check([
				"---\r",
				"- [valid , YAML]\r",
				"- trailing spaces    \r",
				"- bad   : colon\r",
				"- [valid , YAML]\r",
				"# yamllint disable-line rule:colons\r",
				"- bad  : colon and spaces   \r",
				"- [valid , YAML]\r",
				"",
			], [
				[3, 18, "trailing-spaces"],
				[4, 8, "colons"],
				[7, 26, "trailing-spaces"],
			]);
		});

		test("file directive", async () => {
			const check = await conf(
				"comments: {min-spaces-from-content: 2}",
				"comments-indentation: {}",
			);

			await check([
				"# yamllint disable-file",
				"---",
				"- a: 1 # comment too close",
				"  b:",
				" # wrong indentation",
				"    c: [x]",
				"",
			], [
			]);

			await check([
				"#    yamllint disable-file",
				"---",
				"- a: 1 # comment too close",
				"  b:",
				" # wrong indentation",
				"    c: [x]",
				"",
			], [
			]);

			await check([
				"#yamllint disable-file",
				"---",
				"- a: 1 # comment too close",
				"  b:",
				" # wrong indentation",
				"    c: [x]",
				"",
			], [
			]);

			await check([
				"#yamllint disable-file    ",
				"---",
				"- a: 1 # comment too close",
				"  b:",
				" # wrong indentation",
				"    c: [x]",
				"",
			], [
			]);

			await check([
				"---",
				"# yamllint disable-file",
				"- a: 1 # comment too close",
				"  b:",
				" # wrong indentation",
				"    c: [x]",
				"",
			], [
				[3, 8, "comments"],
				[5, 2, "comments-indentation"],
			]);

			await check([
				"# yamllint disable-file: rules cannot be specified",
				"---",
				"- a: 1 # comment too close",
				"  b:",
				" # wrong indentation",
				"    c: [x]",
				"",
			], [
				[3, 8, "comments"],
				[5, 2, "comments-indentation"],
			]);

			await check([
				"AAAA yamllint disable-file",
				"---",
				"- a: 1 # comment too close",
				"  b:",
				" # wrong indentation",
				"    c: [x]",
				"",
			], [
				[1, 1, "document-start"],
				[3, 8, "comments"],
				[5, 2, "comments-indentation"],
			]);
		});

		test("file directive not at first position", async () => {
			await check([
				"# yamllint disable-file",
				"---",
				"- bad  : colon and spaces   ",
				"",
			], [
			]);

			await check([
				"---",
				"# yamllint disable-file",
				"- bad  : colon and spaces   ",
				"",
			], [
				[3, 7, "colons"],
				[3, 26, "trailing-spaces"],
			]);
		});

		test("file directive with syntax error", async () => {
			await check([
				"# This file is not valid YAML (it is a Jinja template)",
				"{% if extra_info %}",
				"key1: value1",
				"{% endif %}",
				"key2: value2",
				"",
			], [
				[2, 1, "document-start"],
				[2, 2, "syntax"],
				[3, 1, "syntax"],
				[3, 5, "syntax"],
				[3, 7, "syntax"],
				[4, 1, "syntax"],
				[4, 2, "syntax"],
				[4, 11, "syntax"],
				[5, 1, "syntax"],
				[5, 5, "syntax"],
				[5, 7, "syntax"],
			]);

			await check([
				"# yamllint disable-file",
				"# This file is not valid YAML (it is a Jinja template)",
				"{% if extra_info %}",
				"key1: value1",
				"{% endif %}",
				"key2: value2",
				"",
			], [
			]);
		});

		test("file directive with dos lines", async () => {
			await check([
				"# yamllint disable-file\r",
				"---\r",
				"- bad  : colon and spaces   \r",
				"",
			], [
			]);

			await check([
				"# yamllint disable-file\r",
				"# This file is not valid YAML (it is a Jinja template)\r",
				"{% if extra_info %}\r",
				"key1: value1\r",
				"{% endif %}\r",
				"key2: value2\r",
				"",
			], [
			]);
		});
	});

	describe("directive on", () => {
		test("last line", async () => {
			const check = await conf(
				"new-line-at-end-of-file: {}",
			);

			await check([
				"---",
				"no new line",
			], [
				[2, 12, "new-line-at-end-of-file"],
			]);

			await check([
				"---",
				"# yamllint disable",
				"no new line",
			], [
			]);

			await check([
				"---",
				"no new line  # yamllint disable",
			], [
			]);
		});

		test("itself", async () => {
			const check = await conf(
				"comments: {min-spaces-from-content: 2}",
				"comments-indentation: {}",
			);

			await check([
				"---",
				"- a: 1 # comment too close",
				"  b:",
				" # wrong indentation",
				"    c: [x]",
				"",
			], [
				[2, 8, "comments"],
				[4, 2, "comments-indentation"],
			]);

			await check([
				"---",
				"# yamllint disable",
				"- a: 1 # comment too close",
				"  b:",
				" # wrong indentation",
				"    c: [x]",
				"",
			], [
			]);

			await check([
				"---",
				"- a: 1 # yamllint disable-line",
				"  b:",
				"    # yamllint disable-line",
				" # wrong indentation",
				"    c: [x]",
				"",
			], [
			]);

			await check([
				"---",
				"# yamllint disable",
				"- a: 1 # comment too close",
				"  # yamllint enable rule:comments-indentation",
				"  b:",
				" # wrong indentation",
				"    c: [x]",
				"",
			], [
				[6, 2, "comments-indentation"],
			]);

			await check([
				"---",
				"- a: 1 # yamllint disable-line rule:comments",
				"  b:",
				"    # yamllint disable-line rule:comments-indentation",
				" # wrong indentation",
				"    c: [x]",
				"",
			], [
			]);
		});
	});

	test("indented directive", async () => {
		const check = await conf(
			"brackets: {min-spaces-inside: 0, max-spaces-inside: 0}",
		);

		await check([
			"---",
			"- a: 1",
			"  b:",
			"    c: [    x]",
			"",
		], [
			[4, 12, "brackets"],
		]);

		await check([
			"---",
			"- a: 1",
			"  b:",
			"    # yamllint disable-line rule:brackets",
			"    c: [    x]",
			"",
		], [
		]);
	});
});
