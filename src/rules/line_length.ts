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
 * Use this rule to set a limit to lines length.
 *
 * .. rubric:: Options
 *
 * * ``max`` defines the maximal (inclusive) length of lines.
 * * ``allow-non-breakable-words`` is used to allow non breakable words (without
 *   spaces inside) to overflow the limit. This is useful for long URLs, for
 *   instance. Use ``true`` to allow, ``false`` to forbid.
 * * ``allow-non-breakable-inline-mappings`` implies ``allow-non-breakable-words``
 *   and extends it to also allow non-breakable words in inline mappings.
 *
 * .. rubric:: Default values (when enabled)
 *
 * .. code-block:: yaml
 *
 *  rules:
 *    line-length:
 *      max: 80
 *      allow-non-breakable-words: true
 *      allow-non-breakable-inline-mappings: false
 *
 * .. rubric:: Examples
 *
 * #. With ``line-length: {max: 70}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     long sentence:
 *       Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
 *       eiusmod tempor incididunt ut labore et dolore magna aliqua.
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     long sentence:
 *       Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
 *       tempor incididunt ut labore et dolore magna aliqua.
 *
 * #. With ``line-length: {max: 60, allow-non-breakable-words: true}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     this:
 *       is:
 *         - a:
 *             http://localhost/very/very/very/very/very/very/very/very/long/url
 *
 *     # this comment is too long,
 *     # but hard to split:
 *     # http://localhost/another/very/very/very/very/very/very/very/very/long/url
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     - this line is waaaaaaaaaaaaaay too long but could be easily split...
 *
 *    and the following code snippet would also **FAIL**:
 *    ::
 *
 *     - foobar: http://localhost/very/very/very/very/very/very/very/very/long/url
 *
 * #. With ``line-length: {max: 60, allow-non-breakable-words: true,
 *    allow-non-breakable-inline-mappings: true}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     - foobar: http://localhost/very/very/very/very/very/very/very/very/long/url
 *
 * #. With ``line-length: {max: 60, allow-non-breakable-words: false}``
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     this:
 *       is:
 *         - a:
 *             http://localhost/very/very/very/very/very/very/very/very/long/url
 */

import z from "zod";
import yaml from "yaml";

import { tokenGenerator } from "../parser";
import { LintProblem } from "../linter";

import type { LineCheckProps } from "./types";



export const ID = "line-length";
export const TYPE = "line";
export const CONF = z.object({
	max: z.int(),
	"allow-non-breakable-words": z.boolean(),
	"allow-non-breakable-inline-mappings": z.boolean(),
});
export const DEFAULT: Conf = {
	max: 80,
	"allow-non-breakable-words": true,
	"allow-non-breakable-inline-mappings": false,
};

export type Conf = z.infer<typeof CONF>;



function checkInlineMapping(line: LineCheckProps["line"]): boolean {
	const content = line.content;
	const loader = tokenGenerator(content);
	try {
		let t1: ReturnType<typeof loader.next>["value"] | null = null;
		while ((t1 = loader.next().value ?? null) !== null) {
			if (t1.data.type === "block-map") {
				let t2: ReturnType<typeof loader.next>["value"] | null = null;
				while ((t2 = loader.next().value ?? null) !== null) {
					if (t2.data.type === "map-value-ind") {
						const token = loader.next().value;
						if (token?.resolve) {
							return !content.slice(token.startMark.column - 1).includes(" ");
						}
					}
				}
			}
		}
	} catch (e) {
		if (!(e instanceof yaml.YAMLError)) {
			throw e;
		}
	}
	return false;
}



export function* check({ conf, line }: LineCheckProps<Conf>) {
	const maxLength = conf.max;
	const length = line.end - line.start;
	if (length > maxLength) {
		if (conf["allow-non-breakable-words"]) {
			let start = line.start;
			while (
				start < line.end
				&& line.buffer[start] === " "
			) start++;

			if (start !== line.end) {
				if (line.buffer[start] === "#") {
					while (line.buffer[start] === "#") start++;
					start++;
				} else if (line.buffer[start] === "-") {
					start += 2;
				}

				if (!line.buffer.slice(start, line.end).includes(" ")) {
					return;
				}

				if (
					conf["allow-non-breakable-inline-mappings"]
					&& checkInlineMapping(line)
				) return;
			}
		}

		yield new LintProblem(
			line.lineNo,
			maxLength + 1,
			`line too long (${length} > ${maxLength} characters)`,
		);
	}
}
