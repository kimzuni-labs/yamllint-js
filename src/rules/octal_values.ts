/*
 * Copyright (C) 2017 ScienJus
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
 * Use this rule to prevent values with octal numbers. In YAML, numbers that
 * start with ``0`` are interpreted as octal, but this is not always wanted.
 * For instance ``010`` is the city code of Beijing, and should not be
 * converted to ``8``.
 *
 * .. rubric:: Options
 *
 * * Use ``forbid-implicit-octal`` to prevent numbers starting with ``0``.
 * * Use ``forbid-explicit-octal`` to prevent numbers starting with ``0o``.
 *
 * .. rubric:: Default values (when enabled)
 *
 * .. code-block:: yaml
 *
 *  rules:
 *    octal-values:
 *      forbid-implicit-octal: true
 *      forbid-explicit-octal: true
 *
 * .. rubric:: Examples
 *
 * #. With ``octal-values: {forbid-implicit-octal: true}``
 *
 *    the following code snippets would **PASS**:
 *    ::
 *
 *     user:
 *       city-code: '010'
 *
 *    the following code snippets would **PASS**:
 *    ::
 *
 *     user:
 *       city-code: 010,021
 *
 *    the following code snippets would **FAIL**:
 *    ::
 *
 *     user:
 *       city-code: 010
 *
 * #. With ``octal-values: {forbid-explicit-octal: true}``
 *
 *    the following code snippets would **PASS**:
 *    ::
 *
 *     user:
 *       city-code: '0o10'
 *
 *    the following code snippets would **FAIL**:
 *    ::
 *
 *     user:
 *       city-code: 0o10
 */

import z from "zod";

import { LintProblem } from "../linter";

import type { TokenCheckProps } from "./types";



export const ID = "octal-values";
export const TYPE = "token";
export const CONF = z.object({
	"forbid-implicit-octal": z.boolean(),
	"forbid-explicit-octal": z.boolean(),
});
export const DEFAULT: Conf = {
	"forbid-implicit-octal": true,
	"forbid-explicit-octal": true,
};

export type Conf = z.infer<typeof CONF>;



const IS_OCTAL_NUMBER_PATTERN = /^[0-7]+$/;



export function* check({ conf, token }: TokenCheckProps<Conf>) {
	if (token.prev?.data.type === "tag") return;

	if (conf["forbid-implicit-octal"]) {
		if (token.resolve?.type === "PLAIN") {
			const val = token.resolve.value;
			if (
				Number.isInteger(Number(val))
				&& val.length > 1
				&& val.startsWith("0")
				&& IS_OCTAL_NUMBER_PATTERN.test(val.slice(1))
			) {
				yield new LintProblem(
					token.startMark.line,
					token.endMark.column,
					`forbidden implicit octal value "${val}"`,
				);
			}
		}
	}

	if (conf["forbid-explicit-octal"]) {
		if (token.resolve?.type === "PLAIN") {
			const val = token.resolve.value;
			if (
				val.length > 2
				&& val.startsWith("0o")
				&& IS_OCTAL_NUMBER_PATTERN.test(val.slice(2))
			) {
				yield new LintProblem(
					token.startMark.line,
					token.endMark.column,
					`forbidden explicit octal value "${val}"`,
				);
			}
		}
	}
}
