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

import assert from "node:assert";
import { Readable } from "node:stream";
import util from "node:util";
import yaml from "yaml";

import type { Level, RuleId } from "./types";
import type { YamlLintConfig } from "./config";
import { YAML_OPTIONS } from "./constants";
import * as decoder from "./decoder";
import * as parser from "./parser";



/*
 * These patterns match upstream yamllint Python implementation
 * See:
 * - https://github.com/adrienverge/yamllint/blob/73b9c0b54270076e2c76e2e6bfd428aa4203ed3a/yamllint/linter.py#L32-L33
 * - https://github.com/adrienverge/yamllint/blob/73b9c0b54270076e2c76e2e6bfd428aa4203ed3a/yamllint/linter.py#L114
 * - https://github.com/adrienverge/yamllint/blob/73b9c0b54270076e2c76e2e6bfd428aa4203ed3a/yamllint/linter.py#L194
 */

const RULE_PREFIX = "rule:";
const DISABLE_PREFIX = "# yamllint disable";
const ENABLE_PREFIX = "# yamllint enable";
const DISABLE_LINE_PREFIX = "# yamllint disable-line";
const PATTERN_SUFFIX = `( ${RULE_PREFIX}\\S+)*\\s*$`;

const DISABLE_FILE_PATTERN = /^#\s*yamllint disable-file\s*$/;
const DISABLE_RULE_PATTERN = new RegExp(`^${DISABLE_PREFIX}${PATTERN_SUFFIX}`);
const ENABLE_RULE_PATTERN = new RegExp(`^${ENABLE_PREFIX}${PATTERN_SUFFIX}`);
const DISABLE_LINE_RULE_PATTERN = new RegExp(`^${DISABLE_LINE_PREFIX}${PATTERN_SUFFIX}`);



/**
 * Represents a linting problem found by yamllint.
 */
export class LintProblem {
	/**
	 * @param line Line on which the problem was found (starting at 1)
	 * @param column Column on which the problem was found (starting at 1)
	 * @param desc Human-readable description of the problem
	 * @param rule Identifier of the rule that detected the problem
	 * @param level Problem strict level name
	 */
	constructor(
		readonly line: number,
		readonly column: number,
		readonly desc = "<no description>",
		public rule?: string,
		public level: Exclude<Level, null> = "error",
	) {}

	get message() {
		if (this.rule) {
			return `${this.desc} (${this.rule})`;
		}
		return this.desc;
	}

	eq(other: unknown): other is LintProblem {
		return (
			other instanceof LintProblem
			&& this.line === other.line
			&& this.column === other.column
			&& this.rule === other.rule
		);
	}

	lt(other: unknown): other is LintProblem {
		return (
			other instanceof LintProblem
			&& (
				this.line < other.line
				|| (
					this.line === other.line
					&& this.column < other.column
				)
			)
		);
	}

	[util.inspect.custom]() {
		return `${this.line}:${this.column}: ${this.message}`;
	}
}



export function* getCosmeticProblems(buffer: string, conf: YamlLintConfig, filepath?: string) {
	const rules = conf.enabledRules(filepath);

	// Split token rules from line rules
	const tokenRules = [];
	const commentRules = [];
	const lineRules = [];
	for (const rule of rules) {
		if (rule.TYPE === "token") tokenRules.push(rule);
		if (rule.TYPE === "comment") commentRules.push(rule);
		if (rule.TYPE === "line") lineRules.push(rule);
	}

	const context: Record<string, object> = {};
	for (const rule of tokenRules) {
		context[rule.ID] = {};
	}

	const parseRules = (prefix: string, comment: string) => comment
		.slice(prefix.length)
		.trimEnd()
		.split(" ")
		.map(x => x.trim().slice(RULE_PREFIX.length))
		.slice(1);


	class DisableDirective {
		rules = new Set<string>();
		allRules = new Set(rules.map(x => x.ID));

		processComment(comment: string) {
			if (DISABLE_RULE_PATTERN.test(comment)) {
				const rules = parseRules(DISABLE_PREFIX, comment);
				if (rules.length === 0) {
					this.rules = new Set(this.allRules);
				} else {
					for (const id of rules) {
						this.rules.add(id);
					}
				}
			} else if (ENABLE_RULE_PATTERN.test(comment)) {
				const rules = parseRules(ENABLE_PREFIX, comment);
				if (rules.length === 0) {
					this.rules.clear();
				} else {
					for (const id of rules) {
						this.rules.delete(id);
					}
				}
			}
		}

		isDisabledByDirective(problem: LintProblem) {
			return problem.rule && this.rules.has(problem.rule);
		}
	}

	class DisableLineDirective extends DisableDirective {
		processComment(comment: string) {
			if (DISABLE_LINE_RULE_PATTERN.test(comment)) {
				const rules = parseRules(DISABLE_LINE_PREFIX, comment);
				if (rules.length === 0) {
					this.rules = new Set(this.allRules);
				} else {
					for (const id of rules) {
						this.rules.add(id);
					}
				}
			}
		}
	}

	/*
	 * Use a cache to store problems and flush it only when an end of line is
	 * found. This allows the use of yamllint directive to disable some rules on
	 * some lines.
	 */
	let cache: LintProblem[] = [];
	const disabled = new DisableDirective();
	let disabledForLine = new DisableLineDirective();
	let disabledForNextLine = new DisableLineDirective();

	for (const elem of parser.tokenOrCommentOrLineGenerator(buffer)) {
		const isLine = elem instanceof parser.Line;
		const targetRules = isLine ? lineRules : elem instanceof parser.Comment ? commentRules : tokenRules;
		for (const rule of targetRules) {
			const ruleConf = conf.rules[rule.ID as RuleId];
			assert(ruleConf);

			// @ts-expect-error: ts(2345)
			const problems = rule.check({
				fullConf: conf,
				conf: ruleConf,
				[rule.TYPE]: elem,
				context: context[rule.ID],
			});
			for (const problem of problems) {
				problem.rule = rule.ID;
				problem.level = ruleConf.level;
				cache.push(problem);
			}
		}

		if (elem instanceof parser.Comment) {
			disabled.processComment(elem.toString());
			if (elem.isInline()) {
				disabledForLine.processComment(elem.toString());
			} else {
				disabledForNextLine.processComment(elem.toString());
			}
		} else if (isLine) {
			/*
			 * This is the last token/comment/line of this line, let's flush the
			 * problems found (but filter them according to the directives)
			 */
			for (const problem of cache) {
				if (!(
					disabledForLine.isDisabledByDirective(problem)
					|| disabled.isDisabledByDirective(problem)
				)) yield problem;
			}

			disabledForLine = disabledForNextLine;
			disabledForNextLine = new DisableLineDirective();
			cache = [];
		}
	}
}



export function* getSyntaxErrors(buffer: string) {
	const docs = yaml.parseAllDocuments(buffer, YAML_OPTIONS);
	for (const doc of docs) {
		for (const e of doc.errors) {
			let msg = e.message;
			let end = e.message.indexOf(" at line");
			if (end === -1) end = e.message.indexOf("\n");
			if (end === -1) end = e.message.indexOf("\0");
			if (end !== -1) msg = e.message.slice(0, end);

			const pos = e.linePos?.[0] ?? { line: 1, col: 1 };
			const p = new LintProblem(
				pos.line,
				pos.col,
				`syntax error: ${msg} (syntax)`,
				undefined,
				"error",
			);
			yield p;
		}
	}
}



function* _run(buffer: string | Buffer, conf: YamlLintConfig, filepath?: string) {
	if (typeof buffer !== "string") {
		buffer = decoder.autoDecode(buffer);
	}

	const firstLine = parser.lineGenerator(buffer).next().value?.content ?? "";
	if (DISABLE_FILE_PATTERN.test(firstLine)) {
		return;
	}

	/*
	 * If the document contains a syntax error, save it and yield it at the
	 * right line
	 */
	const syntaxErrors = getSyntaxErrors(buffer);
	const problems = getCosmeticProblems(buffer, conf, filepath);

	let syntaxError = syntaxErrors.next().value;
	let problem = problems.next().value;

	while (syntaxError || problem) {
		// Insert the syntax error (if any) at the right place...
		if (
			syntaxError
			&& (
				!problem
				|| (
					syntaxError.line < problem.line
					|| (
						syntaxError.line === problem.line
						&& syntaxError.column <= problem.column
					)
				)
			)
		) {
			yield syntaxError;

			/*
			 * Discard the problem since it is at the same place as the syntax
			 * error and is probably redundant (and maybe it's just a 'warning',
			 * in which case the script won't even exit with a failure status).
			 */
			syntaxError = syntaxErrors.next().value;
		} else if (problem) {
			yield problem;
			problem = problems.next().value;
		}
	}
}



/**
 * Lints a YAML source.
 *
 * Returns a generator of LintProblem objects.
 *
 * @param input buffer, string or stream to read from
 * @param conf yamllint configuration object
 */
export async function* run(input: string | Buffer | Readable, conf: YamlLintConfig, filepath?: string) {
	if (filepath !== undefined && conf.isFileIgnored(filepath)) {
		return;
	}

	let buffer;
	if (typeof input === "string" || Buffer.isBuffer(input)) {
		buffer = input;
	} else if (input instanceof Readable) {
		const chunks: Buffer[] = [];
		for await (const chunk of input) {
			const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk) as Buffer;
			chunks.push(buf);
		}
		buffer = Buffer.concat(chunks);
	} else {
		throw new TypeError("input should be a string or a stream");
	}

	yield* _run(buffer, conf, filepath);
}
