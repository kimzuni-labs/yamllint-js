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
 * Use this rule to control the position and formatting of comments.
 *
 * .. rubric:: Options
 *
 * * Use ``require-starting-space`` to require a space character right after the
 *   ``#``. Set to ``true`` to enable, ``false`` to disable.
 * * Use ``ignore-shebangs`` to ignore a
 *   `shebang <https://en.wikipedia.org/wiki/Shebang_(Unix)>`_ at the beginning of
 *   the file when ``require-starting-space`` is set.
 * * ``min-spaces-from-content`` is used to visually separate inline comments from
 *   content. It defines the minimal required number of spaces between a comment
 *   and its preceding content.
 *
 * .. rubric:: Default values (when enabled)
 *
 * .. code-block:: yaml
 *
 *  rules:
 *    comments:
 *      require-starting-space: true
 *      ignore-shebangs: true
 *      min-spaces-from-content: 2
 *
 * .. rubric:: Examples
 *
 * #. With ``comments: {require-starting-space: true}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     # This sentence
 *     # is a block comment
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     ##############################
 *     ## This is some documentation
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     #This sentence
 *     #is a block comment
 *
 * #. With ``comments: {min-spaces-from-content: 2}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     x = 2 ^ 127 - 1  # Mersenne prime number
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     x = 2 ^ 127 - 1 # Mersenne prime number
 */

import z from "zod";

import { LintProblem } from "../linter";

import type { CommentCheckProps } from "./types";



export const ID = "comments";
export const TYPE = "comment";
export const CONF = z.object({
	"require-starting-space": z.boolean(),
	"ignore-shebangs": z.boolean(),
	"min-spaces-from-content": z.int(),
});
export const DEFAULT: Conf = {
	"require-starting-space": true,
	"ignore-shebangs": true,
	"min-spaces-from-content": 2,
};

export type Conf = z.infer<typeof CONF>;



export function* check({ conf, comment }: CommentCheckProps<Conf>) {
	if (
		conf["min-spaces-from-content"] !== -1
		&& comment.isInline()
		&& comment.tokenBefore
		&& comment.pointer - comment.tokenBefore.endMark.pointer < conf["min-spaces-from-content"]
	) {
		yield new LintProblem(
			comment.lineNo,
			comment.columnNo,
			`too few spaces before comment: expected ${conf["min-spaces-from-content"]}`,
		);
	}

	if (conf["require-starting-space"]) {
		let textStart = comment.pointer + 1;
		while (comment.buffer[textStart] === "#") textStart++;

		if (textStart < comment.buffer.length) {
			if (
				conf["ignore-shebangs"]
				&& comment.lineNo === 1
				&& comment.columnNo === 1
				&& comment.buffer[textStart] === "!"
			) return;

			else if (![" ", "\n", "\r", "\x00"].includes(comment.buffer[textStart])) {
				/*
				 * We can test for both \r and \r\n just by checking first char
				 * \r itself is a valid newline on some older OS.
				 */

				yield new LintProblem(
					comment.lineNo,
					comment.columnNo + textStart - comment.pointer,
					"missing starting space in comment",
				);
			}
		}
	}
}
