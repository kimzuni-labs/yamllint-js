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



describe("Octal Values Test Case", () => {
	const conf = ruleTestCase("octal-values");

	test("disabled", async () => {
		const check = await conf(
			"octal-values: disable",
			"new-line-at-end-of-file: disable",
			"document-start: disable",
		);

		await check(["user-city: 010"]);
		await check(["user-city: 0o10"]);
	});

	test("implicit", async () => {
		const check = await conf(
			"octal-values:",
			"  forbid-implicit-octal: true",
			"  forbid-explicit-octal: false",
			"new-line-at-end-of-file: disable",
			"document-start: disable",
		);

		await check([
			"after-tag: !custom_tag 010",
		], [
		]);

		await check([
			"user-city: 010",
		], [
			[1, 15],
		]);

		await check([
			"user-city: abc",
		], [
		]);

		await check([
			"user-city: 010,0571",
		], [
		]);

		await check([
			"user-city: '010'",
		], [
		]);

		await check([
			"user-city: \"010\"",
		], [
		]);

		await check([
			"user-city:",
			"  - 010",
		], [
			[2, 8],
		]);

		await check([
			"user-city: [010]",
		], [
			[1, 16],
		]);

		await check([
			"user-city: {beijing: 010}",
		], [
			[1, 25],
		]);

		await check([
			"explicit-octal: 0o10",
		], [
		]);

		await check([
			"not-number: 0abc",
		], [
		]);

		await check([
			"zero: 0",
		], [
		]);

		await check([
			"hex-value: 0x10",
		], [
		]);

		await check([
			"number-values:",
			"  - 0.10",
			"  - .01",
			"  - 0e3",
		], [
		]);

		await check([
			"with-decimal-digits: 012345678",
		], [
		]);

		await check([
			"with-decimal-digits: 012345679",
		], [
		]);
	});

	test("explicit", async () => {
		const check = await conf(
			"octal-values:",
			"  forbid-implicit-octal: false",
			"  forbid-explicit-octal: true",
			"new-line-at-end-of-file: disable",
			"document-start: disable",
		);

		await check([
			"user-city: 0o10",
		], [
			[1, 16],
		]);

		await check([
			"user-city: abc",
		], [
		]);

		await check([
			"user-city: 0o10,0571",
		], [
		]);

		await check([
			"user-city: '0o10'",
		], [
		]);

		await check([
			"user-city:",
			"  - 0o10",
		], [
			[2, 9],
		]);

		await check([
			"user-city: [0o10]",
		], [
			[1, 17],
		]);

		await check([
			"user-city: {beijing: 0o10}",
		], [
			[1, 26],
		]);

		await check([
			"implicit-octal: 010",
		], [
		]);

		await check([
			"not-number: 0oabc",
		], [
		]);

		await check([
			"zero: 0",
		], [
		]);

		await check([
			"hex-value: 0x10",
		], [
		]);

		await check([
			"number-values:",
			"  - 0.10",
			"  - .01",
			"  - 0e3",
		], [
		]);

		await check([
			"user-city: \"010\"",
		], [
		]);

		await check([
			"with-decimal-digits: 0o012345678",
		], [
		]);

		await check([
			"with-decimal-digits: 0o012345679",
		], [
		]);
	});
});
