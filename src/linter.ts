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

import util from "node:util";
import yaml from "yaml";

import type { Level } from "./types";
import { YAML_OPTIONS } from "./constants";



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



/**
 * Not yet implemented
 */
export function getCosmeticProblems() {
	throw new Error("Not yet implemented");
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



/**
 * Not yet implemented
 */
function _run() {
	throw new Error("Not yet implemented");
}



/**
 * Not yet implemented
 */
export function run() {
	throw new Error("Not yet implemented");
}
