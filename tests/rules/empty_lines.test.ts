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



describe("Empty Lines Test Case", () => {
	const conf = ruleTestCase("empty-lines");

	test("disabled", async () => {
		const check = await conf(
			"empty-lines: disable",
			"new-line-at-end-of-file: disable",

			// "document-start: disable",
		);

		await check([""]);
		await check(["\n"]);
		await check(["\n\n"]);
		await check(["\n\n\n\n\n\n\n\n\n"]);
		await check(["some text\n\n\n\n\n\n\n\n\n"]);
		await check(["\n\n\n\n\n\n\n\n\nsome text"]);
		await check(["\n\n\nsome text\n\n\n"]);
	});

	test("empty document", async () => {
		const check = await conf(
			"empty-lines: {max: 0, max-start: 0, max-end: 0}",
			"new-line-at-end-of-file: disable",

			// "document-start: disable",
		);

		await check([""]);
		await check(["\n"]);
	});

	describe("empty lines", () => {
		test("normal", async () => {
			let check: Awaited<ReturnType<typeof conf>>;

			check = await conf(
				"empty-lines: {max: 0, max-start: 0, max-end: 0}",
				"new-line-at-end-of-file: disable",
			);

			await check(["---\n"]);
			await check(["---\ntext\n\ntext"], [[3, 1]]);
			await check(["---\ntext\n\ntext\n"], [[3, 1]]);



			check = await conf(
				"empty-lines: {max: 10, max-start: 0, max-end: 0}",
			);

			await check(["---\nintro\n\n\n\n\n\n\n\n\n\n\nconclusion\n"]);
			await check(["---\nintro\n\n\n\n\n\n\n\n\n\n\n\nconclusion\n"], [[13, 1]]);
		});

		test("at start", async () => {
			let check: Awaited<ReturnType<typeof conf>>;

			check = await conf(
				"empty-lines: {max: 2, max-start: 4, max-end: 0}",

				// "document-start: disable",
			);

			await check(["\n\n\n\nnon empty\n"]);
			await check(["\n\n\n\n\nnon empty\n"], [[5, 1]]);



			check = await conf(
				"empty-lines: {max: 2, max-start: 0, max-end: 0}",

				// "document-start: disable",
			);

			await check(["non empty\n"]);
			await check(["\nnon empty\n"], [[1, 1]]);
		});

		test("at end", async () => {
			let check: Awaited<ReturnType<typeof conf>>;

			check = await conf(
				"empty-lines: {max: 2, max-start: 0, max-end: 4}",

				// "document-start: disable",
			);

			await check(["non empty\n\n\n\n\n"]);
			await check(["non empty\n\n\n\n\n\n"], [[6, 1]]);



			check = await conf(
				"empty-lines: {max: 2, max-start: 0, max-end: 0}",

				// "document-start: disable",
			);

			await check(["non empty\n"]);
			await check(["non empty\n\n"], [[2, 1]]);
		});
	});

	test("spaces", async () => {
		const check = await conf(
			"empty-lines: {max: 1, max-start: 0, max-end: 0}",
			"trailing-spaces: disable",
		);

		await check(["---\nintro\n\n \n\nconclusion\n"]);
		await check(["---\nintro\n\n \n\n\nconclusion\n"], [[6, 1]]);
	});

	test("with dos newlines", async () => {
		const check = await conf(
			"empty-lines: {max: 2, max-start: 0, max-end: 0}",
			"new-lines: {type: dos}",

			// "document-start: disable",
		);

		await check(["---\r\n"]);
		await check(["---\r\ntext\r\n\r\ntext\r\n"]);
		await check(["\r\n---\r\ntext\r\n\r\ntext\r\n"], [[1, 1]]);
		await check(["\r\n\r\n\r\n---\r\ntext\r\n\r\ntext\r\n"], [[3, 1]]);
		await check(["---\r\ntext\r\n\r\n\r\n\r\ntext\r\n"], [[5, 1]]);
		await check(["---\r\ntext\r\n\r\n\r\n\r\n\r\n\r\n\r\ntext\r\n"], [[8, 1]]);
		await check(["---\r\ntext\r\n\r\ntext\r\n\r\n"], [[5, 1]]);
		await check(["---\r\ntext\r\n\r\ntext\r\n\r\n\r\n\r\n"], [[7, 1]]);
	});
});
