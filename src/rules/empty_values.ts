/*!
 * Copyright (C) 2017 Greg Dubicki
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
 * Use this rule to prevent nodes with empty content, that implicitly result in
 * ``null`` values.
 *
 * .. rubric:: Options
 *
 * * Use ``forbid-in-block-mappings`` to prevent empty values in block mappings.
 * * Use ``forbid-in-flow-mappings`` to prevent empty values in flow mappings.
 * * Use ``forbid-in-block-sequences`` to prevent empty values in block sequences.
 *
 * .. rubric:: Default values (when enabled)
 *
 * .. code-block:: yaml
 *
 *  rules:
 *    empty-values:
 *      forbid-in-block-mappings: true
 *      forbid-in-flow-mappings: true
 *      forbid-in-block-sequences: true
 *
 * .. rubric:: Examples
 *
 * #. With ``empty-values: {forbid-in-block-mappings: true}``
 *
 *    the following code snippets would **PASS**:
 *    ::
 *
 *     some-mapping:
 *       sub-element: correctly indented
 *
 *    ::
 *
 *     explicitly-null: null
 *
 *    the following code snippets would **FAIL**:
 *    ::
 *
 *     some-mapping:
 *     sub-element: incorrectly indented
 *
 *    ::
 *
 *     implicitly-null:
 *
 * #. With ``empty-values: {forbid-in-flow-mappings: true}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     {prop: null}
 *     {a: 1, b: 2, c: 3}
 *
 *    the following code snippets would **FAIL**:
 *    ::
 *
 *     {prop: }
 *
 *    ::
 *
 *     {a: 1, b:, c: 3}
 *
 * #. With ``empty-values: {forbid-in-block-sequences: true}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     some-sequence:
 *       - string item
 *
 *    ::
 *
 *     some-sequence:
 *       - null
 *
 *    the following code snippets would **FAIL**:
 *    ::
 *
 *     some-sequence:
 *       -
 *
 *    ::
 *
 *     some-sequence:
 *       - string item
 *       -
 */

import z from "zod";

import { LintProblem } from "../linter";

import type { TokenCheckProps } from "./types";



export const ID = "empty-values";
export const TYPE = "token";
export const CONF = z.object({
	"forbid-in-block-mappings": z.boolean(),
	"forbid-in-flow-mappings": z.boolean(),
	"forbid-in-block-sequences": z.boolean(),
});
export const DEFAULT: Conf = {
	"forbid-in-block-mappings": true,
	"forbid-in-flow-mappings": true,
	"forbid-in-block-sequences": true,
};

export type Conf = z.infer<typeof CONF>;



export function* check({ conf, token }: TokenCheckProps<Conf>) {
	if (conf["forbid-in-block-mappings"]) {
		if (
			token.data.type === "map-value-ind"
			&& (
				token.isBlockEnd
				|| token.next?.isKey
			)
		) {
			yield new LintProblem(
				token.startMark.line,
				token.endMark.column,
				"empty value in block mapping",
			);
		}
	}

	if (conf["forbid-in-flow-mappings"]) {
		if (
			token.data.type === "map-value-ind"
			&& (
				token.next?.data.type === "flow-map-end"
				|| token.next?.resolve?.value === ""
			)
		) {
			yield new LintProblem(
				token.startMark.line,
				token.endMark.column,
				"empty value in flow mapping",
			);
		}
	}

	if (conf["forbid-in-block-sequences"]) {
		if (
			token.data.type === "seq-item-ind"
			&& (
				token.isBlockEnd
				|| token.next?.isKey
				|| token.next?.data.type === "seq-item-ind"
			)
		) {
			yield new LintProblem(
				token.startMark.line,
				token.endMark.column,
				"empty value in block sequence",
			);
		}
	}
}
