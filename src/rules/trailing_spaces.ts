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
 * Use this rule to forbid trailing spaces at the end of lines.
 *
 * .. rubric:: Examples
 *
 * #. With ``trailing-spaces: {}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     this document doesn't contain
 *     any trailing
 *     spaces
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     this document contains     """ """
 *     trailing spaces
 *     on lines 1 and 3         """ """
 *
 * // noqa: ISC001
 */

import { LintProblem } from "../linter";

import type { LineCheckProps } from "./types";



export const ID = "trailing-spaces";
export const TYPE = "line";



const SPACE_END_OF_LINE = /^\s$/;

export function* check({ line }: LineCheckProps) {
	if (line.end === 0) return;

	/*
	 * YAML recognizes two white space characters: space and tab.
	 * http://yaml.org/spec/1.2/spec.html#id2775170
	 */

	let pos = line.end;
	while (
		SPACE_END_OF_LINE.test(line.buffer[pos - 1])
		&& pos > line.start
	) pos--;

	if (pos !== line.end && [" ", "\t"].includes(line.buffer[pos])) {
		yield new LintProblem(
			line.lineNo,
			pos - line.start + 1,
			"trailing spaces",
		);
	}
}
