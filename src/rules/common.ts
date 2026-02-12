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

import recheck from "recheck";

import type { Token } from "../parser";
import { LintProblem } from "../linter";



export interface spacesOptions {
	min?: number;
	max?: number;
	minDesc?: string;
	maxDesc?: string;
}

export function spacesAfter(
	token: Token,
	{
		min = -1,
		max = -1,
		minDesc,
		maxDesc,
	}: spacesOptions = {},
) {
	if (token.endMark.line === token.next?.startMark.line) {
		/*
		 * In cases where `block-map` follows `explicit-key-ind`,
		 * the value of `pointer` is inaccurate.
		 *
		 * ```yaml
		 * ---
		 * ? kk:  # 2,4 to 2,2
		 *     ee:
		 *       yy
		 * ```
		 */
		const next = (
			token.data.type === "explicit-key-ind"
			&& token.next.data.type === "block-map"
			&& token.next.next?.data.type === "scalar"
				? token.next.next
				: token.next
		);

		const spaces = next.startMark.pointer - token.endMark.pointer;
		if (max !== -1 && spaces > max) {
			return new LintProblem(
				token.startMark.line,
				next.startMark.column - 1,
				maxDesc,
			);
		} else if (min !== -1 && spaces < min) {
			return new LintProblem(
				token.startMark.line,
				next.startMark.column,
				minDesc,
			);
		}
	}
}

export function spacesBefore(
	token: Token,
	{
		min = -1,
		max = -1,
		minDesc,
		maxDesc,
	}: spacesOptions = {},
) {
	if (
		token.prev?.endMark.line === token.startMark.line

		// Discard tokens (only scalars?) that end at the start of next line
		&& (
			token.prev.endMark.pointer === 0
			|| token.prev.buffer[token.prev.endMark.pointer - 1] !== "\n"
		)
	) {
		const spaces = token.startMark.pointer - token.prev.endMark.pointer;
		if (max !== -1 && spaces > max) {
			return new LintProblem(
				token.startMark.line,
				token.startMark.column - 1,
				maxDesc,
			);
		} else if (min !== -1 && spaces < min) {
			return new LintProblem(
				token.startMark.line,
				token.startMark.column,
				minDesc,
			);
		}
	}
}



/**
 * Finds the indent of the line the pointer in.
 */
export function getLineIndent(buffer: string, pointer: number) {
	const start = buffer.lastIndexOf("\n", pointer) + 1;
	let content = start;
	while (buffer[content] === " ") {
		content++;
	}
	return content - start;
}



export function toRegExp(string: string) {
	/*
	 * Rejects known-dangerous patterns via {@link recheck}.
	 * Not a complete guarantee (uses JS RegExp engine).
	 */
	const check = recheck.checkSync(string, "");
	if (check.status !== "safe") {
		throw new Error(`The provided string is unsafe RegExp pattern: ${string}`);
	}
	return new RegExp(string);
}

export const toRegExps = (() => {
	const warnedPatterns = new Set<string>();
	return function toRegExps(strings: string[]) {
		const arr = [];
		for (const string of strings) {
			try {
				arr.push(toRegExp(string));
			} catch {
				if (!warnedPatterns.has(string)) {
					console.warn(`Ignoring unsafe RegExp pattern: ${string}`);
					warnedPatterns.add(string);
				}
			}
		}
		return arr;
	};
})();
