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

/* eslint-disable @stylistic/line-comment-position */

import { describe, test, expect } from "vitest";
import util from "node:util";

import { ruleTestCase } from "../common";
import { tokenGenerator } from "../../src/parser";
import { check, type Parent, type Context } from "../../src/rules/indentation";



/*
 * This test suite checks that the "indentation stack" built by the
 * indentation rule is valid. It is important, since everything else in the
 * rule relies on this stack.
 */
describe("Indentation Stack Test Case", () => {
	/*
	 * Transform the stack at a given moment into a printable string like
	 *
	 * - B_MAP:0
	 * - KEY:0
	 * - VAL:5
	 */
	const formatStack = (stack: Parent[]) => {
		return stack.slice(1).map(x => util.inspect(x)).join(" ");
	};

	const fullStack = (...sources: string[]) => {
		const conf = {
			spaces: 2,
			"indent-sequences": true,
			"check-multi-line-strings": false,
		};
		const context: Context = {};
		const output: string[] = [];

		for (const token of tokenGenerator(sources.join("\n"))) {
			Array.from(check({
				conf,

				// @ts-expect-error: ts(2322)
				token,
				context,
			}));

			if (
				token.data.type === "document"
				|| token.data.type === "explicit-key-ind"
			) continue;
			const tokenType = token.data.type
				.replace(/block/, "b")
				.replace(/flow/, "f")
				.replace(/collection/, "coll")
				.replace(/map-value-ind/, "value")
				.replace(/seq-item-ind/, "BEntry")

				// to camelcase
				.replace(/^\w|-([a-zA-Z])/g, s => s[s.length - 1].toUpperCase());

			const stack = formatStack(context.stack ?? []);
			output.push(`${tokenType.padStart(9, " ")} ${stack}`);
		}
		return output;
	};

	const run = (actual: string[], expected: string[]) => {
		expect(actual).toStrictEqual(expected);
	};



	test("simple mapping", () => {
		run(fullStack(
			"key: val\n",
		), [
			"     BMap B_MAP:0",
			"   Scalar B_MAP:0 KEY:0",
			"    Value B_MAP:0 KEY:0 VAL:5",
			"   Scalar B_MAP:0",
		]);

		run(fullStack(
			"     key: val\n",
		), [
			"     BMap B_MAP:5",
			"   Scalar B_MAP:5 KEY:5",
			"    Value B_MAP:5 KEY:5 VAL:10",
			"   Scalar B_MAP:5",
		]);
	});

	test("simple sequence", () => {
		run(fullStack(
			"- 1",
			"- 2",
			"- 3",
			"",
		), [
			"     BSeq B_SEQ:0",
			"   BEntry B_SEQ:0 B_ENT:2",
			"   Scalar B_SEQ:0",
			"   BEntry B_SEQ:0 B_ENT:2",
			"   Scalar B_SEQ:0",
			"   BEntry B_SEQ:0 B_ENT:2",
			"   Scalar ",
		]);

		run(fullStack(
			"key:",
			"  - 1",
			"  - 2",
			"",
		), [
			"     BMap B_MAP:0",
			"   Scalar B_MAP:0 KEY:0",
			"    Value B_MAP:0 KEY:0 VAL:2",
			"     BSeq B_MAP:0 KEY:0 VAL:2 B_SEQ:2",
			"   BEntry B_MAP:0 KEY:0 VAL:2 B_SEQ:2 B_ENT:4",
			"   Scalar B_MAP:0 KEY:0 VAL:2 B_SEQ:2",
			"   BEntry B_MAP:0 KEY:0 VAL:2 B_SEQ:2 B_ENT:4",
			"   Scalar B_MAP:0",
		]);
	});

	test("non indented sequences", () => {
		/*
		 * There seems to be a bug in pyyaml: depending on the indentation, a
		 * sequence does not produce the same tokens. More precisely, the
		 * following YAML:
		 *     usr:
		 *       - lib
		 * produces a BlockSequenceStartToken and a BlockEndToken around the
		 * "lib" sequence, whereas the following:
		 *     usr:
		 *     - lib
		 * does not (both two tokens are omitted).
		 * So, yamllint must create fake 'B_SEQ'. This test makes sure it does.
		 */

		run(fullStack(
			"usr:",
			"  - lib",
			"var: cache",
			"",
		), [
			"     BMap B_MAP:0",
			"   Scalar B_MAP:0 KEY:0",
			"    Value B_MAP:0 KEY:0 VAL:2",
			"     BSeq B_MAP:0 KEY:0 VAL:2 B_SEQ:2",
			"   BEntry B_MAP:0 KEY:0 VAL:2 B_SEQ:2 B_ENT:4",
			"   Scalar B_MAP:0",
			"   Scalar B_MAP:0 KEY:0",
			"    Value B_MAP:0 KEY:0 VAL:5",
			"   Scalar B_MAP:0",
		]);

		run(fullStack(
			"usr:",
			"- lib",
			"",
		), [
			"     BMap B_MAP:0",
			"   Scalar B_MAP:0 KEY:0",
			"    Value B_MAP:0 KEY:0 VAL:2",
			"     BSeq B_MAP:0 KEY:0 VAL:2 B_SEQ:0",
			"   BEntry B_MAP:0 KEY:0 VAL:2 B_SEQ:0 B_ENT:2",
			"   Scalar B_MAP:0",
		]);

		run(fullStack(
			"usr:",
			"- lib",
			"var: cache",
			"",
		), [
			"     BMap B_MAP:0",
			"   Scalar B_MAP:0 KEY:0",
			"    Value B_MAP:0 KEY:0 VAL:2",
			"     BSeq B_MAP:0 KEY:0 VAL:2 B_SEQ:0",
			"   BEntry B_MAP:0 KEY:0 VAL:2 B_SEQ:0 B_ENT:2",
			"   Scalar B_MAP:0",
			"   Scalar B_MAP:0 KEY:0",
			"    Value B_MAP:0 KEY:0 VAL:5",
			"   Scalar B_MAP:0",
		]);

		run(fullStack(
			"usr:",
			"- []",
			"",
		), [
			"     BMap B_MAP:0",
			"   Scalar B_MAP:0 KEY:0",
			"    Value B_MAP:0 KEY:0 VAL:2",
			"     BSeq B_MAP:0 KEY:0 VAL:2 B_SEQ:0",
			"   BEntry B_MAP:0 KEY:0 VAL:2 B_SEQ:0 B_ENT:2",
			"    FColl B_MAP:0 KEY:0 VAL:2 B_SEQ:0 B_ENT:2",
			"FSeqStart B_MAP:0 KEY:0 VAL:2 B_SEQ:0 B_ENT:2 F_SEQ:3",
			"  FSeqEnd B_MAP:0",
		]);

		run(fullStack(
			"usr:",
			"- k:",
			"    v",
			"",
		), [
			"     BMap B_MAP:0",
			"   Scalar B_MAP:0 KEY:0",
			"    Value B_MAP:0 KEY:0 VAL:2",
			"     BSeq B_MAP:0 KEY:0 VAL:2 B_SEQ:0",
			"   BEntry B_MAP:0 KEY:0 VAL:2 B_SEQ:0 B_ENT:2",
			"     BMap B_MAP:0 KEY:0 VAL:2 B_SEQ:0 B_ENT:2 B_MAP:2",
			"   Scalar B_MAP:0 KEY:0 VAL:2 B_SEQ:0 B_ENT:2 B_MAP:2 KEY:2",
			"    Value B_MAP:0 KEY:0 VAL:2 B_SEQ:0 B_ENT:2 B_MAP:2 KEY:2 VAL:4",
			"   Scalar B_MAP:0 KEY:0 VAL:2 B_SEQ:0 B_ENT:2 B_MAP:2",
		]);
	});

	test("flows", () => {
		run(fullStack(
			"usr: [",
			"  {k:",
			"    v}",
			"  ]",
			"",
		), [
			"     BMap B_MAP:0",
			"   Scalar B_MAP:0 KEY:0",
			"    Value B_MAP:0 KEY:0 VAL:5",
			"    FColl B_MAP:0 KEY:0 VAL:5",
			"FSeqStart B_MAP:0 KEY:0 VAL:5 F_SEQ:2",
			"    FColl B_MAP:0 KEY:0 VAL:5 F_SEQ:2",
			"FMapStart B_MAP:0 KEY:0 VAL:5 F_SEQ:2 F_MAP:3",
			"   Scalar B_MAP:0 KEY:0 VAL:5 F_SEQ:2 F_MAP:3 KEY:3",
			"    Value B_MAP:0 KEY:0 VAL:5 F_SEQ:2 F_MAP:3 KEY:3 VAL:5",
			"   Scalar B_MAP:0 KEY:0 VAL:5 F_SEQ:2 F_MAP:3",
			"  FMapEnd B_MAP:0 KEY:0 VAL:5 F_SEQ:2",
			"  FSeqEnd B_MAP:0",
		]);
	});

	test("anchors", () => {
		run(fullStack(
			"key: &anchor value",
			"",
		), [
			"     BMap B_MAP:0",
			"   Scalar B_MAP:0 KEY:0",
			"    Value B_MAP:0 KEY:0 VAL:5",
			"   Anchor B_MAP:0 KEY:0 VAL:5",
			"   Scalar B_MAP:0",
		]);

		run(fullStack(
			"key: &anchor",
			"  value",
			"",
		), [
			"     BMap B_MAP:0",
			"   Scalar B_MAP:0 KEY:0",
			"    Value B_MAP:0 KEY:0 VAL:2",
			"   Anchor B_MAP:0 KEY:0 VAL:2",
			"   Scalar B_MAP:0",
		]);

		run(fullStack(
			"- &anchor value",
			"",
		), [
			"     BSeq B_SEQ:0",
			"   BEntry B_SEQ:0 B_ENT:2",
			"   Anchor B_SEQ:0 B_ENT:2",
			"   Scalar ",
		]);

		run(fullStack(
			"- &anchor",
			"  value",
			"",
		), [
			"     BSeq B_SEQ:0",
			"   BEntry B_SEQ:0 B_ENT:2",
			"   Anchor B_SEQ:0 B_ENT:2",
			"   Scalar ",
		]);

		run(fullStack(
			"- &anchor",
			"  - 1",
			"  - 2",
			"",
		), [
			"     BSeq B_SEQ:0",
			"   BEntry B_SEQ:0 B_ENT:2",
			"   Anchor B_SEQ:0 B_ENT:2",
			"     BSeq B_SEQ:0 B_ENT:2 B_SEQ:2",
			"   BEntry B_SEQ:0 B_ENT:2 B_SEQ:2 B_ENT:4",
			"   Scalar B_SEQ:0 B_ENT:2 B_SEQ:2",
			"   BEntry B_SEQ:0 B_ENT:2 B_SEQ:2 B_ENT:4",
			"   Scalar ",
		]);

		run(fullStack(
			"&anchor key:",
			"  value",
			"",
		), [
			"     BMap B_MAP:0",
			"   Anchor B_MAP:0 KEY:0",
			"   Scalar B_MAP:0 KEY:0",
			"    Value B_MAP:0 KEY:0 VAL:2",
			"   Scalar B_MAP:0",
		]);

		run(fullStack(
			"pre:",
			"  &anchor1 0",
			"&anchor2 key:",
			"  value",
			"",
		), [
			"     BMap B_MAP:0",
			"   Scalar B_MAP:0 KEY:0",
			"    Value B_MAP:0 KEY:0 VAL:2",
			"   Anchor B_MAP:0 KEY:0 VAL:2",
			"   Scalar B_MAP:0",
			"   Anchor B_MAP:0 KEY:0",
			"   Scalar B_MAP:0 KEY:0",
			"    Value B_MAP:0 KEY:0 VAL:2",
			"   Scalar B_MAP:0",
		]);

		run(fullStack(
			"sequence: &anchor",
			"- entry",
			"- &anchor",
			"  - nested",
			"",
		), [
			"     BMap B_MAP:0",
			"   Scalar B_MAP:0 KEY:0",
			"    Value B_MAP:0 KEY:0 VAL:2",
			"   Anchor B_MAP:0 KEY:0 VAL:2",
			"     BSeq B_MAP:0 KEY:0 VAL:2 B_SEQ:0",
			"   BEntry B_MAP:0 KEY:0 VAL:2 B_SEQ:0 B_ENT:2",
			"   Scalar B_MAP:0 KEY:0 VAL:2 B_SEQ:0",
			"   BEntry B_MAP:0 KEY:0 VAL:2 B_SEQ:0 B_ENT:2",
			"   Anchor B_MAP:0 KEY:0 VAL:2 B_SEQ:0 B_ENT:2",
			"     BSeq B_MAP:0 KEY:0 VAL:2 B_SEQ:0 B_ENT:2 B_SEQ:2",
			"   BEntry B_MAP:0 KEY:0 VAL:2 B_SEQ:0 B_ENT:2 B_SEQ:2 B_ENT:4",
			"   Scalar B_MAP:0",
		]);
	});

	test("tags", () => {
		run(fullStack(
			"key: !!tag value",
			"",
		), [
			"     BMap B_MAP:0",
			"   Scalar B_MAP:0 KEY:0",
			"    Value B_MAP:0 KEY:0 VAL:5",
			"      Tag B_MAP:0 KEY:0 VAL:5",
			"   Scalar B_MAP:0",
		]);

		run(fullStack(
			"- !!map # Block collection",
			"  foo : bar",
			"",
		), [
			"     BSeq B_SEQ:0",
			"   BEntry B_SEQ:0 B_ENT:2",
			"      Tag B_SEQ:0 B_ENT:2",
			"     BMap B_SEQ:0 B_ENT:2 B_MAP:2",
			"   Scalar B_SEQ:0 B_ENT:2 B_MAP:2 KEY:2",
			"    Value B_SEQ:0 B_ENT:2 B_MAP:2 KEY:2 VAL:8",
			"   Scalar B_SEQ:0 B_ENT:2 B_MAP:2",
		]);

		run(fullStack(
			"- !!seq",
			"  - nested item",
			"",
		), [
			"     BSeq B_SEQ:0",
			"   BEntry B_SEQ:0 B_ENT:2",
			"      Tag B_SEQ:0 B_ENT:2",
			"     BSeq B_SEQ:0 B_ENT:2 B_SEQ:2",
			"   BEntry B_SEQ:0 B_ENT:2 B_SEQ:2 B_ENT:4",
			"   Scalar ",
		]);

		run(fullStack(
			"sequence: !!seq",
			"- entry",
			"- !!seq",
			"  - nested",
			"",
		), [
			"     BMap B_MAP:0",
			"   Scalar B_MAP:0 KEY:0",
			"    Value B_MAP:0 KEY:0 VAL:2",
			"      Tag B_MAP:0 KEY:0 VAL:2",
			"     BSeq B_MAP:0 KEY:0 VAL:2 B_SEQ:0",
			"   BEntry B_MAP:0 KEY:0 VAL:2 B_SEQ:0 B_ENT:2",
			"   Scalar B_MAP:0 KEY:0 VAL:2 B_SEQ:0",
			"   BEntry B_MAP:0 KEY:0 VAL:2 B_SEQ:0 B_ENT:2",
			"      Tag B_MAP:0 KEY:0 VAL:2 B_SEQ:0 B_ENT:2",
			"     BSeq B_MAP:0 KEY:0 VAL:2 B_SEQ:0 B_ENT:2 B_SEQ:2",
			"   BEntry B_MAP:0 KEY:0 VAL:2 B_SEQ:0 B_ENT:2 B_SEQ:2 B_ENT:4",
			"   Scalar B_MAP:0",
		]);
	});

	test("flows imbrication", () => {
		run(fullStack(
			"[[val]]\n",
		), [
			"    FColl ",
			"FSeqStart F_SEQ:1",
			"    FColl F_SEQ:1",
			"FSeqStart F_SEQ:1 F_SEQ:2",
			"   Scalar F_SEQ:1 F_SEQ:2",
			"  FSeqEnd F_SEQ:1",
			"  FSeqEnd ",
		]);

		run(fullStack(
			"[[val], [val2]]\n",
		), [
			"    FColl ",
			"FSeqStart F_SEQ:1",
			"    FColl F_SEQ:1",
			"FSeqStart F_SEQ:1 F_SEQ:2",
			"   Scalar F_SEQ:1 F_SEQ:2",
			"  FSeqEnd F_SEQ:1",
			"    Comma F_SEQ:1",
			"    FColl F_SEQ:1",
			"FSeqStart F_SEQ:1 F_SEQ:9",
			"   Scalar F_SEQ:1 F_SEQ:9",
			"  FSeqEnd F_SEQ:1",
			"  FSeqEnd ",
		]);

		run(fullStack(
			"{{key}}\n",
		), [
			"    FColl ",
			"FMapStart F_MAP:1",
			"    FColl F_MAP:1",
			"FMapStart F_MAP:1 F_MAP:2",
			"   Scalar F_MAP:1 F_MAP:2",
			"  FMapEnd F_MAP:1",
			"  FMapEnd ",
		]);

		run(fullStack(
			"[key]: value\n",
		), [
			"     BMap B_MAP:0",
			"    FColl B_MAP:0 KEY:0",
			"FSeqStart B_MAP:0 KEY:0 F_SEQ:1",
			"   Scalar B_MAP:0 KEY:0 F_SEQ:1",
			"  FSeqEnd B_MAP:0 KEY:0",
			"    Value B_MAP:0 KEY:0 VAL:7",
			"   Scalar B_MAP:0",
		]);

		run(fullStack(
			"[[key]]: value\n",
		), [
			"     BMap B_MAP:0",
			"    FColl B_MAP:0 KEY:0",
			"FSeqStart B_MAP:0 KEY:0 F_SEQ:1",
			"    FColl B_MAP:0 KEY:0 F_SEQ:1",
			"FSeqStart B_MAP:0 KEY:0 F_SEQ:1 F_SEQ:2",
			"   Scalar B_MAP:0 KEY:0 F_SEQ:1 F_SEQ:2",
			"  FSeqEnd B_MAP:0 KEY:0 F_SEQ:1",
			"  FSeqEnd B_MAP:0 KEY:0",
			"    Value B_MAP:0 KEY:0 VAL:9",
			"   Scalar B_MAP:0",
		]);

		run(fullStack(
			"{key}: value\n",
		), [
			"     BMap B_MAP:0",
			"    FColl B_MAP:0 KEY:0",
			"FMapStart B_MAP:0 KEY:0 F_MAP:1",
			"   Scalar B_MAP:0 KEY:0 F_MAP:1",
			"  FMapEnd B_MAP:0 KEY:0",
			"    Value B_MAP:0 KEY:0 VAL:7",
			"   Scalar B_MAP:0",
		]);

		run(fullStack(
			"{key: value}: value\n",
		), [
			"     BMap B_MAP:0",
			"    FColl B_MAP:0 KEY:0",
			"FMapStart B_MAP:0 KEY:0 F_MAP:1",
			"   Scalar B_MAP:0 KEY:0 F_MAP:1 KEY:1",
			"    Value B_MAP:0 KEY:0 F_MAP:1 KEY:1 VAL:6",
			"   Scalar B_MAP:0 KEY:0 F_MAP:1",
			"  FMapEnd B_MAP:0 KEY:0",
			"    Value B_MAP:0 KEY:0 VAL:14",
			"   Scalar B_MAP:0",
		]);

		run(fullStack(
			"{{key}}: value\n",
		), [
			"     BMap B_MAP:0",
			"    FColl B_MAP:0 KEY:0",
			"FMapStart B_MAP:0 KEY:0 F_MAP:1",
			"    FColl B_MAP:0 KEY:0 F_MAP:1",
			"FMapStart B_MAP:0 KEY:0 F_MAP:1 F_MAP:2",
			"   Scalar B_MAP:0 KEY:0 F_MAP:1 F_MAP:2",
			"  FMapEnd B_MAP:0 KEY:0 F_MAP:1",
			"  FMapEnd B_MAP:0 KEY:0",
			"    Value B_MAP:0 KEY:0 VAL:9",
			"   Scalar B_MAP:0",
		]);

		run(fullStack(
			"{{key}: val, {key2}: {val2}}\n",
		), [
			"    FColl ",
			"FMapStart F_MAP:1",
			"    FColl F_MAP:1 KEY:1",
			"FMapStart F_MAP:1 KEY:1 F_MAP:2",
			"   Scalar F_MAP:1 KEY:1 F_MAP:2",
			"  FMapEnd F_MAP:1 KEY:1",
			"    Value F_MAP:1 KEY:1 VAL:8",
			"   Scalar F_MAP:1",
			"    Comma F_MAP:1",
			"    FColl F_MAP:1 KEY:1",
			"FMapStart F_MAP:1 KEY:1 F_MAP:14",
			"   Scalar F_MAP:1 KEY:1 F_MAP:14",
			"  FMapEnd F_MAP:1 KEY:1",
			"    Value F_MAP:1 KEY:1 VAL:21",
			"    FColl F_MAP:1 KEY:1 VAL:21",
			"FMapStart F_MAP:1 KEY:1 VAL:21 F_MAP:22",
			"   Scalar F_MAP:1 KEY:1 VAL:21 F_MAP:22",
			"  FMapEnd F_MAP:1",
			"  FMapEnd ",
		]);

		run(fullStack(
			"{[{{[val]}}, [{[key]: val2}]]}\n",
		), [
			"    FColl ",
			"FMapStart F_MAP:1",
			"    FColl F_MAP:1",
			"FSeqStart F_MAP:1 F_SEQ:2",
			"    FColl F_MAP:1 F_SEQ:2",
			"FMapStart F_MAP:1 F_SEQ:2 F_MAP:3",
			"    FColl F_MAP:1 F_SEQ:2 F_MAP:3",
			"FMapStart F_MAP:1 F_SEQ:2 F_MAP:3 F_MAP:4",
			"    FColl F_MAP:1 F_SEQ:2 F_MAP:3 F_MAP:4",
			"FSeqStart F_MAP:1 F_SEQ:2 F_MAP:3 F_MAP:4 F_SEQ:5",
			"   Scalar F_MAP:1 F_SEQ:2 F_MAP:3 F_MAP:4 F_SEQ:5",
			"  FSeqEnd F_MAP:1 F_SEQ:2 F_MAP:3 F_MAP:4",
			"  FMapEnd F_MAP:1 F_SEQ:2 F_MAP:3",
			"  FMapEnd F_MAP:1 F_SEQ:2",
			"    Comma F_MAP:1 F_SEQ:2",
			"    FColl F_MAP:1 F_SEQ:2",
			"FSeqStart F_MAP:1 F_SEQ:2 F_SEQ:14",
			"    FColl F_MAP:1 F_SEQ:2 F_SEQ:14",
			"FMapStart F_MAP:1 F_SEQ:2 F_SEQ:14 F_MAP:15",
			"    FColl F_MAP:1 F_SEQ:2 F_SEQ:14 F_MAP:15 KEY:15",
			"FSeqStart F_MAP:1 F_SEQ:2 F_SEQ:14 F_MAP:15 KEY:15 F_SEQ:16",
			"   Scalar F_MAP:1 F_SEQ:2 F_SEQ:14 F_MAP:15 KEY:15 F_SEQ:16",
			"  FSeqEnd F_MAP:1 F_SEQ:2 F_SEQ:14 F_MAP:15 KEY:15",
			"    Value F_MAP:1 F_SEQ:2 F_SEQ:14 F_MAP:15 KEY:15 VAL:22",
			"   Scalar F_MAP:1 F_SEQ:2 F_SEQ:14 F_MAP:15",
			"  FMapEnd F_MAP:1 F_SEQ:2 F_SEQ:14",
			"  FSeqEnd F_MAP:1 F_SEQ:2",
			"  FSeqEnd F_MAP:1",
			"  FMapEnd ",
		]);
	});
});



describe("Indentation Test Case", () => {
	const conf = ruleTestCase("indentation");

	test("disabled", async () => {
		const check = await conf(
			"indentation: disable",
		);

		await check([
			"---",
			"object:",
			"   k1: v1",
			"obj2:",
			" k2:",
			"     - 8",
			" k3:",
			"           val",
			"...",
			"",
		], [
		]);

		await check([
			"---",
			"  o:",
			"    k1: v1",
			"  p:",
			"   k3:",
			"       val",
			"...",
			"",
		], [
		]);

		await check([
			"---",
			"     - o:",
			"         k1: v1",
			"     - p: kdjf",
			"     - q:",
			"        k3:",
			"              - val",
			"...",
			"",
			"---",
			"     - o:",
			"         k1: v1",
			"     - p: kdjf",
			"     - q:",
			"        k3:",
			"              - val",
			"...",
			"",
		], [
		]);
	});

	describe("spaces", () => {
		test("1", async () => {
			let check: Awaited<Awaited<ReturnType<typeof conf>>>;

			check = await conf(
				"indentation: {spaces: 1, indent-sequences: false}",
			);

			await check([
				"---",
				"object:",
				" k1:",
				" - a",
				" - b",
				" k2: v2",
				" k3:",
				" - name: Unix",
				"   date: 1969",
				" - name: Linux",
				"   date: 1991",
				"...",
				"",
			], [
			]);



			check = await conf(
				"indentation: {spaces: 1, indent-sequences: true}",
			);

			await check([
				"---",
				"object:",
				" k1:",
				"  - a",
				"  - b",
				" k2: v2",
				" k3:",
				"  - name: Unix",
				"    date: 1969",
				"  - name: Linux",
				"    date: 1991",
				"...",
				"",
			], [
			]);
		});

		test("2", async () => {
			let check: Awaited<ReturnType<typeof conf>>;

			check = await conf(
				"indentation: {spaces: 2, indent-sequences: false}",
			);

			await check([
				"---",
				"object:",
				"  k1:",
				"  - a",
				"  - b",
				"  k2: v2",
				"  k3:",
				"  - name: Unix",
				"    date: 1969",
				"  - name: Linux",
				"    date: 1991",
				"  k4:",
				"  -",
				"  k5: v3",
				"...",
				"",
			], [
			]);



			check = await conf(
				"indentation: {spaces: 2, indent-sequences: true}",
			);

			await check([
				"---",
				"object:",
				"  k1:",
				"    - a",
				"    - b",
				"  k2: v2",
				"  k3:",
				"    - name: Unix",
				"      date: 1969",
				"    - name: Linux",
				"      date: 1991",
				"...",
				"",
			], [
			]);
		});

		test("3", async () => {
			let check: Awaited<ReturnType<typeof conf>>;

			check = await conf(
				"indentation: {spaces: 3, indent-sequences: false}",
			);

			await check([
				"---",
				"object:",
				"   k1:",
				"   - a",
				"   - b",
				"   k2: v2",
				"   k3:",
				"   - name: Unix",
				"     date: 1969",
				"   - name: Linux",
				"     date: 1991",
				"...",
				"",
			], [
			]);



			check = await conf(
				"indentation: {spaces: 3, indent-sequences: true}",
			);

			await check([
				"---",
				"object:",
				"   k1:",
				"      - a",
				"      - b",
				"   k2: v2",
				"   k3:",
				"      - name: Unix",
				"        date: 1969",
				"      - name: Linux",
				"        date: 1991",
				"...",
				"",
			], [
			]);
		});

		test("consistent", async () => {
			const check = await conf(
				"indentation: {spaces: consistent, indent-sequences: whatever}",
				"document-start: disable",
			);

			await check([
				"---",
				"object:",
				" k1:",
				"  - a",
				"  - b",
				" k2: v2",
				" k3:",
				"  - name: Unix",
				"    date: 1969",
				"  - name: Linux",
				"    date: 1991",
				"...",
				"",
			], [
			]);

			await check([
				"---",
				"object:",
				"  k1:",
				"  - a",
				"  - b",
				"  k2: v2",
				"  k3:",
				"  - name: Unix",
				"    date: 1969",
				"  - name: Linux",
				"    date: 1991",
				"...",
				"",
			], [
			]);

			await check([
				"---",
				"object:",
				"   k1:",
				"      - a",
				"      - b",
				"   k2: v2",
				"   k3:",
				"      - name: Unix",
				"        date: 1969",
				"      - name: Linux",
				"        date: 1991",
				"...",
				"",
			], [
			]);

			await check([
				"first is not indented:",
				"  value is indented",
				"",
			], [
			]);

			await check([
				"first is not indented:",
				"     value:",
				"          is indented",
				"",
			], [
			]);

			await check([
				"- first is already indented:",
				"    value is indented too",
				"",
			], [
			]);

			await check([
				"- first is already indented:",
				"       value:",
				"            is indented too",
				"",
			], [
			]);

			await check([
				"- first is already indented:",
				"       value:",
				"             is indented too",
				"",
			], [
				[3, 14],
			]);

			await check([
				"---",
				"list one:",
				"  - 1",
				"  - 2",
				"  - 3",
				"list two:",
				"    - a",
				"    - b",
				"    - c",
				"",
			], [
				[7, 5],
			]);

			await check([
				"---",
				"list one:",
				"- 1",
				"- 2",
				"- 3",
				"list two:",
				"  - a",
				"  - b",
				"  - c",
				"",
			], [
			]);

			await check([
				"---",
				"list one:",
				" - 1",
				" - 2",
				" - 3",
				"list two:",
				"- a",
				"- b",
				"- c",
				"",
			], [
			]);
		});

		test("consistent and indent-sequences", async () => {
			let check: Awaited<ReturnType<typeof conf>>;

			check = await conf(
				"indentation: {spaces: consistent, indent-sequences: true}",
			);

			await check([
				"---",
				"list one:",
				"- 1",
				"- 2",
				"- 3",
				"list two:",
				"    - a",
				"    - b",
				"    - c",
				"",
			], [
				[3, 1],
			]);

			await check([
				"---",
				"list one:",
				"  - 1",
				"  - 2",
				"  - 3",
				"list two:",
				"    - a",
				"    - b",
				"    - c",
				"",
			], [
				[7, 5],
			]);

			await check([
				"---",
				"list one:",
				"  - 1",
				"  - 2",
				"  - 3",
				"list two:",
				"- a",
				"- b",
				"- c",
				"",
			], [
				[7, 1],
			]);



			check = await conf(
				"indentation: {spaces: consistent, indent-sequences: false}",
			);

			await check([
				"---",
				"list one:",
				"- 1",
				"- 2",
				"- 3",
				"list two:",
				"    - a",
				"    - b",
				"    - c",
				"",
			], [
				[7, 5],
			]);

			await check([
				"---",
				"list one:",
				"- 1",
				"- 2",
				"- 3",
				"list two:",
				"  - a",
				"  - b",
				"  - c",
				"",
			], [
				[7, 3],
			]);

			await check([
				"---",
				"list one:",
				"  - 1",
				"  - 2",
				"  - 3",
				"list two:",
				"- a",
				"- b",
				"- c",
				"",
			], [
				[3, 3],
			]);



			check = await conf(
				"indentation: {spaces: consistent, indent-sequences: consistent}",
			);

			await check([
				"---",
				"list one:",
				"- 1",
				"- 2",
				"- 3",
				"list two:",
				"    - a",
				"    - b",
				"    - c",
				"",
			], [
				[7, 5],
			]);

			await check([
				"---",
				"list one:",
				"    - 1",
				"    - 2",
				"    - 3",
				"list two:",
				"- a",
				"- b",
				"- c",
				"",
			], [
				[7, 1],
			]);

			await check([
				"---",
				"list one:",
				"- 1",
				"- 2",
				"- 3",
				"list two:",
				"- a",
				"- b",
				"- c",
				"",
			], [
			]);

			await check([
				"---",
				"list one:",
				"  - 1",
				"  - 2",
				"  - 3",
				"list two:",
				"    - a",
				"    - b",
				"    - c",
				"",
			], [
				[7, 5],
			]);



			check = await conf(
				"indentation: {spaces: consistent, indent-sequences: whatever}",
			);

			await check([
				"---",
				"list one:",
				"- 1",
				"- 2",
				"- 3",
				"list two:",
				"    - a",
				"    - b",
				"    - c",
				"",
			], [
			]);

			await check([
				"---",
				"list one:",
				"    - 1",
				"    - 2",
				"    - 3",
				"list two:",
				"- a",
				"- b",
				"- c",
				"",
			], [
			]);

			await check([
				"---",
				"list one:",
				"- 1",
				"- 2",
				"- 3",
				"list two:",
				"- a",
				"- b",
				"- c",
				"",
			], [
			]);

			await check([
				"---",
				"list one:",
				"  - 1",
				"  - 2",
				"  - 3",
				"list two:",
				"    - a",
				"    - b",
				"    - c",
				"",
			], [
				[7, 5],
			]);
		});
	});

	describe("indent sequences", () => {
		test("whatever", async () => {
			const check = await conf(
				"indentation: {spaces: 4, indent-sequences: whatever}",
			);

			await check([
				"---",
				"list one:",
				"- 1",
				"- 2",
				"- 3",
				"list two:",
				"    - a",
				"    - b",
				"    - c",
				"",
			], [
			]);

			await check([
				"---",
				"list one:",
				"  - 1",
				"  - 2",
				"  - 3",
				"list two:",
				"    - a",
				"    - b",
				"    - c",
				"",
			], [
				[3, 3],
			]);

			await check([
				"---",
				"list one:",
				"- 1",
				"- 2",
				"- 3",
				"list two:",
				"  - a",
				"  - b",
				"  - c",
				"",
			], [
				[7, 3],
			]);

			await check([
				"---",
				"list:",
				"    - 1",
				"    - 2",
				"    - 3",
				"- a",
				"- b",
				"- c",
				"",
			], [
				[6, 1, "syntax"],
				[6, 1, "syntax"],
				[6, 1, "syntax"],
			]);
		});

		test("consistent", async () => {
			const check = await conf(
				"indentation: {spaces: 4, indent-sequences: consistent}",
			);

			await check([
				"---",
				"list one:",
				"- 1",
				"- 2",
				"- 3",
				"list:",
				"    two:",
				"    - a",
				"    - b",
				"    - c",
				"",
			], [
			]);

			await check([
				"---",
				"list one:",
				"    - 1",
				"    - 2",
				"    - 3",
				"list:",
				"    two:",
				"        - a",
				"        - b",
				"        - c",
				"",
			], [
			]);

			await check([
				"---",
				"list one:",
				"- 1",
				"- 2",
				"- 3",
				"list two:",
				"    - a",
				"    - b",
				"    - c",
				"",
			], [
				[7, 5],
			]);

			await check([
				"---",
				"list one:",
				"    - 1",
				"    - 2",
				"    - 3",
				"list two:",
				"- a",
				"- b",
				"- c",
				"",
			], [
				[7, 1],
			]);

			await check([
				"---",
				"list one:",
				" - 1",
				" - 2",
				" - 3",
				"list two:",
				"- a",
				"- b",
				"- c",
				"",
			], [
				[3, 2],
				[7, 1],
			]);
		});
	});

	describe("flows", () => {
		test("direct", async () => {
			/*
			 * flow: [ ...
			 * ]
			 */

			const check = await conf(
				"indentation: {spaces: consistent}",
			);

			await check([
				"---",
				"a: {x: 1,",
				"    y,",
				"    z: 1}",
				"",
			], [
			]);

			await check([
				"---",
				"a: {x: 1,",
				"   y,",
				"    z: 1}",
				"",
			], [
				[3, 4],
			]);

			await check([
				"---",
				"a: {x: 1,",
				"     y,",
				"    z: 1}",
				"",
			], [
				[3, 6],
			]);

			await check([
				"---",
				"a: {x: 1,",
				"  y, z: 1}",
				"",
			], [
				[3, 3],
			]);

			await check([
				"---",
				"a: {x: 1,",
				"    y, z: 1",
				"}",
				"",
			], [
			]);

			await check([
				"---",
				"a: {x: 1,",
				"  y, z: 1",
				"}",
				"",
			], [
				[3, 3],
			]);

			await check([
				"---",
				"a: [x,",
				"    y,",
				"    z]",
				"",
			], [
			]);

			await check([
				"---",
				"a: [x,",
				"   y,",
				"    z]",
				"",
			], [
				[3, 4],
			]);

			await check([
				"---",
				"a: [x,",
				"     y,",
				"    z]",
				"",
			], [
				[3, 6],
			]);

			await check([
				"---",
				"a: [x,",
				"  y, z]",
				"",
			], [
				[3, 3],
			]);

			await check([
				"---",
				"a: [x,",
				"    y, z",
				"]",
				"",
			], [
			]);

			await check([
				"---",
				"a: [x,",
				"  y, z",
				"]",
				"",
			], [
				[3, 3],
			]);
		});

		test("broken", async () => {
			/*
			 * flow: [
			 *   ...
			 * ]
			 */

			let check: Awaited<ReturnType<typeof conf>>;

			check = await conf(
				"indentation: {spaces: consistent}",
			);

			await check([
				"---",
				"a: {",
				"  x: 1,",
				"  y, z: 1",
				"}",
				"",
			], [
			]);

			await check([
				"---",
				"a: {",
				"  x: 1,",
				"  y, z: 1}",
				"",
			], [
			]);

			await check([
				"---",
				"a: {",
				"   x: 1,",
				"  y, z: 1",
				"}",
				"",
			], [
				[4, 3],
			]);

			await check([
				"---",
				"a: {",
				"  x: 1,",
				"  y, z: 1",
				"  }",
				"",
			], [
				[5, 3],
			]);

			await check([
				"---",
				"a: [",
				"  x,",
				"  y, z",
				"]",
				"",
			], [
			]);

			await check([
				"---",
				"a: [",
				"  x,",
				"  y, z]",
				"",
			], [
			]);

			await check([
				"---",
				"a: [",
				"   x,",
				"  y, z",
				"]",
				"",
			], [
				[4, 3],
			]);

			await check([
				"---",
				"a: [",
				"  x,",
				"  y, z",
				"  ]",
				"",
			], [
				[5, 3],
			]);

			await check([
				"---",
				"obj: {",
				"  a: 1,",
				"   b: 2,",
				" c: 3",
				"}",
				"",
			], [
				[4, 4],
				[5, 2],
			]);

			await check([
				"---",
				"list: [",
				"  1,",
				"   2,",
				" 3",
				"]",
				"",
			], [
				[4, 4],
				[5, 2],
			]);

			await check([
				"---",
				"top:",
				"  rules: [",
				"    1, 2,",
				"  ]",
				"",
			], [
			]);

			await check([
				"---",
				"top:",
				"  rules: [",
				"    1, 2,",
				"   ]",
				"  rulez: [",
				"    1, 2,",
				"    ]",
				"",
			], [
				[5, 4],
				[8, 5],
			]);

			await check([
				"---",
				"top:",
				"  rules:",
				"    here: {",
				"      foo: 1,",
				"      bar: 2",
				"    }",
				"",
			], [
			]);

			await check([
				"---",
				"top:",
				"  rules:",
				"    here: {",
				"      foo: 1,",
				"      bar: 2",
				"      }",
				"    there: {",
				"      foo: 1,",
				"      bar: 2",
				"     }",
				"",
			], [
				[7, 7],
				[11, 6],
			]);



			check = await conf(
				"indentation: {spaces: 2}",
			);

			await check([
				"---",
				"a: {",
				"   x: 1,",
				"  y, z: 1",
				"}",
				"",
			], [
				[3, 4],
			]);

			await check([
				"---",
				"a: [",
				"   x,",
				"  y, z",
				"]",
				"",
			], [
				[3, 4],
			]);
		});

		test("cleared", async () => {
			/*
			 * flow:
			 *   [
			 *     ...
			 *   ]
			 */

			const check = await conf(
				"indentation: {spaces: consistent}",
			);

			await check([
				"---",
				"top:",
				"  rules:",
				"    {",
				"      foo: 1,",
				"      bar: 2",
				"    }",
				"",
			], [
			]);

			await check([
				"---",
				"top:",
				"  rules:",
				"    {",
				"       foo: 1,",
				"      bar: 2",
				"    }",
				"",
			], [
				[5, 8],
			]);

			await check([
				"---",
				"top:",
				"  rules:",
				"   {",
				"     foo: 1,",
				"     bar: 2",
				"   }",
				"",
			], [
				[4, 4],
			]);

			await check([
				"---",
				"top:",
				"  rules:",
				"    {",
				"      foo: 1,",
				"      bar: 2",
				"   }",
				"",
			], [
				[7, 4],
			]);

			await check([
				"---",
				"top:",
				"  rules:",
				"    {",
				"      foo: 1,",
				"      bar: 2",
				"     }",
				"",
			], [
				[7, 6],
			]);

			await check([
				"---",
				"top:",
				"  [",
				"    a, b, c",
				"  ]",
				"",
			], [
			]);

			await check([
				"---",
				"top:",
				"  [",
				"     a, b, c",
				"  ]",
				"",
			], [
				[4, 6],
			]);

			await check([
				"---",
				"top:",
				"   [",
				"     a, b, c",
				"   ]",
				"",
			], [
				[4, 6],
			]);

			await check([
				"---",
				"top:",
				"  [",
				"    a, b, c",
				"   ]",
				"",
			], [
				[5, 4],
			]);

			await check([
				"---",
				"top:",
				"  rules: [",
				"    {",
				"      foo: 1",
				"    },",
				"    {",
				"      foo: 2,",
				"      bar: [",
				"        a, b, c",
				"      ],",
				"    },",
				"  ]",
				"",
			], [
			]);

			await check([
				"---",
				"top:",
				"  rules: [",
				"    {",
				"     foo: 1",
				"     },",
				"    {",
				"      foo: 2,",
				"        bar: [",
				"          a, b, c",
				"      ],",
				"    },",
				"]",
				"",
			], [
				[5, 6],
				[6, 6],
				[9, 9],
				[11, 7],
				[13, 1, "syntax"],
				[13, 1, "syntax"],
			]);
		});
	});

	describe("indented", () => {
		test("under", async () => {
			let check: Awaited<ReturnType<typeof conf>>;

			check = await conf(
				"indentation: {spaces: 2, indent-sequences: consistent}",
			);

			await check([
				"---",
				"object:",
				" val: 1",
				"...",
				"",
			], [
				[3, 2],
			]);

			await check([
				"---",
				"object:",
				"  k1:",
				"   - a",
				"...",
				"",
			], [
				[4, 4],
			]);

			await check([
				"---",
				"object:",
				"  k3:",
				"    - name: Unix",
				"     date: 1969",
				"...",
				"",
			], [
				[5, 1, "syntax"],
				[5, 6],
			]);



			check = await conf(
				"indentation: {spaces: 4, indent-sequences: consistent}",
			);

			await check([
				"---",
				"object:",
				"   val: 1",
				"...",
				"",
			], [
				[3, 4],
			]);

			await check([
				"---",
				"- el1",
				"- el2:",
				"   - subel",
				"...",
				"",
			], [
				[4, 4],
			]);

			await check([
				"---",
				"object:",
				"    k3:",
				"        - name: Linux",
				"         date: 1991",
				"...",
				"",
			], [
				[5, 1, "syntax"],
				[5, 10],
			]);



			check = await conf(
				"indentation: {spaces: 2, indent-sequences: true}",
			);

			await check([
				"---",
				"a:",
				"-", // empty list
				"b: c",
				"...",
				"",
			], [
				[3, 1],
			]);



			check = await conf(
				"indentation: {spaces: 2, indent-sequences: consistent}",
			);

			await check([
				"---",
				"a:",
				"  -", // empty list
				"b:",
				"-", // empty list
				"c: d",
				"...",
				"",
			], [
				[5, 1],
			]);
		});

		test("over", async () => {
			let check: Awaited<ReturnType<typeof conf>>;

			check = await conf(
				"indentation: {spaces: 2, indent-sequences: consistent}",
			);

			await check([
				"---",
				"object:",
				"   val: 1",
				"...",
				"",
			], [
				[3, 4],
			]);

			await check([
				"---",
				"object:",
				"  k1:",
				"     - a",
				"...",
				"",
			], [
				[4, 6],
			]);

			await check([
				"---",
				"object:",
				"  k3:",
				"    - name: Unix",
				"       date: 1969",
				"...",
				"",
			], [
				[4, 13, "syntax"],
				[4, 13, "syntax"],
			]);



			check = await conf(
				"indentation: {spaces: 4, indent-sequences: consistent}",
			);

			await check([
				"---",
				"object:",
				"     val: 1",
				"...",
				"",
			], [
				[3, 6],
			]);

			await check([
				"---",
				" object:",
				"     val: 1",
				"...",
				"",
			], [
				[2, 2],
			]);

			await check([
				"---",
				"- el1",
				"- el2:",
				"     - subel",
				"...",
				"",
			], [
				[4, 6],
			]);

			await check([
				"---",
				"- el1",
				"- el2:",
				"              - subel",
				"...",
				"",
			], [
				[4, 15],
			]);

			await check([
				"---",
				"  - el1",
				"  - el2:",
				"        - subel",
				"...",
				"",
			], [
				[2, 3],
			]);

			await check([
				"---",
				"object:",
				"    k3:",
				"        - name: Linux",
				"           date: 1991",
				"...",
				"",
			], [
				[4, 17, "syntax"],
				[4, 17, "syntax"],
			]);



			check = await conf(
				"indentation: {spaces: 4, indent-sequences: whatever}",
			);

			await check([
				"---",
				"  - el1",
				"  - el2:",
				"    - subel",
				"...",
				"",
			], [
				[2, 3],
			]);



			check = await conf(
				"indentation: {spaces: 2, indent-sequences: false}",
			);

			await check([
				"---",
				"a:",
				"  -", // empty list
				"b: c",
				"...",
				"",
			], [
				[3, 3],
			]);



			check = await conf(
				"indentation: {spaces: 2, indent-sequences: consistent}",
			);

			await check([
				"---",
				"a:",
				"-", // empty list
				"b:",
				"  -",
				"c: d",
				"...",
				"",
			], [
				[5, 3],
			]);
		});
	});

	test("multi lines", async () => {
		const check = await conf(
			"indentation: {spaces: consistent, indent-sequences: true}",
		);

		await check([
			"---",
			"long_string: >",
			"  bla bla blah",
			"  blah bla bla",
			"...",
			"",
		], [
		]);

		await check([
			"---",
			"- long_string: >",
			"    bla bla blah",
			"    blah bla bla",
			"...",
			"",
		], [
		]);

		await check([
			"---",
			"obj:",
			"  - long_string: >",
			"      bla bla blah",
			"      blah bla bla",
			"...",
			"",
		], [
		]);
	});

	test("empty value", async () => {
		const check = await conf(
			"indentation: {spaces: consistent}",
		);

		await check([
			"---",
			"key1:",
			"key2: not empty",
			"key3:",
			"...",
			"",
		], [
		]);

		await check([
			"---",
			"-",
			"- item 2",
			"-",
			"...",
			"",
		], [
		]);
	});

	test("nested collections", async () => {
		let check: Awaited<ReturnType<typeof conf>>;

		check = await conf(
			"indentation: {spaces: 2}",
		);

		await check([
			"---",
			"- o:",
			"  k1: v1",
			"...",
			"",
		], [
		]);

		await check([
			"---",
			"- o:",
			" k1: v1",
			"...",
			"",
		], [
			[2, 5, "syntax"],
			[3, 2],
		]);

		await check([
			"---",
			"- o:",
			"   k1: v1",
			"...",
			"",
		], [
			[3, 4],
		]);



		check = await conf(
			"indentation: {spaces: 4}",
		);

		await check([
			"---",
			"- o:",
			"      k1: v1",
			"...",
			"",
		], [
		]);

		await check([
			"---",
			"- o:",
			"     k1: v1",
			"...",
			"",
		], [
			[3, 6],
		]);

		await check([
			"---",
			"- o:",
			"       k1: v1",
			"...",
			"",
		], [
			[3, 8],
		]);

		await check([
			"---",
			"- - - - item",
			"    - elem 1",
			"    - elem 2",
			"    - - - - - very nested: a",
			"              key: value",
			"...",
			"",
		], [
		]);

		await check([
			"---",
			" - - - - item",
			"     - elem 1",
			"     - elem 2",
			"     - - - - - very nested: a",
			"               key: value",
			"...",
			"",
		], [
			[2, 2],
		]);
	});

	test("nested collections with spaces consistent", async () => {
		/*
		 * Tests behavior of {spaces: consistent} in nested collections to
		 * ensure wrong-indentation is properly caught--especially when the
		 * expected indent value is initially unknown. For details, see
		 * https://github.com/adrienverge/yamllint/issues/485.
		 */

		let check: Awaited<ReturnType<typeof conf>>;

		check = await conf(
			"indentation: {spaces: consistent, indent-sequences: true}",
		);

		await check([
			"---",
			"- item:",
			"  - elem",
			"- item:",
			"    - elem",
			"...",
			"",
		], [
			[3, 3],
		]);

		check = await conf(
			"indentation: {spaces: consistent, indent-sequences: false}",
		);

		await check([
			"---",
			"- item:",
			"  - elem",
			"- item:",
			"    - elem",
			"...",
			"",
		], [
			[5, 5],
		]);



		check = await conf(
			"indentation: {spaces: consistent, indent-sequences: consistent}",
		);

		await check([
			"---",
			"- item:",
			"  - elem",
			"- item:",
			"    - elem",
			"...",
			"",
		], [
			[5, 5],
		]);



		check = await conf(
			"indentation: {spaces: consistent, indent-sequences: whatever}",
		);

		await check([
			"---",
			"- item:",
			"  - elem",
			"- item:",
			"    - elem",
			"...",
			"",
		], [
		]);
	});

	test("return", async () => {
		const check = await conf(
			"indentation: {spaces: consistent}",
		);

		await check([
			"---",
			"a:",
			"  b:",
			"    c:",
			"  d:",
			"    e:",
			"      f:",
			"g:",
			"...",
			"",
		], [
		]);

		await check([
			"---",
			"a:",
			"  b:",
			"    c:",
			"   d:",
			"...",
			"",
		], [
			[4, 7, "syntax"],
			[5, 4],
		]);

		await check([
			"---",
			"a:",
			"  b:",
			"    c:",
			" d:",
			"...",
			"",
		], [
			[4, 7, "syntax"],
			[5, 2],
		]);
	});

	test("first line", async () => {
		const check = await conf(
			"indentation: {spaces: consistent}",
			"document-start: disable",
		);

		await check([
			"  a: 1\n",
		], [
			[1, 3],
		]);
	});

	test("explicit block mappings", async () => {
		const check = await conf(
			"indentation: {spaces: consistent}",
		);

		await check([
			"---",
			"object:",
			"    ? key",
			"    : value",
			"",
		], [
		]);

		await check([
			"---",
			"object:",
			"    ? key",
			"    :",
			"        value",
			"...",
			"",
		], [
		]);

		await check([
			"---",
			"object:",
			"    ?",
			"        key",
			"    : value",
			"",
		], [
		]);

		await check([
			"---",
			"object:",
			"    ?",
			"        key",
			"    :",
			"        value",
			"...",
			"",
		], [
		]);

		await check([
			"---",
			"- ? key",
			"  : value",
			"",
		], [
		]);

		await check([
			"---",
			"- ? key",
			"  :",
			"      value",
			"...",
			"",
		], [
		]);

		await check([
			"---",
			"- ?",
			"      key",
			"  : value",
			"",
		], [
		]);

		await check([
			"---",
			"- ?",
			"      key",
			"  :",
			"      value",
			"...",
			"",
		], [
		]);

		await check([
			"---",
			"object:",
			"    ? key",
			"    :",
			"       value",
			"...",
			"",
		], [
			[5, 8],
		]);

		await check([
			"---",
			"- - ?",
			"       key",
			"    :",
			"      value",
			"...",
			"",
		], [
			[5, 7],
		]);

		await check([
			"---",
			"object:",
			"    ?",
			"       key",
			"    :",
			"         value",
			"...",
			"",
		], [
			[4, 8],
			[6, 10],
		]);

		await check([
			"---",
			"object:",
			"    ?",
			"         key",
			"    :",
			"       value",
			"...",
			"",
		], [
			[4, 10],
			[6, 8],
		]);
	});

	test("clear sequence item", async () => {
		let check: Awaited<ReturnType<typeof conf>>;

		check = await conf(
			"indentation: {spaces: consistent}",
		);

		await check([
			"---",
			"-",
			"  string",
			"-",
			"  map: ping",
			"-",
			"  - sequence",
			"  -",
			"    nested",
			"  -",
			"    >",
			"      multi",
			"      line",
			"...",
			"",
		], [
		]);

		await check([
			"---",
			"-",
			" string",
			"-",
			"   string",
			"",
		], [
			[5, 4],
		]);

		await check([
			"---",
			"-",
			" map: ping",
			"-",
			"   map: ping",
			"",
		], [
			[5, 4],
		]);

		await check([
			"---",
			"-",
			" - sequence",
			"-",
			"   - sequence",
			"",
		], [
			[5, 4],
		]);

		await check([
			"---",
			"-",
			"  -",
			"   nested",
			"  -",
			"     nested",
			"",
		], [
			[4, 4],
			[6, 6],
		]);

		await check([
			"---",
			"-",
			"  -",
			"     >",
			"      multi",
			"      line",
			"",
		], [
			[4, 6],
		]);



		check = await conf(
			"indentation: {spaces: 2}",
		);

		await check([
			"---",
			"-",
			" string",
			"-",
			"   string",
			"",
		], [
			[3, 2],
			[5, 4],
		]);

		await check([
			"---",
			"-",
			" map: ping",
			"-",
			"   map: ping",
			"",
		], [
			[3, 2],
			[5, 4],
		]);

		await check([
			"---",
			"-",
			" - sequence",
			"-",
			"   - sequence",
			"",
		], [
			[3, 2],
			[5, 4],
		]);

		await check([
			"---",
			"-",
			"  -",
			"   nested",
			"  -",
			"     nested",
			"",
		], [
			[4, 4],
			[6, 6],
		]);
	});

	test("anchors", async () => {
		const check = await conf(
			"indentation: {spaces: 2}",
		);

		await check([
			"---",
			"key: &anchor value",
			"",
		], [
		]);

		await check([
			"---",
			"key: &anchor",
			"  value",
			"",
		], [
		]);

		await check([
			"---",
			"- &anchor value",
			"",
		], [
		]);

		await check([
			"---",
			"- &anchor",
			"  value",
			"",
		], [
		]);

		await check([
			"---",
			"key: &anchor [1,",
			"              2]",
			"",
		], [
		]);

		await check([
			"---",
			"key: &anchor",
			"  [1,",
			"   2]",
			"",
		], [
		]);

		await check([
			"---",
			"key: &anchor",
			"  - 1",
			"  - 2",
			"",
		], [
		]);

		await check([
			"---",
			"- &anchor [1,",
			"           2]",
			"",
		], [
		]);

		await check([
			"---",
			"- &anchor",
			"  [1,",
			"   2]",
			"",
		], [
		]);

		await check([
			"---",
			"- &anchor",
			"  - 1",
			"  - 2",
			"",
		], [
		]);

		await check([
			"---",
			"key:",
			"  &anchor1",
			"  value",
			"",
		], [
		]);

		await check([
			"---",
			"pre:",
			"  &anchor1 0",
			"&anchor2 key:",
			"  value",
			"",
		], [
		]);

		await check([
			"---",
			"machine0:",
			"  /etc/hosts: &ref-etc-hosts",
			"    content:",
			"      - 127.0.0.1: localhost",
			"      - ::1: localhost",
			"    mode: 0644",
			"machine1:",
			"  /etc/hosts: *ref-etc-hosts",
			"",
		], [
		]);

		await check([
			"---",
			"list:",
			"  - k: v",
			"  - &a truc",
			"  - &b",
			"    truc",
			"  - k: *a",
			"",
		], [
		]);
	});

	test("tags", async () => {
		let check: Awaited<ReturnType<typeof conf>>;

		check = await conf(
			"indentation: {spaces: consistent}",
		);

		await check([
			"---",
			"-",
			"  'flow in block'",
			"- >",
			"    Block scalar",
			"- !!map  # Block collection",
			"  foo: bar",
			"",
		], [
		]);



		check = await conf(
			"indentation: {spaces: consistent, indent-sequences: false}",
		);

		await check([
			"---",
			"sequence: !!seq",
			"- entry",
			"- !!seq",
			"  - nested",
			"",
		], [
		]);

		await check([
			"---",
			"mapping: !!map",
			"  foo: bar",
			"Block style: !!map",
			"  Clark: Evans",
			"  Ingy: döt Net",
			"  Oren: Ben-Kik",
			"",
		], [
		]);

		await check([
			"---",
			"Flow style: !!map {Clark: Evans, Ingy: döt Net}",
			"Block style: !!seq",
			"- Clark Evans",
			"- Ingy döt Net",
			"",
		], [
		]);
	});

	test("flows imbrication", async () => {
		const check = await conf(
			"indentation: {spaces: consistent}",
		);

		await check([
			"---",
			"[val]: value",
			"",
		], [
		]);

		await check([
			"---",
			"{key}: value",
			"",
		], [
		]);

		await check([
			"---",
			"{key: val}: value",
			"",
		], [
		]);

		await check([
			"---",
			"[[val]]: value",
			"",
		], [
		]);

		await check([
			"---",
			"{{key}}: value",
			"",
		], [
		]);

		await check([
			"---",
			"{{key: val1}: val2}: value",
			"",
		], [
		]);

		await check([
			"---",
			"- [val, {{key: val}: val}]: value",
			"- {[val,",
			"    {{key: val}: val}]}",
			"- {[val,",
			"    {{key: val,",
			"      key2}}]}",
			"- {{{{{moustaches}}}}}",
			"- {{{{{moustache,",
			"       moustache},",
			"      moustache}},",
			"    moustache}}",
			"",
		], [
		]);

		await check([
			"---",
			"- {[val,",
			"     {{key: val}: val}]}",
			"",
		], [
			[3, 6],
		]);

		await check([
			"---",
			"- {[val,",
			"    {{key: val,",
			"     key2}}]}",
			"",
		], [
			[4, 6],
		]);

		await check([
			"---",
			"- {{{{{moustache,",
			"       moustache},",
			"       moustache}},",
			"   moustache}}",
			"",
		], [
			[4, 8],
			[5, 4],
		]);
	});
});



describe("Scalar Indentation Test Case", () => {
	const conf = ruleTestCase("indentation");

	test("basics plain", async () => {
		const check = await conf(
			"indentation: {spaces: consistent, check-multi-line-strings: false}",
			"document-start: disable",
		);

		await check([
			"multi",
			"line",
			"",
		], [
		]);

		await check([
			"multi",
			" line",
			"",
		], [
		]);

		await check([
			"- multi",
			"  line",
			"",
		], [
		]);

		await check([
			"- multi",
			"   line",
			"",
		], [
		]);

		await check([
			"a key: multi",
			"       line",
			"",
		], [
		]);

		await check([
			"a key: multi",
			"  line",
			"",
		], [
		]);

		await check([
			"a key: multi",
			"        line",
			"",
		], [
		]);

		await check([
			"a key:",
			"  multi",
			"  line",
			"",
		], [
		]);

		await check([
			"- C code: void main() {",
			"              printf(\"foo\");",
			"          }",
			"",
		], [
		]);

		await check([
			"- C code:",
			"    void main() {",
			"        printf(\"foo\");",
			"    }",
			"",
		], [
		]);
	});

	test("check multi line plain", async () => {
		const check = await conf(
			"indentation: {spaces: consistent, check-multi-line-strings: true}",
			"document-start: disable",
		);

		await check([
			"multi",
			" line",
			"",
		], [
			[2, 2],
		]);

		await check([
			"- multi",
			"   line",
			"",
		], [
			[2, 4],
		]);

		await check([
			"a key: multi",
			"  line",
			"",
		], [
			[2, 3],
		]);

		await check([
			"a key: multi",
			"        line",
			"",
		], [
			[2, 9],
		]);

		await check([
			"a key:",
			"  multi",
			"   line",
			"",
		], [
			[3, 4],
		]);

		await check([
			"- C code: void main() {",
			"              printf(\"foo\");",
			"          }",
			"",
		], [
			[2, 15],
		]);

		await check([
			"- C code:",
			"    void main() {",
			"        printf(\"foo\");",
			"    }",
			"",
		], [
			[3, 9],
		]);
	});

	test("basics quoted", async () => {
		const check = await conf(
			"indentation: {spaces: consistent, check-multi-line-strings: false}",
			"document-start: disable",
		);

		await check([
			"'multi",
			" line'",
			"",
		], [
		]);

		await check([
			"- 'multi",
			"   line'",
			"",
		], [
		]);

		await check([
			"a key: 'multi",
			"        line'",
			"",
		], [
		]);

		await check([
			"a key:",
			"  'multi",
			"   line'",
			"",
		], [
		]);

		await check([
			"- jinja2: '{% if ansible is defined %}",
			"             {{ ansible }}",
			"           {% else %}",
			"             {{ chef }}",
			"           {% endif %}'",
			"",
		], [
		]);

		await check([
			"- jinja2:",
			"    '{% if ansible is defined %}",
			"       {{ ansible }}",
			"     {% else %}",
			"       {{ chef }}",
			"     {% endif %}'",
			"",
		], [
		]);

		await check([
			"['this is a very long line",
			"  that needs to be split',",
			" 'other line']",
			"",
		], [
		]);

		await check([
			"['multi",
			"  line 1', 'multi",
			"            line 2']",
			"",
		], [
		]);
	});

	test("basics folded style", async () => {
		const check = await conf(
			"indentation: {spaces: consistent, check-multi-line-strings: false}",
			"document-start: disable",
		);

		await check([
			">",
			"  multi",
			"  line",
			"",
		], [
		]);

		await check([
			"- >",
			"    multi",
			"    line",
			"",
		], [
		]);

		await check([
			"- key: >",
			"    multi",
			"    line",
			"",
		], [
		]);

		await check([
			"- key:",
			"    >",
			"      multi",
			"      line",
			"",
		], [
		]);

		await check([
			"- ? >",
			"      multi-line",
			"      key",
			"  : >",
			"      multi-line",
			"      value",
			"",
		], [
		]);

		await check([
			"- ?",
			"    >",
			"      multi-line",
			"      key",
			"  :",
			"    >",
			"      multi-line",
			"      valu",
			"",
		], [
		]);

		await check([
			"- jinja2: >",
			"    {% if ansible is defined %}",
			"      {{ ansible }}",
			"    {% else %}",
			"      {{ chef }}",
			"    {% endif %}",
			"",
		], [
		]);
	});

	test("check multi line folded style", async () => {
		const check = await conf(
			"indentation: {spaces: consistent, check-multi-line-strings: true}",
			"document-start: disable",
		);

		await check([
			">",
			"  multi",
			"   line",
			"",
		], [
			[3, 4],
		]);

		await check([
			"- >",
			"    multi",
			"     line",
			"",
		], [
			[3, 6],
		]);

		await check([
			"- key: >",
			"    multi",
			"     line",
			"",
		], [
			[3, 6],
		]);

		await check([
			"- key:",
			"    >",
			"      multi",
			"       line",
			"",
		], [
			[4, 8],
		]);

		await check([
			"- ? >",
			"      multi-line",
			"       key",
			"  : >",
			"      multi-line",
			"       value",
			"",
		], [
			[3, 8],
			[6, 8],
		]);

		await check([
			"- ?",
			"    >",
			"      multi-line",
			"       key",
			"  :",
			"    >",
			"      multi-line",
			"       value",
			"",
		], [
			[4, 8],
			[8, 8],
		]);

		await check([
			"- jinja2: >",
			"    {% if ansible is defined %}",
			"      {{ ansible }}",
			"    {% else %}",
			"      {{ chef }}",
			"    {% endif %}",
			"",
		], [
			[3, 7],
			[5, 7],
		]);
	});

	test("basics literal style", async () => {
		const check = await conf(
			"indentation: {spaces: consistent, check-multi-line-strings: false}",
			"document-start: disable",
		);

		await check([
			"|",
			"  multi",
			"  line",
			"",
		], [
		]);

		await check([
			"- |",
			"    multi",
			"    line",
			"",
		], [
		]);

		await check([
			"- key: |",
			"    multi",
			"    line",
			"",
		], [
		]);

		await check([
			"- key:",
			"    |",
			"      multi",
			"      line",
			"",
		], [
		]);

		await check([
			"- ? |",
			"      multi-line",
			"      key",
			"  : |",
			"      multi-line",
			"      value",
			"",
		], [
		]);

		await check([
			"- ?",
			"    |",
			"      multi-line",
			"      key",
			"  :",
			"    |",
			"      multi-line",
			"      valu",
			"",
		], [
		]);

		await check([
			"- jinja2: |",
			"    {% if ansible is defined %}",
			"      {{ ansible }}",
			"    {% else %}",
			"      {{ chef }}",
			"    {% endif %}",
			"",
		], [
		]);
	});

	test("check multi line literal style", async () => {
		const check = await conf(
			"indentation: {spaces: consistent, check-multi-line-strings: true}",
			"document-start: disable",
		);

		await check([
			"|",
			"  multi",
			"   line",
			"",
		], [
			[3, 4],
		]);

		await check([
			"- |",
			"    multi",
			"     line",
			"",
		], [
			[3, 6],
		]);

		await check([
			"- key: |",
			"    multi",
			"     line",
			"",
		], [
			[3, 6],
		]);

		await check([
			"- key:",
			"    |",
			"      multi",
			"       line",
			"",
		], [
			[4, 8],
		]);

		await check([
			"- ? |",
			"      multi-line",
			"       key",
			"  : |",
			"      multi-line",
			"       value",
			"",
		], [
			[3, 8],
			[6, 8],
		]);

		await check([
			"- ?",
			"    |",
			"      multi-line",
			"       key",
			"  :",
			"    |",
			"      multi-line",
			"       value",
			"",
		], [
			[4, 8],
			[8, 8],
		]);

		await check([
			"- jinja2: |",
			"    {% if ansible is defined %}",
			"      {{ ansible }}",
			"    {% else %}",
			"      {{ chef }}",
			"    {% endif %}",
			"",
		], [
			[3, 7],
			[5, 7],
		]);
	});

	/*
	 * The following "paragraph" examples are inspired from
	 * http://stackoverflow.com/questions/3790454/in-yaml-how-do-i-break-a-string-over-multiple-lines
	 */

	test("paragraph plain", async () => {
		const check = await conf(
			"indentation: {spaces: consistent, check-multi-line-strings: true}",
			"document-start: disable",
		);

		await check([
			"- long text: very \"long\"",
			"             'string' with",
			"",
			"             paragraph gap, \\n and",
			"             spaces.",
			"",
		], [
		]);

		await check([
			"- long text: very \"long\"",
			"    'string' with",
			"",
			"    paragraph gap, \\n and",
			"    spaces.",
			"",
		], [
			[2, 5],
			[4, 5],
			[5, 5],
		]);

		await check([
			"- long text:",
			"    very \"long\"",
			"    'string' with",
			"",
			"    paragraph gap, \\n and",
			"    spaces.",
			"",
		], [
		]);
	});

	test("paragraph double quoted", async () => {
		const check = await conf(
			"indentation: {spaces: consistent, check-multi-line-strings: true}",
			"document-start: disable",
		);

		await check([
			"- long text: \"very \\\"long\\\"",
			"              'string' with",
			"",
			"              paragraph gap, \\n and",
			"              spaces.\"",
			"",
		], [
		]);

		await check([
			"- long text: \"very \\\"long\\\"",
			"    'string' with",
			"",
			"    paragraph gap, \\n and",
			"    spaces.\"",
			"",
		], [
			[2, 5],
			[4, 5],
			[5, 5],
		]);

		await check([
			"- long text: \"very \\\"long\\\"",
			"'string' with",
			"",
			"paragraph gap, \\n and",
			"spaces.\"",
			"",
		], [
			[2, 1, "syntax"],
			[2, 10, "syntax"],
		]);

		await check([
			"- long text:",
			"    \"very \\\"long\\\"",
			"     'string' with",
			"",
			"     paragraph gap, \\n and",
			"     spaces.\"",
			"",
		], [
		]);
	});

	test("paragraph single quoted", async () => {
		const check = await conf(
			"indentation: {spaces: consistent, check-multi-line-strings: true}",
			"document-start: disable",
		);

		await check([
			"- long text: 'very \"long\"",
			"              ''string'' with",
			"",
			"              paragraph gap, \\n and",
			"              spaces.'",
			"",
		], [
		]);

		await check([
			"- long text: 'very \"long\"",
			"    ''string'' with",
			"",
			"    paragraph gap, \\n and",
			"    spaces.'",
			"",
		], [
			[2, 5],
			[4, 5],
			[5, 5],
		]);

		await check([
			"- long text: 'very \"long\"",
			"''string'' with",
			"",
			"paragraph gap, \\n and",
			"spaces.'",
			"",
		], [
			[1, 26, "syntax"],
			[2, 1, "syntax"],
			[2, 3, "syntax"],
		]);

		await check([
			"- long text:",
			"    'very \"long\"",
			"     ''string'' with",
			"",
			"     paragraph gap, \\n and",
			"     spaces.'",
			"",
		], [
		]);
	});

	test("paragraph folded", async () => {
		const check = await conf(
			"indentation: {spaces: consistent, check-multi-line-strings: true}",
			"document-start: disable",
		);

		await check([
			"- long text: >",
			"    very \"long\"",
			"    'string' with",
			"",
			"    paragraph gap, \\n and",
			"    spaces.'",
			"",
		], [
		]);

		await check([
			"- long text: >",
			"    very \"long\"",
			"     'string' with",
			"",
			"      paragraph gap, \\n and",
			"       spaces.'",
			"",
		], [
			[3, 6],
			[5, 7],
			[6, 8],
		]);
	});

	test("paragraph literal", async () => {
		const check = await conf(
			"indentation: {spaces: consistent, check-multi-line-strings: true}",
			"document-start: disable",
		);

		await check([
			"- long text: |",
			"    very \"long\"",
			"    'string' with",
			"",
			"    paragraph gap, \\n and",
			"    spaces.'",
			"",
		], [
		]);

		await check([
			"- long text: |",
			"    very \"long\"",
			"     'string' with",
			"",
			"      paragraph gap, \\n and",
			"       spaces.'",
			"",
		], [
			[3, 6],
			[5, 7],
			[6, 8],
		]);
	});

	test("consistent", async () => {
		const check = await conf(
			"indentation: {spaces: consistent, check-multi-line-strings: true}",
			"document-start: disable",
		);

		await check([
			"multi",
			"line",
			"",
		], [
		]);

		await check([
			"multi",
			" line",
			"",
		], [
			[2, 2],
		]);

		await check([
			"- multi",
			"  line",
			"",
		], [
		]);

		await check([
			"- multi",
			"   line",
			"",
		], [
			[2, 4],
		]);

		await check([
			"a key: multi",
			"  line",
			"",
		], [
			[2, 3],
		]);

		await check([
			"a key: multi",
			"        line",
			"",
		], [
			[2, 9],
		]);

		await check([
			"a key:",
			"  multi",
			"   line",
			"",
		], [
			[3, 4],
		]);

		await check([
			"- C code: void main() {",
			"              printf(\"foo\");",
			"          }",
			"",
		], [
			[2, 15],
		]);

		await check([
			"- C code:",
			"    void main() {",
			"        printf(\"foo\");",
			"    }",
			"",
		], [
			[3, 9],
		]);

		await check([
			">",
			"  multi",
			"  line",
			"",
		], [
		]);

		await check([
			">",
			"     multi",
			"     line",
			"",
		], [
		]);

		await check([
			">",
			"     multi",
			"      line",
			"",
		], [
			[3, 7],
		]);
	});
});
