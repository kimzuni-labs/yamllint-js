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
 * Use this rule to require or forbid the use of document start marker (``---``).
 *
 * .. rubric:: Options
 *
 * * Set ``present`` to ``true`` when the document start marker is required, or to
 *   ``false`` when it is forbidden.
 *
 * .. rubric:: Default values (when enabled)
 *
 * .. code-block:: yaml
 *
 *  rules:
 *    document-start:
 *      present: true
 *
 * .. rubric:: Examples
 *
 * #. With ``document-start: {present: true}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     ---
 *     this:
 *       is: [a, document]
 *     ---
 *     - this
 *     - is: another one
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     this:
 *       is: [a, document]
 *     ---
 *     - this
 *     - is: another one
 *
 * #. With ``document-start: {present: false}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     this:
 *       is: [a, document]
 *     ...
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     ---
 *     this:
 *       is: [a, document]
 *     ...
 */

import z from "zod";

import { LintProblem } from "../linter";

import type { TokenCheckProps } from "./types";



export const ID = "document-start";
export const TYPE = "token";
export const CONF = z.object({
	present: z.boolean(),
});
export const DEFAULT: Conf = {
	present: true,
};

export type Conf = z.infer<typeof CONF>;



export function* check({ conf, token }: TokenCheckProps<Conf>) {
	if (conf.present) {
		if (
			token.data.type === "document"
			&& token.next?.data.type !== "doc-start"
			&& token.prev?.data.type !== "directive"
			&& (
				!token.next
				|| !("source" in token.next.data)
				|| token.next.data.source.trim()
			)
		) {
			yield new LintProblem(
				token.startMark.line,
				1,
				"missing document start \"---\"",
			);
		}
	} else {
		if (token.data.type === "doc-start") {
			yield new LintProblem(
				token.startMark.line,
				token.startMark.column,
				"found forbidden document start \"---\"",
			);
		}
	}
}
