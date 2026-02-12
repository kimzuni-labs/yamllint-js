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

/**
 * @file
 *
 * Use this rule to control the use of flow mappings or number of spaces inside
 * braces (``{`` and ``}``).
 *
 * .. rubric:: Options
 *
 * * ``forbid`` is used to forbid the use of flow mappings which are denoted by
 *   surrounding braces (``{`` and ``}``). Use ``true`` to forbid the use of flow
 *   mappings completely. Use ``non-empty`` to forbid the use of all flow
 *   mappings except for empty ones.
 * * ``min-spaces-inside`` defines the minimal number of spaces required inside
 *   braces.
 * * ``max-spaces-inside`` defines the maximal number of spaces allowed inside
 *   braces.
 * * ``min-spaces-inside-empty`` defines the minimal number of spaces required
 *   inside empty braces.
 * * ``max-spaces-inside-empty`` defines the maximal number of spaces allowed
 *   inside empty braces.
 *
 * .. rubric:: Default values (when enabled)
 *
 * .. code-block:: yaml
 *
 *  rules:
 *    braces:
 *      forbid: false
 *      min-spaces-inside: 0
 *      max-spaces-inside: 0
 *      min-spaces-inside-empty: -1
 *      max-spaces-inside-empty: -1
 *
 * .. rubric:: Examples
 *
 * #. With ``braces: {forbid: true}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     object:
 *       key1: 4
 *       key2: 8
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     object: { key1: 4, key2: 8 }
 *
 * #. With ``braces: {forbid: non-empty}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     object: {}
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     object: { key1: 4, key2: 8 }
 *
 * #. With ``braces: {min-spaces-inside: 0, max-spaces-inside: 0}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     object: {key1: 4, key2: 8}
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     object: { key1: 4, key2: 8 }
 *
 * #. With ``braces: {min-spaces-inside: 1, max-spaces-inside: 3}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     object: { key1: 4, key2: 8 }
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     object: { key1: 4, key2: 8   }
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     object: {    key1: 4, key2: 8   }
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     object: {key1: 4, key2: 8 }
 *
 * #. With ``braces: {min-spaces-inside-empty: 0, max-spaces-inside-empty: 0}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     object: {}
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     object: { }
 *
 * #. With ``braces: {min-spaces-inside-empty: 1, max-spaces-inside-empty: -1}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     object: {         }
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     object: {}
 */

import z from "zod";

import { LintProblem } from "../linter";

import type { TokenCheckProps } from "./types";
import { spacesAfter, spacesBefore } from "./common";



export const ID = "braces";
export const TYPE = "token";
export const CONF = z.object({
	forbid: z.union([z.boolean(), z.literal("non-empty")]),
	"min-spaces-inside": z.int(),
	"max-spaces-inside": z.int(),
	"min-spaces-inside-empty": z.int(),
	"max-spaces-inside-empty": z.int(),
});
export const DEFAULT: Conf = {
	forbid: false,
	"min-spaces-inside": 0,
	"max-spaces-inside": 0,
	"min-spaces-inside-empty": -1,
	"max-spaces-inside-empty": -1,
};

export type Conf = z.infer<typeof CONF>;



export function* check({ conf, token }: TokenCheckProps<Conf>) {
	if (
		conf.forbid === true
		&& token.data.type === "flow-map-start"
	) {
		yield new LintProblem(
			token.startMark.line,
			token.endMark.column,
			"forbidden flow mapping",
		);
	} else if (
		conf.forbid === "non-empty"
		&& token.data.type === "flow-map-start"
		&& token.next?.data.type !== "flow-map-end"
	) {
		yield new LintProblem(
			token.startMark.line,
			token.endMark.column,
			"forbidden flow mapping",
		);
	} else if (
		token.data.type === "flow-map-start"
		&& token.next?.data.type === "flow-map-end"
	) {
		const problem = spacesAfter(token, {
			min: conf["min-spaces-inside-empty"] !== -1 ? conf["min-spaces-inside-empty"] : conf["min-spaces-inside"],
			max: conf["max-spaces-inside-empty"] !== -1 ? conf["max-spaces-inside-empty"] : conf["max-spaces-inside"],
			minDesc: "too few spaces inside empty braces",
			maxDesc: "too many spaces inside empty braces",
		});
		if (problem) yield problem;
	} else if (token.data.type === "flow-map-start") {
		const problem = spacesAfter(token, {
			min: conf["min-spaces-inside"],
			max: conf["max-spaces-inside"],
			minDesc: "too few spaces inside braces",
			maxDesc: "too many spaces inside braces",
		});
		if (problem) yield problem;
	} else if (
		token.data.type === "flow-map-end"
		&& (token.prev?.data.type !== "flow-map-start")
	) {
		const problem = spacesBefore(token, {
			min: conf["min-spaces-inside"],
			max: conf["max-spaces-inside"],
			minDesc: "too few spaces inside braces",
			maxDesc: "too many spaces inside braces",
		});
		if (problem) yield problem;
	}
}
