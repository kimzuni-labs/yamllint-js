/*!
 * Copyright (C) 2018 ClearScore
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
 * Use this rule to forbid any string values that are not quoted, or to prevent
 * quoted strings without needing it. You can also enforce the type of the quote
 * used.
 *
 * .. rubric:: Options
 *
 * * ``quote-type`` defines allowed quotes: ``single``, ``double``, ``consistent``
 *   or ``any`` (default).
 * * ``required`` defines whether using quotes in string values is required
 *   (``true``, default) or not (``false``), or only allowed when really needed
 *   (``only-when-needed``).
 * * ``extra-required`` is a list of PCRE regexes to force string values to be
 *   quoted, if they match any regex. This option can only be used with
 *   ``required: false`` and  ``required: only-when-needed``.
 * * ``extra-allowed`` is a list of PCRE regexes to allow quoted string values,
 *   even if ``required: only-when-needed`` is set.
 * * ``allow-quoted-quotes`` allows (``true``) using disallowed quotes for strings
 *   with allowed quotes inside. Default ``false``.
 * * ``check-keys`` defines whether to apply the rules to keys in mappings. By
 *   default, ``quoted-strings`` rules apply only to values. Set this option to
 *   ``true`` to apply the rules to keys as well.
 *
 * **Note**: Multi-line strings (with ``|`` or ``>``) will not be checked.
 *
 * .. rubric:: Default values (when enabled)
 *
 * .. code-block:: yaml
 *
 *  rules:
 *    quoted-strings:
 *      quote-type: any
 *      required: true
 *      extra-required: []
 *      extra-allowed: []
 *      allow-quoted-quotes: false
 *      check-keys: false
 *
 * .. rubric:: Examples
 *
 * #. With ``quoted-strings: {quote-type: any, required: true}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     foo: "bar"
 *     bar: 'foo'
 *     number: 123
 *     boolean: true
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     foo: bar
 *
 * #. With ``quoted-strings: {quote-type: single, required: only-when-needed}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     foo: bar
 *     bar: foo
 *     not_number: '123'
 *     not_boolean: 'true'
 *     not_comment: '# comment'
 *     not_list: '[1, 2, 3]'
 *     not_map: '{a: 1, b: 2}'
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     foo: 'bar'
 *
 * #. With ``quoted-strings: {required: false, extra-required: [^http://,
 *    ^ftp://]}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     - localhost
 *     - "localhost"
 *     - "http://localhost"
 *     - "ftp://localhost"
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     - http://localhost
 *     - ftp://localhost
 *
 * #. With ``quoted-strings: {required: only-when-needed, extra-allowed:
 *    [^http://, ^ftp://], extra-required: [QUOTED]}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     - localhost
 *     - "http://localhost"
 *     - "ftp://localhost"
 *     - "this is a string that needs to be QUOTED"
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     - "localhost"
 *     - this is a string that needs to be QUOTED
 *
 * #. With ``quoted-strings: {quote-type: double, allow-quoted-quotes: false}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     foo: "bar\\"baz"
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     foo: 'bar"baz'
 *
 * #. With ``quoted-strings: {quote-type: double, allow-quoted-quotes: true}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     foo: 'bar"baz'
 *
 * #. With ``quoted-strings: {quote-type: consistent}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     foo: 'bar'
 *     baz: 'quux'
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     foo: 'bar'
 *     baz: "quux"
 *
 * #. With ``quoted-strings: {required: only-when-needed, check-keys: true,
 *    extra-required: ["[:]"]}``
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     foo:bar: baz
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     "foo:bar": baz
 */

import assert from "node:assert";
import z from "zod";
import yaml from "yaml";

import { YAML_OPTIONS } from "../constants";
import { LintProblem } from "../linter";
import { tokenGenerator } from "../parser";

import type { TokenCheckProps } from "./types";
import { toRegExps } from "./common";



export const ID = "quoted-strings";
export const TYPE = "token";
export const CONF = z.object({
	"quote-type": z.enum(["any", "single", "double", "consistent"]),
	required: z.union([z.boolean(), z.literal("only-when-needed")]),
	"extra-required": z.string().array(),
	"extra-allowed": z.string().array(),
	"allow-quoted-quotes": z.boolean(),
	"check-keys": z.boolean(),
});
export const DEFAULT: Conf = {
	"quote-type": "any",
	required: true,
	"extra-required": [],
	"extra-allowed": [],
	"allow-quoted-quotes": false,
	"check-keys": false,
};

export type Conf = z.infer<typeof CONF>;

export interface Context {
	tokenStyle?: Quote;
	flowNestCount?: number;
	regex?: {
		extraRequired: RegExp[];
		extraAllowed: RegExp[];
	};
}

export function VALIDATE(conf: Conf) {
	if (
		conf.required === true
		&& conf["extra-allowed"].length > 0
	) return "cannot use both \"required: true\" and \"extra-allowed\"";

	if (
		conf.required === true
		&& conf["extra-required"].length > 0
	) return "cannot use both \"required: true\" and \"extra-required\"";

	if (
		conf.required === false
		&& conf["extra-allowed"].length > 0
	) return "cannot use both \"required: false\" and \"extra-allowed\"";
}



type Quote = "\"" | "'";
type Props = TokenCheckProps<Conf, Context>;

// https://yaml.org/spec/1.2.2/#character-set
// eslint-disable-next-line no-control-regex
const NON_PRINTABLE = /[^\x09\x0A\x0D\x20-\x7E\x85\xA0-\uD7FF\uE000-\uFFFD]/;

const ZERONUMBER = /^0([0-9])/;
const ZEROoNUMBER = /^0o([0-7])/;



function quoteMatch({
	quoteType,
	tokenStyle,
	context,
}: {
	quoteType: Conf["quote-type"];
	tokenStyle?: Quote;
	context: Context;
}) {
	if (quoteType === "consistent" && tokenStyle !== undefined) {
		/*
		 * The canonical token style in a document is assumed to be the first
		 * one found for the purpose of 'consistent'
		 */
		context.tokenStyle ??= tokenStyle;
		return context.tokenStyle === tokenStyle;
	}

	return (
		quoteType === "any"
		|| (quoteType === "single" && tokenStyle === "'")
		|| (quoteType === "double" && tokenStyle === "\"")
	);
}

function quotesAreNeeded(token: Props["token"], isInsideAFlow: boolean) {
	// Quotes needed on strings containing flow tokens

	assert(token.resolve);

	const set = new Set(token.resolve.value);
	if (isInsideAFlow) {
		for (const char of [",", "[", "]", "{", "}"]) {
			if (set.has(char)) return true;
		}
	}

	if (token.resolve.type === "QUOTE_DOUBLE") {
		const isTrue = (
			NON_PRINTABLE.test(token.resolve.value)
			|| hasBackslashOnAtLeastOneLineEnding(token)
		);
		if (isTrue) return true;
	}

	const loader = tokenGenerator(`key: ${token.resolve.value}`);

	/*
	 * Remove the 4 first tokens corresponding to 'key: ' (document,
	 * block-map, scalar(key), map-value-ind)
	 */
	for (let i = 0; i < 4; i++) loader.next();
	const scalar = loader.next().value;

	if (
		scalar?.resolve?.type === "PLAIN"
		&& scalar.isBlockEnd
		&& scalar.resolve.value === token.resolve.value
	) return false;

	return true;
}

function hasQuotedQuotes(token: Props["token"]) {
	return (
		token.resolve
		&& token.resolve.type !== "PLAIN"
		&& (
			(token.resolve.type === "QUOTE_SINGLE" && token.resolve.value.includes("\""))
			|| (token.resolve.type === "QUOTE_DOUBLE" && token.resolve.value.includes("'"))
		)
	);
}

function hasBackslashOnAtLeastOneLineEnding(token: Props["token"]) {
	if (token.startMark.line === token.endMark.line) {
		return false;
	}
	const buffer = token.buffer.slice(token.startMark.pointer + 1, token.endMark.pointer - 1);
	return buffer.includes("\\\n") || buffer.includes("\\\r\n");
}



export function* check({ conf, token, context }: Props) {
	context.flowNestCount ??= 0;
	context.regex ??= {
		extraRequired: toRegExps(conf["extra-required"]),
		extraAllowed: toRegExps(conf["extra-allowed"]),
	};

	if (token.data.type === "flow-map-start" || token.data.type === "flow-seq-start") {
		context.flowNestCount++;
	} else if (token.data.type === "flow-map-end" || token.data.type === "flow-seq-end") {
		context.flowNestCount--;
	}

	if (
		!(
			token.resolve
			&& (
				token.prev?.data.type === "comma"
				|| token.prev?.data.type === "flow-seq-start"
				|| token.prev?.data.type === "tag"
				|| token.isValue
				|| token.isKey
			)
		)
	) return;
	const tokenValue = token.resolve.value;

	const node = token.isKey ? "key" : "value";
	if (node === "key" && !conf["check-keys"]) return;

	// Ignore explicit types, e.g. !!str testtest or !!int 42
	if (token.prev?.data.type === "tag" && token.prev.data.source.startsWith("!!")) return;

	// Ignore numbers, booleans, etc.
	let parsed;
	try {
		parsed = yaml.parse(`key: ${tokenValue.replace(ZERONUMBER, "0o$1").replace(ZEROoNUMBER, "0$1")}`, YAML_OPTIONS) as unknown;
	} catch {
		/*
		 * @example
		 *
		 * ```
		 * key: "- item"
		 * ```
		 */
		parsed = { key: "string" };
	}
	const isString = (
		!!parsed
		&& typeof parsed === "object"
		&& ("key" in parsed)
		&& typeof parsed.key === "string"
	);
	if (
		token.resolve.type === "PLAIN"
		&& !isString
	) return;

	// Ignore multi-line strings
	if (token.resolve.type === "BLOCK_FOLDED" || token.resolve.type === "BLOCK_LITERAL") return;



	const quoteType = conf["quote-type"];
	const tokenStyle = token.resolve.type === "QUOTE_DOUBLE" ? "\"" : token.resolve.type === "QUOTE_SINGLE" ? "'" : undefined;

	let msg;
	let isExtraRequired: boolean;
	let isExtraAllowed: boolean;
	if (conf.required === true) {
		// Quotes are mandatory and need to match config
		if (
			token.resolve.type === "PLAIN"
			|| !(
				quoteMatch({ quoteType, tokenStyle, context })
				|| (conf["allow-quoted-quotes"] && hasQuotedQuotes(token))
			)
		) msg = `string ${node} is not quoted with ${quoteType} quotes`;
	} else if (conf.required === false) {
		// Quotes are not mandatory but when used need to match config
		if (
			token.resolve.type !== "PLAIN"
			&& !quoteMatch({ quoteType, tokenStyle, context })
			&& !(conf["allow-quoted-quotes"] && hasQuotedQuotes(token))
		) msg = `string ${node} is not quoted with ${quoteType} quotes`;

		else if (token.resolve.type === "PLAIN") {
			isExtraRequired = context.regex.extraRequired.some(r => r.test(tokenValue));
			if (isExtraRequired) {
				msg = `string ${node} is not quoted`;
			}
		}
	} else {
		// Quotes are not strictly needed here
		if (
			token.resolve.type !== "PLAIN"
			&& isString
			&& tokenValue
			&& !quotesAreNeeded(token, context.flowNestCount > 0)
		) {
			isExtraRequired = context.regex.extraRequired.some(r => r.test(tokenValue));
			isExtraAllowed = context.regex.extraAllowed.some(r => r.test(tokenValue));
			if (
				!(
					isExtraRequired
					|| isExtraAllowed
				)
			) msg = `string ${node} is redundantly quoted with ${quoteType} quotes`;

		// But when used need to match config
		} else if (
			token.resolve.type !== "PLAIN"
			&& !quoteMatch({ quoteType, tokenStyle, context })
			&& !(conf["allow-quoted-quotes"] && hasQuotedQuotes(token))
		) msg = `string ${node} is not quoted with ${quoteType} quotes`;

		else if (token.resolve.type === "PLAIN") {
			isExtraRequired = (
				!!context.regex.extraRequired.length
				&& context.regex.extraRequired.some(r => r.test(tokenValue))
			);
			if (isExtraRequired) {
				msg = `string ${node} is not quoted`;
			}
		}
	}

	if (msg) {
		yield new LintProblem(
			token.startMark.line,
			token.startMark.column,
			msg,
		);
	}
}
