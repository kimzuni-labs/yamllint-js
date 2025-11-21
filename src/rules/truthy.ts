/*
 * Copyright (C) 2016 Peter Ericson
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
 * Use this rule to forbid non-explicitly typed truthy values other than allowed
 * ones (by default: ``true`` and ``false``), for example ``YES`` or ``off``.
 *
 * This can be useful to prevent surprises from YAML parsers transforming
 * ``[yes, FALSE, Off]`` into ``[true, false, false]`` or
 * ``{y: 1, yes: 2, on: 3, true: 4, True: 5}`` into ``{y: 1, true: 5}``.
 *
 * Depending on the YAML specification version used by the YAML document, the list
 * of truthy values can differ. In YAML 1.2, only capitalized / uppercased
 * combinations of ``true`` and ``false`` are considered truthy, whereas in YAML
 * 1.1 combinations of ``yes``, ``no``, ``on`` and ``off`` are too. To make the
 * YAML specification version explicit in a YAML document, a ``%YAML 1.2``
 * directive can be used (see example below).
 *
 * .. rubric:: Options
 *
 * * ``allowed-values`` defines the list of truthy values which will be ignored
 *   during linting. The default is ``['true', 'false']``, but can be changed to
 *   any list containing: ``'TRUE'``, ``'True'``,  ``'true'``, ``'FALSE'``,
 *   ``'False'``, ``'false'``, ``'YES'``, ``'Yes'``, ``'yes'``, ``'NO'``,
 *   ``'No'``, ``'no'``, ``'ON'``, ``'On'``, ``'on'``, ``'OFF'``, ``'Off'``,
 *   ``'off'``.
 * * ``check-keys`` disables verification for keys in mappings. By default,
 *   ``truthy`` rule applies to both keys and values. Set this option to ``false``
 *   to prevent this.
 *
 * .. rubric:: Default values (when enabled)
 *
 * .. code-block:: yaml
 *
 *  rules:
 *    truthy:
 *      allowed-values: ['true', 'false']
 *      check-keys: true
 *
 * .. rubric:: Examples
 *
 * #. With ``truthy: {}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     boolean: true
 *
 *     object: {"True": 1, 1: "True"}
 *
 *     "yes":  1
 *     "on":   2
 *     "True": 3
 *
 *      explicit:
 *        string1: !!str True
 *        string2: !!str yes
 *        string3: !!str off
 *        encoded: !!binary |
 *                   True
 *                   OFF
 *                   pad==  # this decodes as 'N\xbb\x9e8Qii'
 *        boolean1: !!bool true
 *        boolean2: !!bool "false"
 *        boolean3: !!bool FALSE
 *        boolean4: !!bool True
 *        boolean5: !!bool off
 *        boolean6: !!bool NO
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     object: {True: 1, 1: True}
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     %YAML 1.1
 *     ---
 *     yes:  1
 *     on:   2
 *     True: 3
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     %YAML 1.2
 *     ---
 *     yes:  1
 *     on:   2
 *     true: 3
 *
 * #. With ``truthy: {allowed-values: ["yes", "no"]}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     - yes
 *     - no
 *     - "true"
 *     - 'false'
 *     - foo
 *     - bar
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     - true
 *     - false
 *     - on
 *     - off
 *
 * #. With ``truthy: {check-keys: false}``
 *
 *    the following code snippet would **PASS**:
 *    ::
 *
 *     yes:  1
 *     on:   2
 *     true: 3
 *
 *    the following code snippet would **FAIL**:
 *    ::
 *
 *     yes:  Yes
 *     on:   On
 *     true: True
 */

import z from "zod";

import { LintProblem } from "../linter";

import type { TokenCheckProps } from "./types";



const YES = ["YES", "Yes", "yes"] as const;
const NO = ["NO", "No", "no"] as const;
const TRUE = ["TRUE", "True", "true"] as const;
const FALSE = ["FALSE", "False", "false"] as const;
const ON = ["ON", "On", "on"] as const;
const OFF = ["OFF", "Off", "off"] as const;

const TRUTHY_1_1 = [...TRUE, ...FALSE, ...YES, ...NO, ...ON, ...OFF] as const;
const TRUTHY_1_2 = [...TRUE, ...FALSE] as const;



export const ID = "truthy";
export const TYPE = "token";
export const CONF = z.object({
	"allowed-values": z.enum([...TRUTHY_1_1, ...TRUTHY_1_2]).array(),
	"check-keys": z.boolean(),
});
export const DEFAULT: Conf = {
	"allowed-values": ["true", "false"],
	"check-keys": true,
};

export type Conf = z.infer<typeof CONF>;

interface Context {
	yamlSpecVersion?: string;
	badTruthyValues?: Set<string>;
}


const SPACE = /\s/;

function yamlSpecVersionForDocument({ yamlSpecVersion }: Context) {
	if (yamlSpecVersion !== undefined) {
		return yamlSpecVersion;
	}
	return "1.1";
}

export function* check({ conf, token, context }: TokenCheckProps<Conf, Context>) {
	if (token.data.type === "directive" && token.data.source.startsWith("%YAML")) {
		context.yamlSpecVersion = token.data.source.split(SPACE)[1];
	} else if (token.data.type === "doc-end") {
		delete context.yamlSpecVersion;
		delete context.badTruthyValues;
	}

	if (token.prev?.data.type === "tag") return;

	if (
		!conf["check-keys"]
		&& token.isKey
	) return;

	if (token.resolve?.type === "PLAIN") {
		if (context.badTruthyValues === undefined) {
			context.badTruthyValues = new Set(yamlSpecVersionForDocument(context) === "1.2" ? TRUTHY_1_2 : TRUTHY_1_1);
			for (const x of conf["allowed-values"]) {
				context.badTruthyValues.delete(x);
			}
		}
		if (context.badTruthyValues.has(token.resolve.value)) {
			yield new LintProblem(
				token.startMark.line,
				token.startMark.column,
				`truthy value should be one of [${[...conf["allowed-values"]].sort((a, b) => a.localeCompare(b)).join(", ")}]`,
			);
		}
	}
}
