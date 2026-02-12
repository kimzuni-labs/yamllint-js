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

import { describe, test, expect } from "vitest";

import type { TokenData, ScalarAdditionalData } from "../src/types";
import {
	Line,
	Token,
	Comment,
	lineGenerator,
	tokenGenerator,
	tokenOrCommentGenerator,
	tokenOrCommentOrLineGenerator,
} from "../src/parser";



describe("Parser Test Case", () => {
	const getLines = (...strings: string[]) => Array.from(lineGenerator(strings.join("\n")));
	const lineChecker = (
		{ lineNo, start, end }: Line,
		...data: [lineNo: number, start: number, end: number]
	) => {
		expect([lineNo, start, end]).toStrictEqual(data);
	};

	test("line generator", () => {
		let e: Line[];

		e = getLines("");
		expect(e).toHaveLength(1);
		lineChecker(e[0], 1, 0, 0);

		e = getLines("\n");
		expect(e).toHaveLength(2);

		e = getLines(" \n");
		expect(e).toHaveLength(2);
		lineChecker(e[0], 1, 0, 1);

		e = getLines("\n\n");
		expect(e).toHaveLength(3);

		e = getLines(
			"---",
			"this is line 1",
			"line 2",
			"",
			"3",
		);
		expect(e).toHaveLength(5);
		expect(e[0].lineNo).toBe(1);
		expect(e[0].content).toBe("---");
		expect(e[2].content).toBe("line 2");
		expect(e[3].content).toBe("");

		e = getLines(
			"test with",
			"newline",
			"at the end",
			"",
		);
		expect(e).toHaveLength(4);
		expect(e[2].lineNo).toBe(3);
		expect(e[2].content).toBe("at the end");
		expect(e[3].lineNo).toBe(4);
	});



	test("chainable token class", () => {
		const source = [
			"---",
			"key1: val1",
			"# comment line",
			"key2:",
			"  key3: [item1, item2]",
			"  key4:",
			"    - item3  # inline comment",
			"    - item4",
			"key5: val5",
		];

		const e = Array.from(tokenGenerator(source.join("\n")));
		expect(e.some(x => ["newline", "comment", "space"].includes(x.data.type))).toBe(false);
		expect(e[0].parent).toBeNull();
		expect(e[5].prev?.prev?.prev?.prev?.prev?.prev).toBeNull();
		expect(e[5].prev?.prev?.prev?.prev?.prev).toBe(e[0]);
		expect(e[13].prev?.prev?.prev?.prev?.prev).toBe(e[8]);
		expect(e[13].next?.next?.next?.next?.next).toBe(e[18]);
		expect(e[18].parent?.parent?.parent?.parent).toBeNull();
		expect(e[e.length - 1].next).toBeNull();

		const t = tokenGenerator(source.join("\n"));
		for (let i = 0; i < 22; i++) t.next();
		const curr = t.next().value;
		expect(curr).toBeInstanceOf(Token);
		expect(curr?.parent?.parent?.parent).toBeInstanceOf(Token);
		expect(curr?.prev?.prev?.prev?.prev).toBeInstanceOf(Token);
		expect(curr?.next?.next).toBeInstanceOf(Token);
		expect(curr?.next?.next?.next).toBeUndefined();
		t.next(); expect(curr?.next?.next?.next).toBeInstanceOf(Token);
	});



	const getTokOrCom = (...strings: string[]) => Array.from(tokenOrCommentGenerator(strings.join("\n")));
	const commentChecker = (
		comment: Token | Comment,
		line: number,
		column: number,
		content: string,
	) => {
		expect.assert.ok(comment instanceof Comment);
		expect(comment.equals(new Comment(line, column, content, 0))).toBe(true);
	};

	test("token or comment generator", () => {
		let e: Array<Token | Comment>;

		e = getTokOrCom("a:b");
		expect(e).toHaveLength(2);
		expect.assert.ok(e[0] instanceof Token);
		expect(e[0].prev).toBeNull();
		expect(e[0].next).toBeInstanceOf(Token);
		expect.assert.ok(e[1] instanceof Token);
		expect(e[1].prev).toBe(e[0]);
		expect(e[1]).toBe(e[0].next);
		expect(e[1].next).toBeNull();

		e = getTokOrCom(
			"---",
			"k: v",
		);
		expect(e).toHaveLength(6);
		expect.assert.ok(e[3] instanceof Token);
		expect(e[3].isKey).toBe(true);
		expect(e[3].isValue).toBe(false);
		expect.assert.ok(e[5] instanceof Token);
		expect(e[5].isKey).toBe(false);
		expect(e[5].isValue).toBe(true);

		e = getTokOrCom(
			"# start comment",
			"- a",
			"- key: val  # key=val",
			"# this is",
			"# a block     ",
			"# comment",
			"- c",
			"# end comment",
		);
		expect(e).toHaveLength(17);
		commentChecker(e[0], 1, 1, "# start comment");
		commentChecker(e[10], 3, 13, "# key=val");
		commentChecker(e[11], 4, 1, "# this is");
		commentChecker(e[12], 5, 1, "# a block     ");
		commentChecker(e[13], 6, 1, "# comment");
		commentChecker(e[16], 8, 1, "# end comment");

		e = getTokOrCom(
			"---",
			"# no newline char",
		);
		commentChecker(e[2], 2, 1, "# no newline char");

		e = getTokOrCom(
			"# just comment",
		);
		commentChecker(e[0], 1, 1, "# just comment");

		e = getTokOrCom(
			"",
			"   # indented comment",
		);
		commentChecker(e[0], 2, 4, "# indented comment");

		e = getTokOrCom(
			"",
			"# trailing spaces    ",
		);
		commentChecker(e[0], 2, 1, "# trailing spaces    ");

		e = getTokOrCom(
			"# block",
			"# comment",
			"- data   # inline comment",
			"# block",
			"# comment",
			"- k: v   # inline comment",
			"- [ l, ist",
			"]   # inline comment",
			"- { m: ap",
			"}   # inline comment",
			"# block comment",
			"- data   # inline comment",
		);
		const c = e.filter(x => x instanceof Comment);
		expect(c).toHaveLength(10);
		expect(c[0].isInline()).toBe(false);
		expect(c[1].isInline()).toBe(false);
		expect(c[2].isInline()).toBe(true);
		expect(c[3].isInline()).toBe(false);
		expect(c[4].isInline()).toBe(false);
		expect(c[5].isInline()).toBe(true);
		expect(c[6].isInline()).toBe(true);
		expect(c[7].isInline()).toBe(true);
		expect(c[8].isInline()).toBe(false);
		expect(c[9].isInline()).toBe(true);
	});



	const getAll = (...strings: string[]) => Array.from(tokenOrCommentOrLineGenerator(strings.join("\n")));
	const tokenTypeChecker = (
		value: unknown,
		type: TokenData["type"],
		add: ScalarAdditionalData & { hasPrev?: boolean } = {},
	) => {
		expect(value).toBeInstanceOf(Token);
		const token = value as Token;
		expect(token.data.type).toBe(type);
		if (add.hasPrev !== undefined) expect(!!token.prev).toBe(add.hasPrev);
		if (add.isKey !== undefined) expect(token.isKey).toBe(add.isKey);
		if (add.isValue !== undefined) expect(token.isValue).toBe(add.isValue);
	};

	test("token or comment or line generator", () => {
		const e = getAll(
			"---",
			"k: v  # k=v",
			"",
		);
		expect(e).toHaveLength(10);
		tokenTypeChecker(e[0], "document", { hasPrev: false });
		tokenTypeChecker(e[1], "doc-start");
		expect(e[2]).toBeInstanceOf(Line);
		tokenTypeChecker(e[3], "block-map");
		tokenTypeChecker(e[4], "scalar", { isKey: true, isValue: false });
		tokenTypeChecker(e[5], "map-value-ind", { isKey: undefined, isValue: undefined });
		tokenTypeChecker(e[6], "scalar", { isKey: false, isValue: true });
		expect(e[7]).toBeInstanceOf(Comment);
		expect(e[8]).toBeInstanceOf(Line);
		expect(e[9]).toBeInstanceOf(Line);
	});
});
