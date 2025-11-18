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
 * Use this rule to control the number of spaces before and after commas (``,``).
 *
 * .. rubric:: Options
 *
 * * ``max-spaces-before`` defines the maximal number of spaces allowed before
 *   commas (use ``-1`` to disable).
 * * ``min-spaces-after`` defines the minimal number of spaces required after
 *   commas.
 * * ``max-spaces-after`` defines the maximal number of spaces allowed after
 *   commas (use ``-1`` to disable).
 *
 * .. rubric:: Default values (when enabled)
 *
 * .. code-block:: yaml
 *
 *  rules:
 *    commas:
 *      max-spaces-before: 0
 *      min-spaces-after: 1
 *      max-spaces-after: 1
 *
 * .. rubric:: Examples
 *
 * #. With ``commas: {max-spaces-before: 0}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     strange var:
 *       [10, 20, 30, {x: 1, y: 2}]
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     strange var:
 *       [10, 20 , 30, {x: 1, y: 2}]
 *
 * #. With ``commas: {max-spaces-before: 2}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     strange var:
 *       [10  , 20 , 30,  {x: 1  , y: 2}]
 *
 * #. With ``commas: {max-spaces-before: -1}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     strange var:
 *       [10,
 *        20   , 30
 *        ,   {x: 1, y: 2}]
 *
 * #. With ``commas: {min-spaces-after: 1, max-spaces-after: 1}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     strange var:
 *       [10, 20, 30, {x: 1, y: 2}]
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     strange var:
 *       [10, 20,30,   {x: 1,   y: 2}]
 *
 * #. With ``commas: {min-spaces-after: 1, max-spaces-after: 3}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     strange var:
 *       [10, 20,  30,  {x: 1,   y: 2}]
 *
 * #. With ``commas: {min-spaces-after: 0, max-spaces-after: 1}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     strange var:
 *       [10, 20,30, {x: 1, y: 2}]
 */

import z from "zod";

import { LintProblem } from "../linter";

import type { TokenCheckProps } from "./types";
import { spacesAfter, spacesBefore } from "./common";



export const ID = "commas";
export const TYPE = "token";
export const CONF = z.object({
	"max-spaces-before": z.int(),
	"min-spaces-after": z.int(),
	"max-spaces-after": z.int(),
});
export const DEFAULT: Conf = {
	"max-spaces-before": 0,
	"min-spaces-after": 1,
	"max-spaces-after": 1,
};

export type Conf = z.infer<typeof CONF>;



export function* check({ conf, token }: TokenCheckProps<Conf>) {
	if (token.data.type === "comma") {
		if (
			token.prev
			&& conf["max-spaces-before"] !== -1
			&& token.prev.endMark.line < token.startMark.line
		) {
			yield new LintProblem(
				token.startMark.line,
				Math.max(1, token.startMark.column - 1),
				"too many spaces before comma",
			);
		} else {
			const problem = spacesBefore(token, {
				max: conf["max-spaces-before"],
				maxDesc: "too many spaces before comma",
			});
			if (problem) yield problem;
		}

		const problem = spacesAfter(token, {
			min: conf["min-spaces-after"],
			max: conf["max-spaces-after"],
			minDesc: "too few spaces after comma",
			maxDesc: "too many spaces after comma",
		});
		if (problem) yield problem;
	}
}
