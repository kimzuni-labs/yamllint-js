/*!
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

import type yaml from "yaml";
import type z from "zod";

import type { G, ExtractToken } from "../types";
import type { YamlLintConfig } from "../config";
import type { Line, Token, Comment } from "../parser";
import type { LintProblem } from "../linter";

import type { RuleId, _rules } from "./";



export {
	RuleId,
};



export interface CommonCheckProps<Conf, Context = unknown> {
	fullConf: YamlLintConfig;
	conf: Conf;
	context: Context;
}

export interface LineCheckProps<Conf = unknown, Context = unknown> extends CommonCheckProps<Conf, Context> {
	line: Line;
}

export interface TokenCheckProps<Conf = unknown, Context = unknown> extends CommonCheckProps<Conf, Context> {
	token: ExtractToken<Exclude<yaml.CST.Token["type"], typeof Token.ignoreTypes[number]>>;
}

export interface CommentCheckProps<Conf = unknown, Context = unknown> extends CommonCheckProps<Conf, Context> {
	comment: Comment;
}



export interface BaseRule {
	ID: string;
	CONF?: z.ZodObject<Record<string, z.ZodType>>;
	DEFAULT?: Record<string, unknown>;
	VALIDATE?: (conf: Record<string, unknown>) => string;
}

export interface LineRule<Conf = unknown, Context = unknown> extends BaseRule {
	TYPE: "line";
	check: (props: LineCheckProps<Conf, Context>) => G<LintProblem>;
}

export interface TokenRule<Conf = unknown, Context = unknown> extends BaseRule {
	TYPE: "token";
	check: (props: TokenCheckProps<Conf, Context>) => G<LintProblem>;
}

export interface CommentRule<Conf = unknown, Context = unknown> extends BaseRule {
	TYPE: "comment";
	check: (props: CommentCheckProps<Conf, Context>) => G<LintProblem>;
}

export type Rule = LineRule | TokenRule | CommentRule;



export type RuleConf<ID extends RuleId = RuleId> =
	typeof _rules[ID] extends { CONF: unknown }
		? z.infer<typeof _rules[ID]["CONF"]>

		// eslint-disable-next-line @typescript-eslint/no-empty-object-type
		: {};
