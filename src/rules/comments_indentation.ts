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
 * Use this rule to force comments to be indented like content.
 *
 * .. rubric:: Examples
 *
 * #. With ``comments-indentation: {}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     # Fibonacci
 *     [0, 1, 1, 2, 3, 5]
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *       # Fibonacci
 *     [0, 1, 1, 2, 3, 5]
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     list:
 *         - 2
 *         - 3
 *         # - 4
 *         - 5
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     list:
 *         - 2
 *         - 3
 *     #    - 4
 *         - 5
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     # This is the first object
 *     obj1:
 *       - item A
 *       # - item B
 *     # This is the second object
 *     obj2: []
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     # This sentence
 *     # is a block comment
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     # This sentence
 *      # is a block comment
 */

import { LintProblem } from "../linter";

import type { CommentCheckProps } from "./types";
import { getLineIndent } from "./common";



export const ID = "comments-indentation";
export const TYPE = "comment";



export function* check({ comment }: CommentCheckProps) {
	// Only check block comments
	if (comment.isInline()) return;

	const nextLineIndent = (comment.tokenAfter?.startMark.column ?? 1) - 1;
	let prevLineIndent: number;
	if (!comment.tokenBefore || comment.tokenBefore.endMark.pointer === 0) {
		prevLineIndent = 0;
	} else {
		prevLineIndent = getLineIndent(comment.buffer, comment.pointer - comment.columnNo - 1);
	}

	/*
	 * In the following case only the next line indent is valid:
	 *
	 * ```yaml
	 *     list:
	 *         # comment
	 *         - 1
	 *         - 2
	 * ```
	 */
	prevLineIndent = Math.max(prevLineIndent, nextLineIndent);

	/*
	 * If two indents are valid but a previous comment went back to normal
	 * indent, for the next ones to do the same. In other words, avoid this:
	 *
	 * ```yaml
	 *     list:
	 *         - 1
	 *     # comment on valid indent (0)
	 *         # comment on valid indent (4)
	 *     other-list:
	 *         - 2
	 * ```
	 */
	if (comment.commentBefore?.isInline() === false) {
		prevLineIndent = comment.commentBefore.columnNo - 1;
	}

	if (
		comment.columnNo - 1 !== prevLineIndent
		&& comment.columnNo - 1 !== nextLineIndent
	) {
		yield new LintProblem(
			comment.lineNo,
			comment.columnNo,
			"comment not indented like content",
		);
	}
}
