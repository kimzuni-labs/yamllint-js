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
 * Use this rule to require or forbid the use of document end marker (``...``).
 *
 * .. rubric:: Options
 *
 * * Set ``present`` to ``true`` when the document end marker is required, or to
 *   ``false`` when it is forbidden.
 *
 * .. rubric:: Default values (when enabled)
 *
 * .. code-block:: yaml
 *
 *  rules:
 *    document-end:
 *      present: true
 *
 * .. rubric:: Examples
 *
 * #. With ``document-end: {present: true}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     ---
 *     this:
 *       is: [a, document]
 *     ...
 *     ---
 *     - this
 *     - is: another one
 *     ...
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     ---
 *     this:
 *       is: [a, document]
 *     ---
 *     - this
 *     - is: another one
 *     ...
 *
 * #. With ``document-end: {present: false}``
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
 *     ---
 *     this:
 *       is: [a, document]
 *     ...
 *     ---
 *     - this
 *     - is: another one
 */

import z from "zod";

import { LintProblem } from "../linter";

import type { TokenCheckProps } from "./types";



export const ID = "document-end";
export const TYPE = "token";
export const CONF = z.object({
	present: z.boolean(),
});
export const DEFAULT: Conf = {
	present: true,
};

export type Conf = z.infer<typeof CONF>;
export interface Context {
	inDocument?: boolean;
}



export function* check({ conf, token, context }: TokenCheckProps<Conf, Context>) {
	context.inDocument ??= false;

	if (conf.present) {
		if (token.data.type === "doc-end") {
			context.inDocument = false;
		} else if (
			token.data.type === "doc-start"
			|| token.endMark.pointer + 1 >= token.buffer.length
		) {
			if (context.inDocument) {
				yield new LintProblem(
					token.startMark.line,
					1,
					"missing document end \"...\"",
				);
			} else {
				context.inDocument = true;
			}
		}
	} else {
		if (token.data.type === "doc-end") {
			yield new LintProblem(
				token.startMark.line,
				token.startMark.column,
				"found forbidden document end \"...\"",
			);
		}
	}
}
