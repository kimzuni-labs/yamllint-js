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

import assert from "node:assert";
import yaml from "yaml";

import type { G, Mark, ParentTokenData, TokenData, ScalarAdditionalData } from "./types";



export class Line {
	constructor(
		readonly lineNo: number,
		readonly buffer: string,
		readonly start: number,
		readonly end: number,
	) {}

	get content() {
		return this.buffer.slice(this.start, this.end);
	}
}



/**
 * Chainable Token Class
 *
 * Represents a token that can be navigated via `prev`, `next`, and `parent` links.
 * Tokens are generated lazily using a generator, so `next` may not always be immediately available.
 * However, at least `token.next.next` is guaranteed to be loaded.
 *
 * - If `next` is `undefined`, it has not been generated yet.
 * - If `next` is `null`, it does not exist.
 *
 * @example
 *
 * ```typescript
 * token.data
 * token.prev?.prev?.data
 * token.next?.next?.data
 * token.parent?.parent?.data
 * ```
 */
export class Token<T extends TokenData | ParentTokenData = TokenData> {
	static ignoreTypes = [
		"newline",
		"comment",
		"space",
		"block-scalar-header",
	] satisfies Array<yaml.CST.Token["type"]>;

	prev: Token | null;
	next?: Token | null;
	parent?: Token<ParentTokenData> | null;
	isKey?: boolean;
	isValue?: boolean;

	/**
	 * only scalar type
	 */
	resolve: ReturnType<typeof yaml.CST.resolveAsScalar>;

	constructor(
		readonly depth: number,
		readonly lineNo: number,
		readonly buffer: string,
		readonly data: T,
		readonly startMark: Mark,
		readonly endMark: Mark,
		x?: ScalarAdditionalData & {
			prev: Token | null;
			next?: Token | null;
			parent: Token<ParentTokenData> | null;
		},
	) {
		this.prev = x?.prev ?? null;
		this.next = x?.next;
		this.parent = x?.parent ?? null;
		this.isKey = x?.isKey;
		this.isValue = x?.isValue;

		try {
			this.resolve = yaml.CST.resolveAsScalar(this.data);
		} catch {
			this.resolve = null;
		}
	}

	get isBlockEnd() {
		if (this.next === undefined) {
			throw new Error("Cannot determine isBlockEnd: next token not yet linked");
		}
		if (!this.parent) return false;
		if (this.next === null) return true;
		if (this.endMark.line === this.next.startMark.line) return false;

		let target: Token | null | undefined = this.next;
		while (target && target.depth > this.depth) {
			target = target.parent;
		}
		return this.parent !== target?.parent;
	}
}



export class Comment {
	constructor(
		readonly lineNo: number,
		readonly columnNo: number,
		readonly buffer: string,
		readonly pointer: number,
		readonly tokenBefore: Token | null = null,
		readonly tokenAfter: Token | null = null,
		readonly commentBefore: Comment | null = null,
	) {}

	toString() {
		let end = this.buffer.indexOf("\n", this.pointer);
		if (end === -1) {
			end = this.buffer.indexOf("\0", this.pointer);
		}
		if (end !== -1) {
			return this.buffer.slice(this.pointer, end);
		}
		return this.buffer.slice(this.pointer);
	}

	equals(other: unknown): other is Comment {
		return (
			other instanceof Comment
			&& this.lineNo === other.lineNo
			&& this.columnNo === other.columnNo
			&& this.toString() === other.toString()
		);
	}

	isInline() {
		const end = this.pointer;
		const start = end - this.columnNo + 1;
		return this.buffer.slice(start, end).trim() !== "";
	}
}



export function* lineGenerator(buffer: string): G<Line> {
	let lineNo = 1;
	let cur = 0;
	let next = buffer.indexOf("\n");
	while (next !== -1) {
		if (next > 0 && buffer[next - 1] === "\r") {
			yield new Line(lineNo, buffer, cur, next - 1);
		} else {
			yield new Line(lineNo, buffer, cur, next);
		}
		cur = next + 1;
		next = buffer.indexOf("\n", cur);
		lineNo++;
	}
	yield new Line(lineNo, buffer, cur, buffer.length);
}



/**
 * Find all comments between two tokens
 */
export function* commentsBetweenTokens(buffer: string, token1?: Token, token2?: Token): G<Comment> {
	let buf: string;
	if (!token2) {
		buf = token1?.buffer.slice(token1.endMark.pointer) ?? buffer;
	} else if (
		token1?.endMark.line === token2.startMark.line
		&& token1.endMark.pointer !== 0
		&& token2.startMark.pointer !== buffer.length
	) {
		return;
	} else {
		buf = buffer.slice(token1?.endMark.pointer ?? 0, token2.startMark.pointer);
	}

	let lineNo = token1?.endMark.line ?? 1;
	let columnNo = token1?.endMark.column ?? 1;
	let pointer = token1?.endMark.pointer ?? 0;

	let commentBefore: Comment | undefined;
	for (const line of buf.split("\n")) {
		const pos = line.indexOf("#");
		if (pos !== -1) {
			const comment: Comment = new Comment(
				lineNo,
				columnNo + pos,
				buffer,
				pointer + pos,
				token1 ?? null,
				token2 ?? null,
				commentBefore ?? null,
			);
			yield comment;
			commentBefore = comment;
		}

		pointer += line.length + 1;
		lineNo++;
		columnNo = 1;
	}
}



/**
 * Flattens the tree structure {@link yaml.CST.Token}
 * and connects it into a chainable {@link Token}, then returns it.
 */
export function* tokenGenerator(buffer: string): G<Token> {
	const lineCounter = new yaml.LineCounter();
	const parser = new yaml.Parser(lineCounter.addNewLine);
	const loader = parser.parse(buffer) as G<yaml.CST.Token>;

	/**
	 * {@link yaml.CST.Token} to {@link Token} class,
	 * link only `parent`
	 */
	const toToken = (
		depth: number,
		token: yaml.CST.Token,
		parent?: Token<ParentTokenData>,
		{
			isKey = false,
			isValue = false,
		}: ScalarAdditionalData = {},
	) => {
		const getMark = (offset: number): Mark => {
			const { line, col } = lineCounter.linePos(offset);
			return {
				line: line,
				column: col,
				pointer: offset,
			};
		};

		const startMark = getMark(token.offset);
		const endMark = "source" in token ? getMark(token.offset + token.source.length) : { ...startMark };
		const isData = { isKey, isValue };
		return new Token(
			depth,
			startMark.line,
			buffer,
			token,
			startMark,
			endMark,
			{
				...isData,
				prev: null,
				parent: parent ?? null,
			},
		);
	};

	function* flat(
		depth: number,
		token: yaml.CST.Token,
		parent?: Token<ParentTokenData>,
		data?: ScalarAdditionalData,
	): G<Token> {
		if (
			Token.ignoreTypes.includes(token.type as typeof Token.ignoreTypes[number])
			|| token.type.includes("error")
		) return;

		const newToken = toToken(depth, token, parent, data);
		yield newToken;
		const pToken = newToken as Token<ParentTokenData>;
		depth++;

		if ("start" in token) {
			const items = Array.isArray(token.start) ? token.start : [token.start];
			for (const start of items) {
				yield* flat(depth, start, pToken);
			}
		}

		if ("props" in token) {
			for (const prop of token.props) {
				yield* flat(depth, prop, pToken);
			}
		}

		if ("items" in token) {
			for (const item of token.items) {
				for (const start of item.start) {
					yield* flat(depth, start, pToken);
				}
				if (item.key) {
					yield* flat(depth, item.key, pToken, { isKey: !!item.sep?.length });
				}
				for (const sep of item.sep ?? []) {
					yield* flat(depth, sep, pToken);
				}
				if (item.value) {
					yield* flat(depth, item.value, pToken, { isValue: true });
				}
			}
		}

		if ("value" in token && token.value) {
			yield* flat(depth, token.value, pToken);
		}

		if ("end" in token) {
			for (const end of token.end ?? []) {
				yield* flat(depth, end, pToken);
			}
		}
	}

	function* run(): G<Token> {
		for (const token of loader) {
			yield* flat(0, token);
		}
	}

	const tokens = run();
	let curr = tokens.next().value;
	let next = tokens.next().value ?? null;
	while (curr && next) {
		curr.next = next;
		next.next = tokens.next().value ?? null;
		next.prev = curr;
		yield curr;
		curr = curr.next;
		next = next.next;
	}
	if (curr) {
		curr.next ??= null;
		yield curr;
	}
}



export function* tokenOrCommentGenerator(buffer: string): G<Token | Comment> {
	const gen = tokenGenerator(buffer);
	let prev: Token | undefined;
	for (const curr of gen) {
		yield* commentsBetweenTokens(buffer, prev, curr);
		yield curr;
		prev = curr;
	}
	yield* commentsBetweenTokens(buffer, prev);
}



/**
 * Generator that mixes tokens and lines, ordering them by line number
 */
export function* tokenOrCommentOrLineGenerator(buffer: string): G<Line | Token | Comment> {
	const tokOrComGen = tokenOrCommentGenerator(buffer);
	const lineGen = lineGenerator(buffer);

	let tokOrCom = tokOrComGen.next().value;
	let line = lineGen.next().value;

	while (tokOrCom || line) {
		if (!tokOrCom || (line && tokOrCom.lineNo > line.lineNo)) {
			assert(line);
			yield line;
			line = lineGen.next().value;
		} else {
			yield tokOrCom;
			tokOrCom = tokOrComGen.next().value;
		}
	}
}
