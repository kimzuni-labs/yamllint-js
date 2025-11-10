/*
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

import type z from "zod";
import type { Ignore } from "ignore";

import type { G, Level } from "../types";
import type { LintProblem } from "../linter";



export interface BaseRule {
	ID: string;
	CONF?: z.ZodObject<Record<string, z.ZodType>>;
	DEFAULT?: Record<string, unknown>;
	VALIDATE?: (conf: Record<string, unknown>) => string;
}

export interface LineRule extends BaseRule {
	TYPE: "line";
	check: () => G<LintProblem>;
}

export interface TokenRule extends BaseRule {
	TYPE: "token";
	check: () => G<LintProblem>;
}

export interface CommentRule extends BaseRule {
	TYPE: "comment";
	check: () => G<LintProblem>;
}

export type Rule = LineRule | TokenRule | CommentRule;



export interface RuleObjectBaseValue {
	level: Exclude<Level, null>;
	ignore?: Ignore;
	"ignore-from-file"?: Ignore;
}

export type RuleObjectValue<
	T extends Record<string, unknown> | undefined = undefined,
> =
	T extends undefined
		? RuleObjectBaseValue
		: RuleObjectBaseValue & T;

export type RuleValue<
	T extends Record<string, unknown> | undefined = undefined,
> =
	| false
	| RuleObjectValue<T>;
