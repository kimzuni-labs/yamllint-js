/*
 * Copyright (C) 2022 the yamllint contributors
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



describe("Float Values Test Case", () => {
	const conf = ruleTestCase("float-values");

	test("disabled", async () => {
		const check = await conf("float-values: disable");

		await check([
			"---",
			"- 0.0",
			"- .NaN",
			"- .INF",
			"- .1",
			"- 10e-6",
			"",
		], [
		]);
	});

	test("numeral before decimal", async () => {
		const check = await conf(
			"float-values:",
			"  require-numeral-before-decimal: true",
			"  forbid-scientific-notation: false",
			"  forbid-nan: false",
			"  forbid-inf: false",
		);

		await check([
			"---",
			"- 0.0",
			"- .1",
			"- '.1'",
			"- string.1",
			"- .1string",
			"- !custom_tag .2",
			"- &angle1 0.0",
			"- *angle1",
			"- &angle2 .3",
			"- *angle2",
			"",
		], [
			[3, 3],
			[10, 11],
		]);
	});

	test("scientific notation", async () => {
		const check = await conf(
			"float-values:",
			"  require-numeral-before-decimal: false",
			"  forbid-scientific-notation: true",
			"  forbid-nan: false",
			"  forbid-inf: false",
		);

		await check([
			"---",
			"- 10e6",
			"- 10e-6",
			"- 0.00001",
			"- '10e-6'",
			"- string10e-6",
			"- 10e-6string",
			"- !custom_tag 10e-6",
			"- &angle1 0.000001",
			"- *angle1",
			"- &angle2 10e-6",
			"- *angle2",
			"- &angle3 10e6",
			"- *angle3",
			"",
		], [
			[2, 3],
			[3, 3],
			[11, 11],
			[13, 11],
		]);
	});

	test("nan", async () => {
		const check = await conf(
			"float-values:",
			"  require-numeral-before-decimal: false",
			"  forbid-scientific-notation: false",
			"  forbid-nan: true",
			"  forbid-inf: false",
		);

		await check([
			"---",
			"- .NaN",
			"- .NAN",
			"- '.NaN'",
			"- a.NaN",
			"- .NaNa",
			"- !custom_tag .NaN",
			"- &angle .nan",
			"- *angle",
			"",
		], [
			[2, 3],
			[3, 3],
			[8, 10],
		]);
	});

	test("inf", async () => {
		const check = await conf(
			"float-values:",
			"  require-numeral-before-decimal: false",
			"  forbid-scientific-notation: false",
			"  forbid-nan: false",
			"  forbid-inf: true",
		);

		await check([
			"---",
			"- .inf",
			"- .INF",
			"- -.inf",
			"- -.INF",
			"- '.inf'",
			"- ∞.infinity",
			"- .infinity∞",
			"- !custom_tag .inf",
			"- &angle .inf",
			"- *angle",
			"- &angle -.inf",
			"- *angle",
			"",
		], [
			[2, 3],
			[3, 3],
			[4, 3],
			[5, 3],
			[10, 10],
			[12, 10],
		]);
	});
});
