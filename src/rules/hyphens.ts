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
 * Use this rule to control the number of spaces after hyphens (``-``).
 *
 * .. rubric:: Options
 *
 * * ``max-spaces-after`` defines the maximal number of spaces allowed after
 *   hyphens.
 *
 * .. rubric:: Default values (when enabled)
 *
 * .. code-block:: yaml
 *
 *  rules:
 *    hyphens:
 *      max-spaces-after: 1
 *
 * .. rubric:: Examples
 *
 * #. With ``hyphens: {max-spaces-after: 1}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     - first list:
 *         - a
 *         - b
 *     - - 1
 *       - 2
 *       - 3
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     -  first list:
 *          - a
 *          - b
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     - - 1
 *       -  2
 *       - 3
 *
 * #. With ``hyphens: {max-spaces-after: 3}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     -   key
 *     -  key2
 *     - key42
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     -    key
 *     -   key2
 *     -  key42
 */

import z from "zod";

import type { TokenCheckProps } from "./types";
import { spacesAfter } from "./common";



export const ID = "hyphens";
export const TYPE = "token";
export const CONF = z.object({
	"max-spaces-after": z.int(),
});
export const DEFAULT: Conf = {
	"max-spaces-after": 1,
};

export type Conf = z.infer<typeof CONF>;



export function* check({ conf, token }: TokenCheckProps<Conf>) {
	if (token.data.type === "seq-item-ind") {
		const problem = spacesAfter(token, {
			max: conf["max-spaces-after"],
			maxDesc: "too many spaces after hyphen",
		});
		if (problem) yield problem;
	}
}
