/*!
 * Copyright (C) 2017 Johannes F. Knauf
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
 * Use this rule to enforce alphabetical ordering of keys in mappings. The sorting
 * order uses the Unicode code point number as a default. As a result, the
 * ordering is case-sensitive and not accent-friendly (see examples below).
 * This can be changed by setting the global ``locale`` option.  This allows one
 * to sort case and accents properly.
 *
 * .. rubric:: Options
 *
 * * ``ignored-keys`` is a list of PCRE regexes to ignore some keys while checking
 *   order, if they match any regex.
 *
 * .. rubric:: Default values (when enabled)
 *
 * .. code-block:: yaml
 *
 *  rules:
 *    key-ordering:
 *      ignored-keys: []
 *
 * .. rubric:: Examples
 *
 * #. With ``key-ordering: {}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     - key 1: v
 *       key 2: val
 *       key 3: value
 *     - {a: 1, b: 2, c: 3}
 *     - T-shirt: 1
 *       T-shirts: 2
 *       t-shirt: 3
 *       t-shirts: 4
 *     - hair: true
 *       hais: true
 *       haïr: true
 *       haïssable: true
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     - key 2: v
 *       key 1: val
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     - {b: 1, a: 2}
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     - T-shirt: 1
 *       t-shirt: 2
 *       T-shirts: 3
 *       t-shirts: 4
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     - haïr: true
 *       hais: true
 *
 * #. With global option ``locale: "en_US.UTF-8"`` and rule ``key-ordering: {}``
 *
 *    as opposed to before, the following code snippet would now **PASS**:
 *    ::
 *
 *     - t-shirt: 1
 *       T-shirt: 2
 *       t-shirts: 3
 *       T-shirts: 4
 *     - hair: true
 *       haïr: true
 *       hais: true
 *       haïssable: true
 *
 * #. With rule ``key-ordering: {ignored-keys: ["name"]}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     - a:
 *       b:
 *       name: ignored
 *       first-name: ignored
 *       c:
 *       d:
 */

import z from "zod";

import { LintProblem } from "../linter";

import type { TokenCheckProps } from "./types";
import { toRegExps } from "./common";



export const ID = "key-ordering";
export const TYPE = "token";
export const CONF = z.object({
	"ignored-keys": z.string().array(),
});
export const DEFAULT: Conf = {
	"ignored-keys": [],
};

export type Conf = z.infer<typeof CONF>;
export interface Context {
	stack?: Parent[];
	ignoredKeys?: RegExp[];
}



const parentType = [0, 1] as const;
const [MAP, SEQ] = parentType;

class Parent {
	keys: string[] = [];

	constructor(
		readonly type: typeof parentType[number],
	) {}
}



export function* check({ fullConf: { locale }, conf, token, context }: TokenCheckProps<Conf, Context>) {
	context.stack ??= [];
	context.ignoredKeys ??= toRegExps(conf["ignored-keys"]);

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
		const lastItem = context.stack.at(length - 1);
		const lastKey = lastItem?.keys.at(-1);
		if (
			length > 0
			&& lastItem?.type === MAP
			&& !context.ignoredKeys.some(r => r.test(value))
		) {
			if (
				lastKey
				&& lastKey !== value
				&& (
					(locale && value.localeCompare(lastKey, locale) < 0)
					|| (locale === undefined && lastKey > value)
				)
			) {
				yield new LintProblem(
					token.startMark.line,
					token.startMark.column,
					`wrong ordering of key "${value}" in mapping`,
				);
			} else {
				lastItem.keys.push(value);
			}
		}
	}
}
