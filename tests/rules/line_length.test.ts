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



describe("Line Length Test Case", () => {
	const conf = ruleTestCase("line-length");

	test("disabled", async () => {
		const check = await conf(
			"line-length: disable",
			"empty-lines: disable",
			"new-line-at-end-of-file: disable",
			"document-start: disable",
		);

		await check([""]);
		await check(["\n"]);
		await check(["---\n"]);
		await check(["a".repeat(81)]);
		await check([`---\n${"a".repeat(81)}\n`]);
		await check(["b".repeat(1000)]);
		await check([`---\n${"b".repeat(1000)}\n`]);
		await check([
			"content: |",
			`  {% this line is${" really".repeat(99)} long %}`,
			"",
		]);
	});

	describe("max", () => {
		test("80", async () => {
			const check = await conf(
				"line-length: {max: 80}",
				"empty-lines: disable",
				"new-line-at-end-of-file: disable",
				"document-start: disable",
			);

			await check([""]);
			await check(["\n"]);
			await check(["---\n"]);
			await check(["a".repeat(80)]);
			await check([`---\n${"a".repeat(80)}\n`]);
			await check([`${"aaaa ".repeat(16)}z`], [[1, 81]]);
			await check([`---\n${"aaaa ".repeat(16)}z\n`], [[2, 81]]);
			await check([`${"word ".repeat(1000)}end`], [[1, 81]]);
			await check([`---\n${"word ".repeat(1000)}end\n`], [[2, 81]]);
		});

		test("10", async () => {
			const check = await conf(
				"line-length: {max: 10}",
				"new-line-at-end-of-file: disable",
			);

			await check(["---\nABCD EFGHI"]);
			await check(["---\nABCD EFGHIJ"], [[2, 11]]);
			await check(["---\nABCD EFGHIJ\n"], [[2, 11]]);
		});
	});

	test("spaces", async () => {
		const check = await conf(
			"line-length: {max: 80}",
			"new-line-at-end-of-file: disable",
			"trailing-spaces: disable",
		);

		await check([`---\n${" ".repeat(81)}`], [[2, 81]]);
		await check([`---\n${" ".repeat(81)}\n`], [[2, 81]]);
	});

	describe("non breakable", () => {
		test("word", async () => {
			let check: Awaited<ReturnType<typeof conf>>;

			check = await conf(
				"line-length: {max: 20, allow-non-breakable-words: true}",
			);

			await check([
				"---",
				"A".repeat(30),
				"",
			], [
			]);

			await check([
				"---",
				"this:",
				"  is:",
				"    - a:",
				"        http://localhost/very/long/url",
				"...",
				"",
			], [
			]);

			await check([
				"---",
				"this:",
				"  is:",
				"    - a:",
				"        # http://localhost/very/long/url",
				"        comment",
				"...",
				"",
			], [
			]);

			await check([
				"---",
				"this:",
				"is:",
				"another:",
				"  - https://localhost/very/very/long/url",
				"...",
				"",
			], [
			]);

			await check([
				"---",
				"long_line: http://localhost/very/very/long/url",
				"...",
				"",
			], [
				[2, 21],
			]);



			check = await conf(
				"line-length: {max: 20, allow-non-breakable-words: false}",
			);

			await check([
				"---",
				"A".repeat(30),
				"",
			], [
				[2, 21],
			]);

			await check([
				"---",
				"this:",
				"  is:",
				"    - a:",
				"        http://localhost/very/long/url",
				"...",
				"",
			], [
				[5, 21],
			]);

			await check([
				"---",
				"this:",
				"  is:",
				"    - a:",
				"        # http://localhost/very/long/url",
				"        comment",
				"...",
				"",
			], [
				[5, 21],
			]);

			await check([
				"---",
				"this:",
				"is:",
				"another:",
				"  - https://localhost/very/very/long/url",
				"...",
				"",
			], [
				[5, 21],
			]);

			await check([
				"---",
				"long_line: http://localhost/very/very/long/url",
				"...",
				"",
			], [
				[2, 21],
			]);



			check = await conf(
				"line-length: {max: 20, allow-non-breakable-words: true}",
			);

			await check([
				"---",
				"# http://www.verylongurlurlurlurlurlurlurlurl.com",
				"key:",
				"  subkey: value",
				"",
			], [
			]);

			await check([
				"---",
				"## http://www.verylongurlurlurlurlurlurlurlurl.com",
				"key:",
				"  subkey: value",
				"",
			], [
			]);

			await check([
				"---",
				"# # http://www.verylongurlurlurlurlurlurlurlurl.com",
				"key:",
				"  subkey: value",
				"",
			], [
				[2, 21],
			]);

			await check([
				"---",
				"#A http://www.verylongurlurlurlurlurlurlurlurl.com",
				"key:",
				"  subkey: value",
				"",
			], [
				[2, 2, "comments"],
				[2, 21, "line-length"],
			]);



			check = await conf(
				"line-length: {max: 20, allow-non-breakable-words: true}",
				"trailing-spaces: disable",
			);

			await check([
				"---",
				"loooooooooong+word+and+some+space+at+the+end       ",
				"",
			], [
				[2, 21],
			]);
		});

		test("inline mappings", async () => {
			let check: Awaited<ReturnType<typeof conf>>;

			check = await conf(
				"line-length: {max: 20, allow-non-breakable-inline-mappings: true}",
			);

			await check([
				"---",
				"long_line: http://localhost/very/very/long/url",
				"long line: http://localhost/very/very/long/url",
				"",
			], [
			]);

			await check([
				"---",
				"- long line: http://localhost/very/very/long/url",
				"",
			], [
			]);

			await check([
				"---",
				"long_line: http://localhost/short/url + word",
				"long line: http://localhost/short/url + word",
				"",
			], [
				[2, 21],
				[3, 21],
			]);



			check = await conf(
				"line-length: {max: 20, allow-non-breakable-inline-mappings: true}",
				"trailing-spaces: disable",
			);

			await check([
				"---",
				"long_line: and+some+space+at+the+end       ",
				"",
			], [
				[2, 21],
			]);

			await check([
				"---",
				"long line: and+some+space+at+the+end       ",
				"",
			], [
				[2, 21],
			]);

			await check([
				"---",
				"- long line: and+some+space+at+the+end       ",
				"",
			], [
				[2, 21],
			]);



			// See https://github.com/adrienverge/yamllint/issues/21

			check = await conf(
				"line-length: {allow-non-breakable-inline-mappings: true}",
			);

			await check([
				"---",
				"content: |",
				`  {% this line is${" really".repeat(99)} long %}`,
				"",
			], [
				[3, 81],
			]);
		});
	});

	test("unicode", async () => {
		let check: Awaited<ReturnType<typeof conf>>;

		check = await conf(
			"line-length: {max: 53}",
		);

		await check([
			"---",
			"# This is a test to check if “line-length” works nice",
			"with: “unicode characters” that span across bytes! ↺",
			"",
		], [
		]);



		check = await conf(
			"line-length: {max: 51}",
		);

		await check([
			"---",
			"# This is a test to check if “line-length” works nice",
			"with: “unicode characters” that span across bytes! ↺",
			"",
		], [
			[2, 52],
			[3, 52],
		]);
	});

	test("with dos newlines", async () => {
		const check = await conf(
			"line-length: {max: 10}",
			"new-lines: {type: dos}",
			"new-line-at-end-of-file: disable",
		);

		await check(["---\r\nABCD EFGHI"]);
		await check(["---\r\nABCD EFGHI\r\n"]);
		await check(["---\r\nABCD EFGHIJ"], [[2, 11]]);
		await check(["---\r\nABCD EFGHIJ\r\n"], [[2, 11]]);
	});
});
