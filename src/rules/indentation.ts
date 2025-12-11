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
 * Use this rule to control the indentation.
 *
 * .. rubric:: Options
 *
 * * ``spaces`` defines the indentation width, in spaces. Set either to an integer
 *   (e.g. ``2`` or ``4``, representing the number of spaces in an indentation
 *   level) or to ``consistent`` to allow any number, as long as it remains the
 *   same within the file.
 * * ``indent-sequences`` defines whether block sequences should be indented or
 *   not (when in a mapping, this indentation is not mandatory -- some people
 *   perceive the ``-`` as part of the indentation). Possible values: ``true``,
 *   ``false``, ``whatever`` and ``consistent``. ``consistent`` requires either
 *   all block sequences to be indented, or none to be. ``whatever`` means either
 *   indenting or not indenting individual block sequences is OK.
 * * ``check-multi-line-strings`` defines whether to lint indentation in
 *   multi-line strings. Set to ``true`` to enable, ``false`` to disable.
 *
 * .. rubric:: Default values (when enabled)
 *
 * .. code-block:: yaml
 *
 *  rules:
 *    indentation:
 *      spaces: consistent
 *      indent-sequences: true
 *      check-multi-line-strings: false
 *
 * .. rubric:: Examples
 *
 * #. With ``indentation: {spaces: 1}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     history:
 *      - name: Unix
 *        date: 1969
 *      - name: Linux
 *        date: 1991
 *     nest:
 *      recurse:
 *       - haystack:
 *          needle
 *
 * #. With ``indentation: {spaces: 4}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     history:
 *         - name: Unix
 *           date: 1969
 *         - name: Linux
 *           date: 1991
 *     nest:
 *         recurse:
 *             - haystack:
 *                   needle
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     history:
 *       - name: Unix
 *         date: 1969
 *       - name: Linux
 *         date: 1991
 *     nest:
 *       recurse:
 *         - haystack:
 *             needle
 *
 * #. With ``indentation: {spaces: consistent}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     history:
 *        - name: Unix
 *          date: 1969
 *        - name: Linux
 *          date: 1991
 *     nest:
 *        recurse:
 *           - haystack:
 *                needle
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     some:
 *       Russian:
 *           dolls
 *
 * #. With ``indentation: {spaces: 2, indent-sequences: false}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     list:
 *     - flying
 *     - spaghetti
 *     - monster
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     list:
 *       - flying
 *       - spaghetti
 *       - monster
 *
 * #. With ``indentation: {spaces: 2, indent-sequences: whatever}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     list:
 *     - flying:
 *       - spaghetti
 *       - monster
 *     - not flying:
 *         - spaghetti
 *         - sauce
 *
 * #. With ``indentation: {spaces: 2, indent-sequences: consistent}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     - flying:
 *       - spaghetti
 *       - monster
 *     - not flying:
 *       - spaghetti
 *       - sauce
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     - flying:
 *         - spaghetti
 *         - monster
 *     - not flying:
 *       - spaghetti
 *       - sauce
 *
 * #. With ``indentation: {spaces: 4, check-multi-line-strings: true}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     Blaise Pascal:
 *         Je vous écris une longue lettre parce que
 *         je n'ai pas le temps d'en écrire une courte.
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     Blaise Pascal: Je vous écris une longue lettre parce que
 *                    je n'ai pas le temps d'en écrire une courte.
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     Blaise Pascal: Je vous écris une longue lettre parce que
 *       je n'ai pas le temps d'en écrire une courte.
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     C code:
 *         void main() {
 *             printf("foo");
 *         }
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     C code:
 *         void main() {
 *         printf("bar");
 *         }
 */

import util from "node:util";
import assert from "node:assert";
import z from "zod";

import type { Token } from "../parser";
import { LintProblem } from "../linter";

import type { TokenCheckProps } from "./types";



export const ID = "indentation";
export const TYPE = "token";
export const CONF = z.object({
	spaces: z.union([z.int(), z.literal("consistent")]),
	"indent-sequences": z.union([z.boolean(), z.literal("whatever"), z.literal("consistent")]),
	"check-multi-line-strings": z.boolean(),
});
export const DEFAULT: Conf = {
	spaces: "consistent",
	"indent-sequences": true,
	"check-multi-line-strings": false,
};

export type Conf = z.infer<typeof CONF>;

export interface Context {
	stack?: Parent[];
	curLine?: number;
	curLineIndent?: number;
	spaces?: Conf["spaces"];
	indentSequences?: Conf["indent-sequences"];
}



type Props = TokenCheckProps<Conf, Context>;

type ParentType = typeof PARENT_TYPES[number];
const PARENT_TYPES = [0, 1, 2, 3, 4, 5, 6, 7] as const;
const [ROOT, B_MAP, F_MAP, B_SEQ, F_SEQ, B_ENT, KEY, VAL] = PARENT_TYPES;
const labels = ["ROOT", "B_MAP", "F_MAP", "B_SEQ", "F_SEQ", "B_ENT", "KEY", "VAL"] as const;

export type { Parent };
class Parent {
	constructor(
		readonly token: Token,
		readonly type: ParentType,
		readonly indent: number,
		readonly lineIndent: number,
		readonly explicitKey = false,
	) {}

	[util.inspect.custom]() {
		return `${labels[this.type]}:${this.indent}`;
	}
}



const getLastItem = <
	N extends number = 1,
>(
	context: Required<Context>,
	lastIndex: N = 1 as N,
): N extends 1 ? Parent : Parent | undefined => {
	return context.stack[context.stack.length - lastIndex];
};



function* checkScalarIndentation({
	token,
	context,
}: {
	token: Props["token"];
	context: Required<Context>;
}) {
	assert(token.resolve);

	if (token.startMark.line === token.endMark.line) return;

	const lastItem = getLastItem(context, 1);
	const lastSecondItem = getLastItem(context, 2);

	const computeExpectedIndent = (foundIndent: number) => {
		const detectIndent = (baseIndent: number) => {
			if (typeof context.spaces !== "number") {
				context.spaces = foundIndent - baseIndent;
			}
			return baseIndent + context.spaces;
		};

		if (token.data.type === "scalar") {
			return token.startMark.column - 1;
		} else if (token.data.type.includes("quoted")) {
			return token.startMark.column;
		} else {
			assert(token.data.type === "block-scalar");

			switch (lastItem.type) {
				case B_ENT:
					/*
					 * ```yaml
					 * - >
					 *     multi
					 *     line
					 * ```
					 */
					return detectIndent(token.startMark.column - 1);
				case KEY:
					assert(lastItem.explicitKey);

					/*
					 * ```yaml
					 * - ? >
					 *       multi-line
					 *       key
					 *   : >
					 *       multi-line
					 *       value
					 * ```
					 */
					return detectIndent(token.startMark.column - 1);
				case VAL:
					if (token.startMark.line > context.curLine) {
						/*
						 * ```yaml
						 * - key:
						 *     >
						 *       multi
						 *       line
						 * ```
						 */
						return detectIndent(lastItem.indent);
					} else if (lastSecondItem?.explicitKey) {
						/*
						 * ```yaml
						 * - ? key
						 *   : >
						 *       multi-line
						 *       value
						 * ```
						 */
						return detectIndent(token.startMark.column - 1);
					} else {
						assert(lastSecondItem);

						/*
						 * ```yaml
						 * - key: >
						 *     multi
						 *     line
						 * ```
						 */
						return detectIndent(lastSecondItem.indent);
					}
				default:
					return detectIndent(lastItem.indent);
			}
		}
	};

	let expectedIndent: number | undefined;
	let lineNo = token.startMark.line;
	let lineStart = token.startMark.pointer;
	const source = token.buffer.slice(0, token.endMark.pointer - 1);

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	while (true) {
		lineStart = source.indexOf("\n", lineStart) + 1;
		if (lineStart === 0) break;
		lineNo++;

		let indent = 0;
		while (token.buffer[lineStart + indent] === " ") {
			indent++;
		}
		if (token.buffer[lineStart + indent] === "\n") {
			continue;
		}

		expectedIndent ??= computeExpectedIndent(indent);
		if (indent !== expectedIndent) {
			yield new LintProblem(
				lineNo,
				indent + 1,
				`wrong indentation: expected ${expectedIndent} but found ${indent}`,
			);
		}
	}
}



function* _check({ conf, token, context }: Props) {
	function initContext(context: Context): asserts context is Required<Context> {
		if (!context.stack) {
			context.stack = [new Parent(token, ROOT, 0, 0)];
			context.curLine = -1;
			context.spaces = conf.spaces;
			context.indentSequences = conf["indent-sequences"];
		}
	}
	initContext(context);

	let next = token.next;
	let foundIndentation: number | undefined;

	const push = (
		type: ParentType,
		indent: number,
		explicitKey?: boolean,
	) => {
		context.stack.push(new Parent(
			token,
			type,
			indent,
			context.curLineIndent,
			explicitKey,
		));
	};

	const isKey = (token?: Token | null) => (
		!!token
		&& token.isKey
			? (token.prev?.data.type !== "anchor" && token.prev?.data.type !== "tag" && token.prev?.data.type !== "explicit-key-ind")
			: token?.next?.isKey && (token.data.type === "anchor" || token.data.type === "tag" || token.data.type === "explicit-key-ind")
	);



	// Step 1: Lint

	const lastItem = getLastItem(context);
	const isVisible = "indent" in token.data;
	const firstInLine = isVisible && token.startMark.line > context.curLine;

	const detectIndent = (baseIndent: number, next: Token) => {
		if (typeof context.spaces !== "number") {
			context.spaces = next.startMark.column - 1 - baseIndent;
		}
		return baseIndent + context.spaces;
	};

	if (firstInLine) {
		foundIndentation = (
			!token.resolve?.type?.startsWith("BLOCK")
			&& "indent" in token.data
				? token.data.indent
				: token.startMark.column - 1
		);
		let expected = lastItem.indent;

		if (["flow-map-end", "flow-seq-end"].includes(token.data.type)) {
			expected = lastItem.lineIndent;
		} else if (
			lastItem.type === KEY
			&& lastItem.explicitKey
			&& token.data.type !== "map-value-ind"
		) {
			expected = detectIndent(expected, token);
		}

		if (foundIndentation !== expected) {
			let message: string;
			if (expected < 0) {
				message = `wrong indentation: expected at least ${foundIndentation + 1}`;
			} else {
				message = `wrong indentation: expected ${expected} but found ${foundIndentation}`;
			}
			yield new LintProblem(token.startMark.line, foundIndentation + 1, message);
		}
	}

	if (token.resolve && conf["check-multi-line-strings"]) {
		yield* checkScalarIndentation({ token, context });
	}

	// Step 2.a:

	if (isVisible) {
		context.curLine = token.endMark.line;
		if (firstInLine) {
			assert(foundIndentation !== undefined);
			context.curLineIndent = foundIndentation;
		}
	}

	// Step 2.b: Update state

	if (token.data.type === "block-map") {
		/*
		 * ```yaml
		 *   - a: 1
		 * ```
		 *
		 * or
		 *
		 * ```yaml
		 *   - ? a
		 *     : 1
		 * ```
		 *
		 * or
		 *
		 * ```yaml
		 *   - ?
		 *       a
		 *     : 1
		 * ```
		 */
		assert((
			next?.isKey === true
			|| next?.data.type === "explicit-key-ind"
			|| next?.data.type === "anchor"
			|| next?.data.type === "tag"
		));
		assert(next.startMark.line === token.startMark.line);

		push(B_MAP, token.data.indent);
	} else if (token.data.type === "flow-map-start") {
		assert(next);

		let indent: number;
		if (next.startMark.line === token.startMark.line) {
			/*
			 * ```yaml
			 *   - {a: 1, b: 2}
			 * ```
			 */
			indent = next.startMark.column - 1;
		} else {
			/*
			 * ```yaml
			 *   - {
			 *     a: 1, b: 2
			 *   }
			 * ```
			 */
			indent = detectIndent(context.curLineIndent, next);
		}
		push(F_MAP, indent);
	} else if (token.data.type === "block-seq") {
		/*
		 * ```yaml
		 *    - - a
		 *      - b
		 * ```
		 */
		assert(next?.data.type === "seq-item-ind");
		assert(next.startMark.line === token.startMark.line);
		push(B_SEQ, token.data.indent);
	} else if (
		token.data.type === "seq-item-ind"

		// in case of an empty entry
		&& !(
			token.isBlockEnd
			|| next?.data.type === "seq-item-ind"
		)
	) {
		assert(next);

		let indent: number;
		if (next.startMark.line === token.endMark.line) {
			/*
			 * ```yaml
			 *   - item1
			 *   - item2
			 * ```
			 */
			indent = next.startMark.column - 1;
		} else if (next.startMark.column === token.startMark.column) {
			/*
			 * ```yaml
			 *   -
			 *   key: value
			 * ```
			 */
			indent = next.startMark.column - 1;
		} else {
			/*
			 * ```yaml
			 *   -
			 *     item 1
			 *   -
			 *     key:
			 *       value
			 * ```
			 */
			indent = detectIndent(token.data.indent, next);
		}
		push(B_ENT, indent);
	} else if (token.data.type === "flow-seq-start") {
		assert(next);

		let indent: number;
		if (next.startMark.line === token.startMark.line) {
			/*
			 * ```yaml
			 *   - [a, b]
			 * ```
			 */
			indent = next.startMark.column - 1;
		} else {
			/*
			 * ```yaml
			 *   - [
			 *     a, b
			 *   ]
			 * ```
			 */
			indent = detectIndent(context.curLineIndent, next);
		}
		push(F_SEQ, indent);
	} else if (isKey(token)) {
		push(KEY, lastItem.indent, token.data.type === "explicit-key-ind");
	} else if (token.data.type === "map-value-ind") {
		let indent: number;

		/*
		 * Special cases:
		 *
		 * ```yaml
		 *     key: &anchor
		 *       value
		 * ```
		 *
		 * and:
		 *
		 * ```yaml
		 *     key: !!tag
		 *       value
		 * ```
		 */
		if (next?.data.type === "anchor" || next?.data.type === "tag") {
			if (
				next.startMark.line === token.startMark.line
				&& next.next
				&& next.startMark.line < next.next.startMark.line
			) {
				next = next.next;
			}
		}

		// Only if value is not empty
		if (
			!token.isBlockEnd
			&& next?.data.type !== "flow-map-end"
			&& next?.data.type !== "flow-seq-end"
			&& !next?.isKey
		) {
			assert(next);

			if (lastItem.explicitKey) {
				/*
				 * ```yaml
				 *   ? k
				 *   : value
				 * ```
				 *
				 * or
				 *
				 * ```yaml
				 *   ? k
				 *   :
				 *     value
				 * ```
				 */
				indent = detectIndent(lastItem.indent, next);
			} else if (next.startMark.line === token.prev?.startMark.line) {
				/*
				 * ```yaml
				 *   k: value
				 * ```
				 */
				indent = next.startMark.column - 1;
			} else if (next.data.type === "block-seq" || next.data.type === "seq-item-ind") {
				/*
				 * NOTE: We add BlockEntryToken in the test above because
				 * sometimes BlockSequenceStartToken are not issued. Try
				 * yaml.scan()ning this:
				 *
				 * ```yaml
				 *     '- lib:\n'
				 *     '  - var\n'
				 * ```
				 */
				if (context.indentSequences === false) {
					indent = lastItem.indent;
				} else if (context.indentSequences === true) {
					if (context.spaces === "consistent" && next.startMark.column - 1 - lastItem.indent === 0) {
						/*
						 * In this case, the block sequence item is not indented
						 * (while it should be), but we don't know yet the
						 * indentation it should have (because `spaces` is
						 * `consistent` and its value has not been computed yet
						 * -- this is probably the beginning of the document).
						 * So we choose an unknown value (-1).
						 */
						indent = -1;
					} else {
						indent = detectIndent(lastItem.indent, next);
					}
				} else {
					// 'whatever' or 'consistent'
					if (next.startMark.column - 1 === lastItem.indent) {
						/*
						 * ```yaml
						 *   key:
						 *   - e1
						 *   - e2
						 * ```
						 */
						if (context.indentSequences === "consistent") {
							context.indentSequences = false;
						}
						indent = lastItem.indent;
					} else {
						if (context.indentSequences === "consistent") {
							context.indentSequences = true;
						}

						/*
						 * ```yaml
						 *   key:
						 *     - e1
						 *     - e2
						 * ```
						 */
						indent = detectIndent(lastItem.indent, next);
					}
				}
			} else {
				/*
				 * ```yaml
				 *   k:
				 *     value
				 * ```
				 */
				indent = detectIndent(lastItem.indent, next);
			}

			push(VAL, indent);
		}
	}

	next = token.next;
	let consumedCurrentToken = false;
	while (1 < context.stack.length) {
		const lastItem = getLastItem(context);
		const lastSecondItem = getLastItem(context, 2);

		if (token.data.type === "flow-collection") {
			break;
		} else if (
			lastItem.type === F_SEQ
			&& token.data.type === "flow-seq-end"
			&& !consumedCurrentToken
		) {
			context.stack.pop();
			consumedCurrentToken = true;
		} else if (
			lastItem.type === F_MAP
			&& token.data.type === "flow-map-end"
			&& !consumedCurrentToken
		) {
			context.stack.pop();
			consumedCurrentToken = true;
		} else if (
			(lastItem.type === B_MAP || lastItem.type === B_SEQ)
			&& token.isBlockEnd
			&& next
			&& lastItem.indent > (
				"indent" in next.data
					? next.data.indent
					: next.startMark.column - 1
			)
		) {
			context.stack.pop();
		} else if (
			lastItem.type === B_ENT
			&& token.data.type !== "seq-item-ind"
			&& token.data.type !== "anchor"
			&& token.data.type !== "tag"
			&& next?.data.type !== "seq-item-ind"
		) {
			context.stack.pop();
			context.stack.pop();
		} else if (
			lastItem.type === B_ENT
			&& lastItem.token !== token
			&& (
				next?.data.type === "seq-item-ind"
				|| token.isBlockEnd
			)
		) {
			context.stack.pop();
		} else if (
			lastItem.type === VAL
			&& lastItem.token !== token
			&& ![
				"anchor",
				"tag",
			].includes(token.data.type)
		) {
			assert(lastSecondItem?.type === KEY);
			context.stack.pop();
			context.stack.pop();
		} else if (
			lastItem.type === KEY
			&& (
				[
					"flow-map-end",
					"flow-seq-end",
					"explicit-key-ind",
				].includes(next?.data.type ?? "")
				|| isKey(next)
			)
		) {
			/*
			 * A key without a value: it's part of a set. Let's drop this key
			 * and leave room for the next one.
			 */
			context.stack.pop();
		} else {
			break;
		}
	}
}



export function* check(props: Props) {
	const { token } = props;

	try {
		yield* _check(props);
	} catch (e) {
		if (e instanceof assert.AssertionError) {
			yield new LintProblem(
				token.startMark.line,
				token.startMark.column,
				"cannot infer indentation: unexpected token",
			);
		} else {
			throw e;
		}
	}
}
