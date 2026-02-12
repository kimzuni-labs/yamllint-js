/*!
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

/**
 * @file
 *
 * Use this rule to limit the permitted values for floating-point numbers.
 * YAML permits three classes of float expressions: approximation to real numbers,
 * positive and negative infinity and "not a number".
 *
 * .. rubric:: Options
 *
 * * Use ``require-numeral-before-decimal`` to require floats to start
 *   with a numeral (ex ``0.0`` instead of ``.0``).
 * * Use ``forbid-scientific-notation`` to forbid scientific notation.
 * * Use ``forbid-nan`` to forbid NaN (not a number) values.
 * * Use ``forbid-inf`` to forbid infinite values.
 *
 * .. rubric:: Default values (when enabled)
 *
 * .. code-block:: yaml
 *
 *     rules:
 *       float-values:
 *         forbid-inf: false
 *         forbid-nan: false
 *         forbid-scientific-notation: false
 *         require-numeral-before-decimal: false
 *
 * .. rubric:: Examples
 *
 * #. With ``float-values: {require-numeral-before-decimal: true}``
 *
 *    the following code snippets would **PASS**:
 *    ::
 *
 *     anemometer:
 *       angle: 0.0
 *
 *    the following code snippets would **FAIL**:
 *    ::
 *
 *     anemometer:
 *       angle: .0
 *
 * #. With ``float-values: {forbid-scientific-notation: true}``
 *
 *    the following code snippets would **PASS**:
 *    ::
 *
 *     anemometer:
 *       angle: 0.00001
 *
 *    the following code snippets would **FAIL**:
 *    ::
 *
 *     anemometer:
 *       angle: 10e-6
 *
 * #. With ``float-values: {forbid-nan: true}``
 *
 *    the following code snippets would **FAIL**:
 *    ::
 *
 *     anemometer:
 *       angle: .NaN
 *
 * #. With ``float-values: {forbid-inf: true}``
 *
 *    the following code snippets would **FAIL**:
 *    ::
 *
 *     anemometer:
 *       angle: .inf
 */

import z from "zod";

import { LintProblem } from "../linter";

import type { TokenCheckProps } from "./types";



export const ID = "float-values";
export const TYPE = "token";
export const CONF = z.object({
	"require-numeral-before-decimal": z.boolean(),
	"forbid-scientific-notation": z.boolean(),
	"forbid-nan": z.boolean(),
	"forbid-inf": z.boolean(),
});
export const DEFAULT: Conf = {
	"require-numeral-before-decimal": false,
	"forbid-scientific-notation": false,
	"forbid-nan": false,
	"forbid-inf": false,
};

export type Conf = z.infer<typeof CONF>;



const IS_NUMERAL_BEFORE_DECIMAL_PATTERN = /^[-+]?(\.[0-9]+)([eE][-+]?[0-9]+)?$/;
const IS_SCIENTIFIC_NOTATION_PATTERN = /^[-+]?(\.[0-9]+|[0-9]+(\.[0-9]*)?)([eE][-+]?[0-9]+)$/;
const IS_INF_PATTERN = /^[-+]?(\.inf|\.Inf|\.INF)$/;
const IS_NAN_PATTERN = /^(\.nan|\.NaN|\.NAN)$/;



export function* check({ conf, token }: TokenCheckProps<Conf>) {
	if (token.prev?.data.type === "tag") return;
	if (token.resolve?.type !== "PLAIN") return;

	const val = token.resolve.value;
	const { line, column } = token.startMark;
	const lp = (msg: string) => new LintProblem(line, column, msg);

	if (
		conf["forbid-nan"]
		&& IS_NAN_PATTERN.test(val)
	) yield lp(`forbidden not a number value "${val}"`);

	if (
		conf["forbid-inf"]
		&& IS_INF_PATTERN.test(val)
	) yield lp(`forbidden infinite value "${val}"`);

	if (
		conf["forbid-scientific-notation"]
		&& IS_SCIENTIFIC_NOTATION_PATTERN.test(val)
	) yield lp(`forbidden scientific notation "${val}"`);

	if (
		conf["require-numeral-before-decimal"]
		&& IS_NUMERAL_BEFORE_DECIMAL_PATTERN.test(val)
	) yield lp(`forbidden decimal missing 0 prefix "${val}"`);
}
