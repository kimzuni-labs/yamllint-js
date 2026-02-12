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
 * Use this rule to prevent multiple entries with the same key in mappings.
 *
 * .. rubric:: Options
 *
 * * Use ``forbid-duplicated-merge-keys`` to forbid the usage of
 *   multiple merge keys ``<<``.
 *
 * .. rubric:: Default values (when enabled)
 *
 * .. code-block:: yaml
 *
 *  rules:
 *    key-duplicates:
 *      forbid-duplicated-merge-keys: false
 *
 * .. rubric:: Examples
 *
 * #. With ``key-duplicates: {}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     - key 1: v
 *       key 2: val
 *       key 3: value
 *     - {a: 1, b: 2, c: 3}
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     - key 1: v
 *       key 2: val
 *       key 1: value
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     - {a: 1, b: 2, b: 3}
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     duplicated key: 1
 *     "duplicated key": 2
 *
 *     other duplication: 1
 *     ? >-
 *         other
 *         duplication
 *     : 2
 *
 * #. With ``key-duplicates: {forbid-duplicated-merge-keys: true}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     anchor_one: &anchor_one
 *       one: one
 *     anchor_two: &anchor_two
 *       two: two
 *     anchor_reference:
 *       <<: [*anchor_one, *anchor_two]
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     anchor_one: &anchor_one
 *       one: one
 *     anchor_two: &anchor_two
 *       two: two
 *     anchor_reference:
 *       <<: *anchor_one
 *       <<: *anchor_two
 */

import z from "zod";

import { LintProblem } from "../linter";

import type { TokenCheckProps } from "./types";



export const ID = "key-duplicates";
export const TYPE = "token";
export const CONF = z.object({
	"forbid-duplicated-merge-keys": z.boolean(),
});
export const DEFAULT: Conf = {
	"forbid-duplicated-merge-keys": false,
};

export type Conf = z.infer<typeof CONF>;

export interface Context {
	stack?: Parent[];
}



const parentType = [0, 1] as const;
const [MAP, SEQ] = parentType;

class Parent {
	keys: string[] = [];

	constructor(
		readonly type: typeof parentType[number],
	) {}
}



export function* check({ conf, token, context }: TokenCheckProps<Conf, Context>) {
	context.stack ??= [];

	if (
		token.data.type === "block-map"
		|| token.data.type === "flow-map-start"
	) context.stack.push(new Parent(MAP));

	else if (
		token.data.type === "block-seq"
		|| token.data.type === "flow-seq-start"
	) context.stack.push(new Parent(SEQ));

	else if (
		token.isBlockEnd
		|| token.data.type === "flow-map-end"
		|| token.data.type === "flow-seq-end"
	) context.stack.pop();

	else if (
		token.isKey
		&& token.resolve
	) {
		/*
		 * This check is done because KeyTokens can be found inside flow
		 * sequences... strange, but allowed.
		 */
		const value = token.resolve.value;
		const length = context.stack.length;
		const lastItem = context.stack[length - 1];
		if (length > 0 && lastItem.type === MAP) {
			if (
				lastItem.keys.includes(value)

				// `<<` is "merge key", see http://yaml.org/type/merge.html
				&& (
					value !== "<<"
					|| conf["forbid-duplicated-merge-keys"]
				)
			) {
				yield new LintProblem(
					token.startMark.line,
					token.startMark.column,
					`duplication of key "${value}" in mapping`,
				);
			} else {
				lastItem.keys.push(value);
			}
		}
	}
}
