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



describe("Document End Test Case", () => {
	const conf = ruleTestCase("document-end");

	test("disabled", async () => {
		const check = await conf("document-end: disable");

		await check([
			"---",
			"with:",
			"  document: end",
			"...",
			"",
		], [
		]);

		await check([
			"---",
			"without:",
			"  document: end",
			"",
		], [
		]);
	});

	test("required", async () => {
		const check = await conf(
			"document-end: {present: true}",
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
			"---",
			"with:",
			"  document: end",
			"...",
			"",
		], [
		]);

		await check([
			"---",
			"without:",
			"  document: end",
			"",
		], [
			[3, 1],
		]);
	});

	test("forbidden", async () => {
		const check = await conf(
			"document-end: {present: false}",
		);

		await check([
			"---",
			"with:",
			"  document: end",
			"...",
			"",
		], [
			[4, 1],
		]);

		await check([
			"---",
			"without:",
			"  document: end",
			"",
		], [
		]);
	});

	test("multiple documents", async () => {
		const check = await conf(
			"document-end: {present: true}",
			"document-start: disable",
		);

		await check([
			"---",
			"first: document",
			"...",
			"---",
			"second: document",
			"...",
			"---",
			"third: document",
			"...",
			"",
		], [
		]);

		await check([
			"---",
			"first: document",
			"...",
			"---",
			"second: document",
			"---",
			"third: document",
			"...",
			"",
		], [
			[6, 1],
		]);
	});

	test("directives", async () => {
		const check = await conf(
			"document-end: {present: true}",
		);

		await check([
			"%YAML 1.2",
			"---",
			"document: end",
			"...",
			"",
		], [
		]);

		await check([
			"%YAML 1.2",
			"%TAG ! tag:clarkevans.com,2002:",
			"---",
			"document: end",
			"...",
			"",
		], [
		]);

		await check([
			"---",
			"first: document",
			"...",
			"%YAML 1.2",
			"---",
			"second: document",
			"...",
			"",
		], [
		]);
	});
});
