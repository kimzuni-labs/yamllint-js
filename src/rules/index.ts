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

import z from "zod";

import type { Rule } from "../types";
import { LintProblem } from "../linter";



/**
 * fake rules for check
 */
export const _RULES = {
	braces: {
		ID: "braces",
		TYPE: "token",
		CONF: z.object({
			forbid: z.union([z.boolean(), z.literal("non-empty")]),
			"min-spaces-inside": z.int(),
			"max-spaces-inside": z.int(),
			"min-spaces-inside-empty": z.int(),
			"max-spaces-inside-empty": z.int(),
		}),
		DEFAULT: {
			forbid: false,
			"min-spaces-inside": 0,
			"max-spaces-inside": 0,
			"min-spaces-inside-empty": -1,
			"max-spaces-inside-empty": -1,
		},
		* check() {
			yield new LintProblem(1, 2, "xb");
		},
	} as Rule,
	colons: {
		ID: "colons",
		TYPE: "token",
		CONF: z.object({
			"max-spaces-before": z.int(),
			"max-spaces-after": z.int(),
		}),
		DEFAULT: {
			"max-spaces-before": 0,
			"max-spaces-after": 1,
		},
		* check() {
			yield new LintProblem(2, 3, "xc");
		},
	} as Rule,
	"empty-lines": {
		ID: "empty-lines",
		TYPE: "token",
		CONF: z.object({
			max: z.int(),
			"max-start": z.int(),
			"max-end": z.int(),
		}),
		DEFAULT: {
			max: 2,
			"max-start": 0,
			"max-end": 0,
		},
		* check() {
			yield new LintProblem(3, 4, "xe");
		},
	} as Rule,
	hyphens: {
		ID: "hyphens",
		TYPE: "token",
		CONF: z.object({
			"max-spaces-after": z.int(),
		}),
		DEFAULT: {
			"max-spaces-after": 1,
		},
		* check() {
			yield new LintProblem(4, 5, "xh");
		},
	} as Rule,
	indentation: {
		ID: "indentation",
		TYPE: "token",
		CONF: z.object({
			spaces: z.union([z.int(), z.literal("consistent")]),
			"indent-sequences": z.union([z.boolean(), z.literal("whatever"), z.literal("consistent")]),
			"check-multi-line-strings": z.boolean(),
		}),
		DEFAULT: {
			spaces: "consistent",
			"indent-sequences": true,
			"check-multi-line-strings": false,
		},
		* check() {
			yield new LintProblem(5, 6, "xi");
		},
	} as Rule,
	"key-duplicates": {
		ID: "key-duplicates",
		TYPE: "token",
		CONF: z.object({
			"forbid-duplicated-merge-keys": z.boolean(),
		}),
		DEFAULT: {
			"forbid-duplicated-merge-keys": false,
		},
		* check() {
			yield new LintProblem(6, 7, "xk");
		},
	} as Rule,
	"trailing-spaces": {
		ID: "trailing-spaces",
		TYPE: "token",
		* check() {
			yield new LintProblem(7, 3, "xt");
		},
	} as Rule,
} as Record<string, Rule | undefined>;



export function get(id: string) {
	const rule = _RULES[id];
	if (!rule) {
		throw new Error(`no such rule: "${id}"`);
	}

	return rule;
}
