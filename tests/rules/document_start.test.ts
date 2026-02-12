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



describe("Document Start Test Case", () => {
	const conf = ruleTestCase("document-start");

	test("disabled", async () => {
		const check = await conf("document-start: disable");

		await check([
			"",
		], [
		]);

		await check([
			"key: val",
			"",
		], [
		]);

		await check([
			"---",
			"key: val",
			"",
		], [
		]);
	});

	test("required", async () => {
		const check = await conf(
			"document-start: {present: true}",
			"empty-lines: disable",
		);

		await check([
			"",
		], [
		]);

		await check([
			"\n",
		], [
		]);

		await check([
			"key: val",
			"",
		], [
			[1, 1],
		]);

		await check([
			"\n",
			"key: val",
			"",
		], [
			[3, 1],
		]);

		await check([
			"---",
			"key: val",
			"",
		], [
		]);

		await check([
			"\n",
			"---",
			"key: val",
			"",
		], [
		]);
	});

	test("forbidden", async () => {
		const check = await conf(
			"document-start: {present: false}",
			"empty-lines: disable",
		);

		await check([
			"",
		], [
		]);

		await check([
			"key: val",
			"",
		], [
		]);

		await check([
			"\n",
			"key: val",
			"",
		], [
		]);

		await check([
			"---",
			"key: val",
			"",
		], [
			[1, 1],
		]);

		await check([
			"\n",
			"---",
			"key: val",
			"",
		], [
			[3, 1],
		]);

		await check([
			"first: document",
			"---",
			"key: val",
			"",
		], [
			[2, 1],
		]);
	});

	test("multiple documents", async () => {
		const check = await conf(
			"document-start: {present: true}",
		);

		await check([
			"---",
			"first: document",
			"...",
			"---",
			"second: document",
			"...",
			"---",
			"third: documen",
			"",
		], [
		]);

		await check([
			"---",
			"first: document",
			"---",
			"second: document",
			"---",
			"third: document",
			"",
		], [
		]);

		await check([
			"---",
			"first: document",
			"...",
			"second: document",
			"---",
			"third: document",
			"",
		], [
			[4, 1],
		]);
	});

	test("directives", async () => {
		const check = await conf(
			"document-start: {present: true}",
		);

		await check([
			"%YAML 1.2",
			"---",
			"doc: ument",
			"...",
			"",
		], [
		]);

		await check([
			"%YAML 1.2",
			"%TAG ! tag:clarkevans.com,2002:",
			"---",
			"doc: ument",
			"...",
			"",
		], [
		]);

		await check([
			"---",
			"doc: 1",
			"...",
			"%YAML 1.2",
			"---",
			"doc: 2",
			"...",
			"",
		], [
		]);
	});
});
