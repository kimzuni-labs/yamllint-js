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
 * Use this rule to set a maximal number of allowed consecutive blank lines.
 *
 * .. rubric:: Options
 *
 * * ``max`` defines the maximal number of empty lines allowed in the document.
 * * ``max-start`` defines the maximal number of empty lines allowed at the
 *   beginning of the file. This option takes precedence over ``max``.
 * * ``max-end`` defines the maximal number of empty lines allowed at the end of
 *   the file.  This option takes precedence over ``max``.
 *
 * .. rubric:: Default values (when enabled)
 *
 * .. code-block:: yaml
 *
 *  rules:
 *    empty-lines:
 *      max: 2
 *      max-start: 0
 *      max-end: 0
 *
 * .. rubric:: Examples
 *
 * #. With ``empty-lines: {max: 1}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     - foo:
 *         - 1
 *         - 2
 *
 *     - bar: [3, 4]
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     - foo:
 *         - 1
 *         - 2
 *
 *
 *     - bar: [3, 4]
 */

import z from "zod";

import { LintProblem } from "../linter";

import type { LineCheckProps } from "./types";



export const ID = "empty-lines";
export const TYPE = "line";
export const CONF = z.object({
	max: z.int(),
	"max-start": z.int(),
	"max-end": z.int(),
});
export const DEFAULT: Conf = {
	max: 2,
	"max-start": 0,
	"max-end": 0,
};

export type Conf = z.infer<typeof CONF>;



export function* check({ conf, line }: LineCheckProps<Conf>) {
	if (
		line.start === line.end
		&& line.end < line.buffer.length
	) {
		// Only alert on the last blank line of a series
		if (
			line.end + 2 <= line.buffer.length
			&& line.buffer.slice(line.end, line.end + 2) === "\n\n"
		) return;
		else if (
			line.end + 4 <= line.buffer.length
			&& line.buffer.slice(line.end, line.end + 4) === "\r\n\r\n"
		) return;

		let blankLines = 0;
		let start = line.start;
		while (start >= 2 && line.buffer.slice(start - 2, start) === "\r\n") {
			blankLines++;
			start -= 2;
		}
		while (start >= 1 && line.buffer[start - 1] === "\n") {
			blankLines++;
			start--;
		}

		let { max } = conf;

		// Special case: start of document
		if (start === 0) {
			// first line doesn't have a preceding \n
			blankLines++;
			max = conf["max-start"];
		}

		/*
		 * Special case: end of document
		 * NOTE: The last line of a file is always supposed to end with a new
		 * line. See POSIX definition of a line at:
		 */
		if (
			(
				line.end === line.buffer.length - 1
				&& line.buffer[line.end] === "\n"
			)
			|| (
				line.end === line.buffer.length - 2
				&& line.buffer.slice(line.end, line.end + 2) === "\r\n"
			)
		) {
			// Allow the exception of the one-byte file containing '\n'
			if (line.end === 0) return;
			max = conf["max-end"];
		}

		if (blankLines > max) {
			yield new LintProblem(
				line.lineNo,
				1,
				`too many blank lines (${blankLines} > ${max})`,
			);
		}
	}
}
