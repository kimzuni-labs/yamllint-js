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

/**
 * @file
 *
 * Use this rule to control the use of flow sequences or the number of spaces
 * inside brackets (``[`` and ``]``).
 *
 * .. rubric:: Options
 *
 * * ``forbid`` is used to forbid the use of flow sequences which are denoted by
 *   surrounding brackets (``[`` and ``]``). Use ``true`` to forbid the use of
 *   flow sequences completely. Use ``non-empty`` to forbid the use of all flow
 *   sequences except for empty ones.
 * * ``min-spaces-inside`` defines the minimal number of spaces required inside
 *   brackets.
 * * ``max-spaces-inside`` defines the maximal number of spaces allowed inside
 *   brackets.
 * * ``min-spaces-inside-empty`` defines the minimal number of spaces required
 *   inside empty brackets.
 * * ``max-spaces-inside-empty`` defines the maximal number of spaces allowed
 *   inside empty brackets.
 *
 * .. rubric:: Default values (when enabled)
 *
 * .. code-block:: yaml
 *
 *  rules:
 *    brackets:
 *      forbid: false
 *      min-spaces-inside: 0
 *      max-spaces-inside: 0
 *      min-spaces-inside-empty: -1
 *      max-spaces-inside-empty: -1
 *
 * .. rubric:: Examples
 *
 * #. With ``brackets: {forbid: true}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     object:
 *       - 1
 *       - 2
 *       - abc
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     object: [ 1, 2, abc ]
 *
 * #. With ``brackets: {forbid: non-empty}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     object: []
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     object: [ 1, 2, abc ]
 *
 * #. With ``brackets: {min-spaces-inside: 0, max-spaces-inside: 0}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     object: [1, 2, abc]
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     object: [ 1, 2, abc ]
 *
 * #. With ``brackets: {min-spaces-inside: 1, max-spaces-inside: 3}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     object: [ 1, 2, abc ]
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     object: [ 1, 2, abc   ]
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     object: [    1, 2, abc   ]
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     object: [1, 2, abc ]
 *
 * #. With ``brackets: {min-spaces-inside-empty: 0, max-spaces-inside-empty: 0}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     object: []
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     object: [ ]
 *
 * #. With ``brackets: {min-spaces-inside-empty: 1, max-spaces-inside-empty: -1}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     object: [         ]
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     object: []
 */

import z from "zod";

import { LintProblem } from "../linter";

import type { TokenCheckProps } from "./types";
import { spacesAfter, spacesBefore } from "./common";



export const ID = "brackets";
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
		&& token.data.type === "flow-seq-start"
	) {
		yield new LintProblem(
			token.startMark.line,
			token.endMark.column,
			"forbidden flow sequence",
		);
	} else if (
		conf.forbid === "non-empty"
		&& token.data.type === "flow-seq-start"
		&& token.next?.data.type !== "flow-seq-end"
	) {
		yield new LintProblem(
			token.startMark.line,
			token.endMark.column,
			"forbidden flow sequence",
		);
	} else if (
		token.data.type === "flow-seq-start"
		&& token.next?.data.type === "flow-seq-end"
	) {
		const problem = spacesAfter(token, {
			min: conf["min-spaces-inside-empty"] !== -1 ? conf["min-spaces-inside-empty"] : conf["min-spaces-inside"],
			max: conf["max-spaces-inside-empty"] !== -1 ? conf["max-spaces-inside-empty"] : conf["max-spaces-inside"],
			minDesc: "too few spaces inside empty brackets",
			maxDesc: "too many spaces inside empty brackets",
		});
		if (problem) yield problem;
	} else if (token.data.type === "flow-seq-start") {
		const problem = spacesAfter(token, {
			min: conf["min-spaces-inside"],
			max: conf["max-spaces-inside"],
			minDesc: "too few spaces inside brackets",
			maxDesc: "too many spaces inside brackets",
		});
		if (problem) yield problem;
	} else if (
		token.data.type === "flow-seq-end"
		&& (token.prev?.data.type !== "flow-seq-start")
	) {
		const problem = spacesBefore(token, {
			min: conf["min-spaces-inside"],
			max: conf["max-spaces-inside"],
			minDesc: "too few spaces inside brackets",
			maxDesc: "too many spaces inside brackets",
		});
		if (problem) yield problem;
	}
}
