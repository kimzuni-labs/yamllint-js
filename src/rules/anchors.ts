/*
 * Copyright (C) 2023 Adrien Vergé
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
 * Use this rule to report duplicated anchors and aliases referencing undeclared
 * anchors.
 *
 * .. rubric:: Options
 *
 * * Set ``forbid-undeclared-aliases`` to ``true`` to avoid aliases that reference
 *   an anchor that hasn't been declared (either not declared at all, or declared
 *   later in the document).
 * * Set ``forbid-duplicated-anchors`` to ``true`` to avoid duplications of a same
 *   anchor.
 * * Set ``forbid-unused-anchors`` to ``true`` to avoid anchors being declared but
 *   not used anywhere in the YAML document via alias.
 *
 * .. rubric:: Default values (when enabled)
 *
 * .. code-block:: yaml
 *
 *  rules:
 *    anchors:
 *      forbid-undeclared-aliases: true
 *      forbid-duplicated-anchors: false
 *      forbid-unused-anchors: false
 *
 * .. rubric:: Examples
 *
 * #. With ``anchors: {forbid-undeclared-aliases: true}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     ---
 *     - &anchor
 *       foo: bar
 *     - *anchor
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     ---
 *     - &anchor
 *       foo: bar
 *     - *unknown
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     ---
 *     - &anchor
 *       foo: bar
 *     - <<: *unknown
 *       extra: value
 *
 * #. With ``anchors: {forbid-duplicated-anchors: true}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     ---
 *     - &anchor1 Foo Bar
 *     - &anchor2 [item 1, item 2]
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     ---
 *     - &anchor Foo Bar
 *     - &anchor [item 1, item 2]
 *
 * #. With ``anchors: {forbid-unused-anchors: true}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     ---
 *     - &anchor
 *       foo: bar
 *     - *anchor
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     ---
 *     - &anchor
 *       foo: bar
 *     - items:
 *       - item1
 *       - item2
 */

import assert from "node:assert";
import z from "zod";

import type { Mark } from "../types";
import { LintProblem } from "../linter";

import type { TokenCheckProps } from "./types";



export const ID = "anchors";
export const TYPE = "token";
export const CONF = z.object({
	"forbid-undeclared-aliases": z.boolean(),
	"forbid-duplicated-anchors": z.boolean(),
	"forbid-unused-anchors": z.boolean(),
});
export const DEFAULT: Conf = {
	"forbid-undeclared-aliases": true,
	"forbid-duplicated-anchors": false,
	"forbid-unused-anchors": false,
};

export type Conf = z.infer<typeof CONF>;
export interface Context {
	anchors?: Record<
		string,
		| { used: true }
		| Pick<Mark, "line" | "column"> & { used: false }
		| undefined
	>;
}



export function* check({ conf, token, context }: TokenCheckProps<Conf, Context>) {
	const source = token.data.type === "anchor" || token.data.type === "alias" ? token.data.source.slice(1) : undefined;

	context.anchors ??= {};
	if (
		conf["forbid-undeclared-aliases"]
		|| conf["forbid-duplicated-anchors"]
		|| conf["forbid-unused-anchors"]
	) {
		if (
			token.data.type === "doc-start"
			|| token.data.type === "doc-end"
		) context.anchors = {};
	}

	if (
		conf["forbid-undeclared-aliases"]
		&& token.data.type === "alias"

		// syntax error
		&& !token.data.source.endsWith(":")

		// always true
		&& source
		&& !(source in context.anchors)
	) {
		yield new LintProblem(
			token.startMark.line,
			token.startMark.column,
			`found undeclared alias "${source}"`,
		);
	}

	if (
		conf["forbid-duplicated-anchors"]
		&& token.data.type === "anchor"

		// always true
		&& source
		&& source in context.anchors
	) {
		yield new LintProblem(
			token.startMark.line,
			token.startMark.column,
			`found duplicated anchor "${source}"`,
		);
	}

	if (conf["forbid-unused-anchors"]) {
		/*
		 * Unused anchors can only be detected at the end of Document.
		 * End of document can be either
		 *   - end of document sign '...'
		 *   - start of a new document sign '---'
		 * If next token indicates end of document,
		 * check if the anchors have been used or not.
		 * If they haven't been used, report problem on those anchors.
		 */
		if (
			token.next?.data.type === "doc-start"
			|| token.next?.data.type === "doc-end"
		) {
			for (const anchor in context.anchors) {
				const info = context.anchors[anchor];
				assert(info);
				if (!info.used) {
					yield new LintProblem(
						info.line,
						info.column,
						`found unused anchor "${anchor}"`,
					);
				}
			}
		} else if (token.data.type === "alias") {
			assert(source);

			context.anchors[source] = {
				...context.anchors[source],
				used: true,
			};
		}
	}

	if (
		conf["forbid-undeclared-aliases"]
		|| conf["forbid-duplicated-anchors"]
		|| conf["forbid-unused-anchors"]
	) {
		if (token.data.type === "anchor") {
			assert(source);
			context.anchors[source] = {
				line: token.startMark.line,
				column: token.startMark.column,
				used: false,
			};
		}
	}
}
