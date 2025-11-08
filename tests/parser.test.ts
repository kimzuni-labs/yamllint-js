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

/* eslint-disable @typescript-eslint/no-floating-promises */

import assert from "node:assert/strict";
import { describe, test } from "node:test";

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
		assert.deepStrictEqual([lineNo, start, end], data);
	};

	test("line generator", () => {
		let e: Line[];

		e = getLines("");
		assert.equal(e.length, 1);
		lineChecker(e[0], 1, 0, 0);

		e = getLines("\n");
		assert.equal(e.length, 2);

		e = getLines(" \n");
		assert.equal(e.length, 2);
		lineChecker(e[0], 1, 0, 1);

		e = getLines("\n\n");
		assert.equal(e.length, 3);

		e = getLines(
			"---",
			"this is line 1",
			"line 2",
			"",
			"3",
		);
		assert.equal(e.length, 5);
		assert.equal(e[0].lineNo, 1);
		assert.equal(e[0].content, "---");
		assert.equal(e[2].content, "line 2");
		assert.equal(e[3].content, "");

		e = getLines(
			"test with",
			"newline",
			"at the end",
			"",
		);
		assert.equal(e.length, 4);
		assert.equal(e[2].lineNo, 3);
		assert.equal(e[2].content, "at the end");
		assert.equal(e[3].lineNo, 4);
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
		assert.ok(!e.some(x => ["newline", "comment", "space"].includes(x.data.type)));
		assert.equal(e[0].parent, null);
		assert.equal(e[5].prev?.prev?.prev?.prev?.prev?.prev, null);
		assert.deepStrictEqual(e[0], e[5].prev.prev.prev.prev.prev);
		assert.deepStrictEqual(e[13].prev?.prev?.prev?.prev?.prev, e[8]);
		assert.deepStrictEqual(e[13].next?.next?.next?.next?.next, e[18]);
		assert.equal(e[18].parent?.parent?.parent?.parent, null);
		assert.equal(e[e.length - 1].next, null);

		const t = tokenGenerator(source.join("\n"));
		for (let i = 0; i < 22; i++) t.next();
		const curr = t.next().value;
		assert.ok(curr);
		assert.ok(curr.parent?.parent?.parent);
		assert.ok(curr.prev?.prev?.prev?.prev);
		assert.ok(curr.next?.next);
		assert.equal(curr.next.next.next, undefined);
		t.next(); assert.ok(curr.next.next.next);
	});



	const getTokOrCom = (...strings: string[]) => Array.from(tokenOrCommentGenerator(strings.join("\n")));
	const commentChecker = (
		comment: Token | Comment,
		line: number,
		column: number,
		content: string,
	) => {
		assert.ok(comment instanceof Comment);
		assert.ok(comment.equals(new Comment(line, column, content, 0)));
	};

	test("token or comment generator", () => {
		let e: Array<Token | Comment>;

		e = getTokOrCom("a:b");
		assert.equal(e.length, 2);
		assert.ok(e[0] instanceof Token);
		assert.equal(e[0].prev, null);
		assert.ok(e[0].next instanceof Token);
		assert.ok(e[1] instanceof Token);
		assert.deepStrictEqual(e[1].prev, e[0]);
		assert.deepStrictEqual(e[1], e[0].next);
		assert.equal(e[1].next, null);

		e = getTokOrCom(
			"---",
			"k: v",
		);
		assert.equal(e.length, 6);
		assert.ok(e[3] instanceof Token);
		assert.equal(e[3].isKey, true);
		assert.equal(e[3].isValue, false);
		assert.ok(e[5] instanceof Token);
		assert.equal(e[5].isKey, false);
		assert.equal(e[5].isValue, true);

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
		assert.equal(e.length, 17);
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
		assert.equal(c.length, 10);
		assert.equal(c[0].isInline(), false);
		assert.equal(c[1].isInline(), false);
		assert.equal(c[2].isInline(), true);
		assert.equal(c[3].isInline(), false);
		assert.equal(c[4].isInline(), false);
		assert.equal(c[5].isInline(), true);
		assert.equal(c[6].isInline(), true);
		assert.equal(c[7].isInline(), true);
		assert.equal(c[8].isInline(), false);
		assert.equal(c[9].isInline(), true);
	});



	const getAll = (...strings: string[]) => Array.from(tokenOrCommentOrLineGenerator(strings.join("\n")));
	const tokenTypeChecker = (
		value: unknown,
		type: TokenData["type"],
		add: ScalarAdditionalData & { hasPrev?: boolean } = {},
	) => {
		assert.ok(value instanceof Token);
		const token = value as Token;
		assert.equal(token.data.type, type);
		if (add.hasPrev !== undefined) assert.equal(!!token.prev, add.hasPrev);
		if (add.isKey !== undefined) assert.equal(token.isKey, add.isKey);
		if (add.isValue !== undefined) assert.equal(token.isValue, add.isValue);
	};

	test("token or comment or line generator", () => {
		const e = getAll(
			"---",
			"k: v  # k=v",
			"",
		);
		assert.equal(e.length, 10);
		tokenTypeChecker(e[0], "document", { hasPrev: false });
		tokenTypeChecker(e[1], "doc-start");
		assert.ok(e[2] instanceof Line);
		tokenTypeChecker(e[3], "block-map");
		tokenTypeChecker(e[4], "scalar", { isKey: true, isValue: false });
		tokenTypeChecker(e[5], "map-value-ind", { isKey: undefined, isValue: undefined });
		tokenTypeChecker(e[6], "scalar", { isKey: false, isValue: true });
		assert.ok(e[7] instanceof Comment);
		assert.ok(e[8] instanceof Line);
		assert.ok(e[9] instanceof Line);
	});
});
