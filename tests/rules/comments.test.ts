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



describe("Comments Test Case", () => {
	const conf = ruleTestCase("comments");

	test("disabled", async () => {
		const check = await conf(
			"comments: disable",
			"comments-indentation: disable",
		);

		await check([
			"---",
			"#comment",
			"",
			"test: #    description",
			"  - foo  # bar",
			"  - hello #world",
			"",
			"# comment 2",
			"#comment 3",
			"  #comment 3 bis",
			"  #  comment 3 ter",
			"",
			"################################",
			"## comment 4",
			"##comment 5",
			"",
			"string: 'Une longue phrase.' # this is French",
			"",
		], [
		]);
	});

	test("starting space", async () => {
		const check = await conf(
			"comments:",
			"  require-starting-space: true",
			"  min-spaces-from-content: -1",
			"comments-indentation: disable",
		);

		await check([
			"---",
			"# comment",
			"",
			"test:  #     description",
			"  - foo  #   bar",
			"  - hello  # world",
			"",
			"# comment 2",
			"# comment 3",
			"  #  comment 3 bis",
			"  #  comment 3 ter",
			"",
			"################################",
			"## comment 4",
			"##  comment 5",
			"",
		], [
		]);

		await check([
			"---",
			"#comment",
			"",
			"test:  #    description",
			"  - foo  #  bar",
			"  - hello  #world",
			"",
			"# comment 2",
			"#comment 3",
			"  #comment 3 bis",
			"  #  comment 3 ter",
			"",
			"################################",
			"## comment 4",
			"##comment 5",
			"",
		], [
			[2, 2],
			[6, 13],
			[9, 2],
			[10, 4],
			[15, 3],
		]);
	});

	describe("ignore-shebang", () => {
		test("false", async () => {
			const check = await conf(
				"comments:",
				"  require-starting-space: true",
				"  ignore-shebangs: false",
				"comments-indentation: disable",
				"document-start: disable",
			);

			await check([
				"#!/bin/env my-interpreter",
				"",
			], [
				[1, 2],
			]);

			await check([
				"# comment",
				"#!/bin/env my-interpreter",
				"",
			], [
				[2, 2],
			]);

			await check([
				"#!/bin/env my-interpreter",
				"---",
				"#comment",
				"#!/bin/env my-interpreter",
				"",
			], [
				[1, 2],
				[3, 2],
				[4, 2],
			]);

			await check([
				"#! is a valid shebang too",
				"",
			], [
				[1, 2],
			]);

			await check([
				"key:  #!/not/a/shebang",
				"",
			], [
				[1, 8],
			]);
		});

		test("true", async () => {
			const check = await conf(
				"comments:",
				"  require-starting-space: true",
				"  ignore-shebangs: true",
				"comments-indentation: disable",
				"document-start: disable",
			);

			await check([
				"#!/bin/env my-interpreter",
				"",
			], [
			]);

			await check([
				"# comment",
				"#!/bin/env my-interpreter",
				"",
			], [
				[2, 2],
			]);

			await check([
				"#!/bin/env my-interpreter",
				"---",
				"#comment",
				"#!/bin/env my-interpreter",
				"",
			], [
				[3, 2],
				[4, 2],
			]);

			await check([
				"#! is a valid shebang too",
				"",
			], [
			]);

			await check([
				"key:  #!/not/a/shebang",
				"",
			], [
				[1, 8],
			]);
		});
	});

	test("spaces from content", async () => {
		const check = await conf(
			"comments:",
			"  require-starting-space: false",
			"  min-spaces-from-content: 2",
		);

		await check([
			"---",
			"# comment",
			"",
			"test:  #    description",
			"  - foo  #  bar",
			"  - hello  #world",
			"",
			"string: 'Une longue phrase.'  # this is French",
			"",
		], [
		]);

		await check([
			"---",
			"# comment",
			"",
			"test: #    description",
			"  - foo  # bar",
			"  - hello #world",
			"",
			"string: 'Une longue phrase.' # this is French",
			"",
		], [
			[4, 7],
			[6, 11],
			[8, 30],
		]);
	});

	test("both", async () => {
		const check = await conf(
			"comments:",
			"  require-starting-space: true",
			"  min-spaces-from-content: 2",
			"comments-indentation: disable",
		);

		await check([
			"---",
			"#comment",
			"",
			"test: #    description",
			"  - foo  # bar",
			"  - hello #world",
			"",
			"# comment 2",
			"#comment 3",
			"  #comment 3 bis",
			"  #  comment 3 ter",
			"",
			"################################",
			"## comment 4",
			"##comment 5",
			"",
			"string: 'Une longue phrase.' # this is French",
			"",
		], [
			[2, 2],
			[4, 7],
			[6, 11],
			[6, 12],
			[9, 2],
			[10, 4],
			[15, 3],
			[17, 30],
		]);
	});

	describe("empty comment", () => {
		test("lf (unix newlines)", async () => {
			const check = await conf(
				"comments:",
				"  require-starting-space: true",
				"  min-spaces-from-content: 2",
			);

			await check([
				"---",
				"# This is paragraph 1.",
				"#",
				"# This is paragraph 2.",
				"",
			], [
			]);

			await check([
				"---",
				"inline: comment  #",
				"foo: bar",
				"",
			], [
			]);
		});

		test("crlf (dos newlines)", async () => {
			const check = await conf(
				"comments:",
				"  require-starting-space: true",
				"  min-spaces-from-content: 2",
				"new-lines:",
				"  type: dos",
			);

			await check([
				"---\r",
				"# This is paragraph 1.\r",
				"#\r",
				"# This is paragraph 2.\r",
				"",
			], [
			]);
		});

		test("crlf and disabled newlines", async () => {
			const check = await conf(
				"comments:",
				"  require-starting-space: true",
				"  min-spaces-from-content: 2",
				"new-lines: disable",
			);

			await check([
				"---\r",
				"# This is paragraph 1.\r",
				"#\r",
				"# This is paragraph 2.\r",
				"",
			], [
			]);
		});
	});

	describe("lines", () => {
		test("first line", async () => {
			const check = await conf(
				"comments:",
				"  require-starting-space: true",
				"  min-spaces-from-content: 2",
			);

			await check([
				"# comment",
				"",
			], [
			]);
		});

		test("last line", async () => {
			const check = await conf(
				"comments:",
				"  require-starting-space: true",
				"  min-spaces-from-content: 2",
				"new-line-at-end-of-file: disable",
			);

			await check([
				"# comment with no newline char:",
				"#",
			], [
			]);
		});

		test("multi line scalar", async () => {
			const check = await conf(
				"comments:",
				"  require-starting-space: true",
				"  min-spaces-from-content: 2",
				"trailing-spaces: disable",
			);

			await check([
				"---",
				"string: >",
				"  this is plain text",
				"",
				"# comment",
				"",
			], [
			]);

			await check([
				"---",
				"- string: >",
				"    this is plain text",
				"  ",
				"  # comment",
				"",
			], [
			]);
		});
	});
});
