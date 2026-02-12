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
 * Use this rule to control the number of spaces before and after colons (``:``).
 *
 * .. rubric:: Options
 *
 * * ``max-spaces-before`` defines the maximal number of spaces allowed before
 *   colons (use ``-1`` to disable).
 * * ``max-spaces-after`` defines the maximal number of spaces allowed after
 *   colons (use ``-1`` to disable).
 *
 * .. rubric:: Default values (when enabled)
 *
 * .. code-block:: yaml
 *
 *  rules:
 *    colons:
 *      max-spaces-before: 0
 *      max-spaces-after: 1
 *
 * .. rubric:: Examples
 *
 * #. With ``colons: {max-spaces-before: 0, max-spaces-after: 1}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     object:
 *       - a
 *       - b
 *     key: value
 *
 * #. With ``colons: {max-spaces-before: 1}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     object :
 *       - a
 *       - b
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     object  :
 *       - a
 *       - b
 *
 * #. With ``colons: {max-spaces-after: 2}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     first:  1
 *     second: 2
 *     third:  3
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     first: 1
 *     2nd:   2
 *     third: 3
 */

import z from "zod";

import type { TokenCheckProps } from "./types";
import { spacesAfter, spacesBefore } from "./common";



export const ID = "colons";
export const TYPE = "token";
export const CONF = z.object({
	"max-spaces-before": z.int(),
	"max-spaces-after": z.int(),
});
export const DEFAULT: Conf = {
	"max-spaces-before": 0,
	"max-spaces-after": 1,
};

export type Conf = z.infer<typeof CONF>;



export function* check({ conf, token }: TokenCheckProps<Conf>) {
	if (
		token.data.type === "map-value-ind"
		&& !(
			token.prev?.data.type === "alias"
			&& token.startMark.pointer - token.prev.endMark.pointer === 1
		)
	) {
		let problem = spacesBefore(token, {
			max: conf["max-spaces-before"],
			maxDesc: "too many spaces before colon",
		});
		if (problem) yield problem;

		problem = spacesAfter(token, {
			max: conf["max-spaces-after"],
			maxDesc: "too many spaces after colon",
		});
		if (problem) yield problem;
	}

	if (token.data.type === "explicit-key-ind") {
		const problem = spacesAfter(token, {
			max: conf["max-spaces-after"],
			maxDesc: "too many spaces after question mark",
		});
		if (problem) yield problem;
	}
}
