/*
 * Copyright (C) 2018 ClearScore
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

/* eslint-disable @typescript-eslint/no-floating-promises, @stylistic/line-comment-position */

import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { ruleTestCase, consoleWorkspace, assertConfigError } from "../common";



describe("Options Test Case", () => {
	const conf = ruleTestCase("quoted-strings");

	describe("extras", () => {
		test("unsafe pattern", async () => {
			const { warn } = await consoleWorkspace(["warn"], async () => {
				const check = await conf(
					"quoted-strings:",
					"  required: only-when-needed",
					"  extra-allowed:",
					"    - '^(b|b)*$'",
					"  extra-required:",
					"    - '^(b|b)*$'",
					"",
				);

				await check([
					"---",
					"a: b",
					"",
				], [
				]);
			});

			assert.equal(warn.trimEnd(), "Ignoring unsafe RegExp pattern: ^(b|b)*$");
		});
	});
});



describe("Quoted Values Test Case", () => {
	const conf = ruleTestCase("quoted-strings");

	const keys = [
		[
			"---",
			"boolean1: true",
			"number1: 123",
			"string1: foo",
			"string2: \"foo\"",
			"string3: \"true\"",
			"string4: \"123\"",
			"string5: 'bar'",
			"string6: !!str genericstring",
			"string7: !!str 456",
			"string8: !!str \"quotedgenericstring\"",
			"binary: !!binary binstring",
			"integer: !!int intstring",
			"boolean2: !!bool boolstring",
			"boolean3: !!bool \"quotedboolstring\"",
			"block-seq:",
			"  - foo",
			"  - \"foo\"",
			"flow-seq: [foo, \"foo\"]",
			"flow-map: {a: foo, b: \"foo\"}",
			"flow-seq2: [foo, \"foo,bar\", \"foo[bar]\", \"foo{bar}\"]",
			"flow-map2: {a: foo, b: \"foo,bar\"}",
			"nested-flow1: {a: foo, b: [foo, \"foo,bar\"]}",
			"nested-flow2: [{a: foo}, {b: \"foo,bar\", c: [\"d[e]\"]}]",
			"",
		],
		[
			"---",
			"multiline string 1: |",
			"  line 1",
			"  line 2",
			"multiline string 2: >",
			"  word 1",
			"  word 2",
			"multiline string 3:",
			"  word 1",
			"  word 2",
			"multiline string 4:",
			"  \"word 1",
			"   word 2\"",
			"multiline string 5:",
			"  \"word 1\\",
			"   word 2\"",
			"",
		],
	];

	test("disabled", async () => {
		const check = await conf("quoted-strings: disable");

		await check([
			"---",
			"foo: bar",
			"",
		], [
		]);

		await check([
			"---",
			"foo: \"bar\"",
			"",
		], [
		]);

		await check([
			"---",
			"foo: 'bar'",
			"",
		], [
		]);

		await check([
			"---",
			"foo: 123",
			"",
		], [
		]);

		await check([
			"---",
			"foo: \"123\"",
			"",
		], [
		]);
	});

	describe("quote_type", () => {
		test("any", async () => {
			const check = await conf("quoted-strings: {quote-type: any}");

			await check(keys[0], [
				[4, 10],
				[17, 5],
				[19, 12],
				[20, 15],
				[21, 13],
				[22, 16],
				[23, 19],
				[23, 28],
				[24, 20],
			]);

			await check(keys[1], [
				[9, 3],
			]);
		});

		test("single", async () => {
			const check = await conf("quoted-strings: {quote-type: single}");

			await check(keys[0], [
				[4, 10],
				[5, 10],
				[6, 10],
				[7, 10],
				[17, 5],
				[18, 5],
				[19, 12],
				[19, 17],
				[20, 15],
				[20, 23],
				[21, 13],
				[21, 18],
				[21, 29],
				[21, 41],
				[22, 16],
				[22, 24],
				[23, 19],
				[23, 28],
				[23, 33],
				[24, 20],
				[24, 30],
				[24, 45],
			]);

			await check(keys[1], [
				[9, 3],
				[12, 3],
				[15, 3],
			]);
		});

		test("double", async () => {
			const check = await conf("quoted-strings: {quote-type: double}");

			await check(keys[0], [
				[4, 10],
				[8, 10],
				[17, 5],
				[19, 12],
				[20, 15],
				[21, 13],
				[22, 16],
				[23, 19],
				[23, 28],
				[24, 20],
			]);

			await check(keys[1], [
				[9, 3],
			]);
		});

		test("consistent", async () => {
			let check: Awaited<ReturnType<typeof conf>>;

			check = await conf(
				"quoted-strings:",
				"  quote-type: consistent",
			);

			await check([
				"---",
				"string1: \"foo\"",
				"string2: \"bar\"",
				"string3: 'baz'",
				"string4: \"quux\"",
				"",
			], [
				[4, 10],
			]);



			check = await conf(
				"quoted-strings:",
				"  quote-type: consistent",
				"  check-keys: true",
			);

			await check([
				"---",
				"\"string1\": \"foo\"",
				"string2: \"bar\"",
				"'string3': \"baz\"",
				"\"string4\": {\"key\": \"val\"}",
				"\"string5\": {'key': \"val\"}",
				"",
			], [
				[3, 1],
				[4, 1],
				[6, 13],
			]);



			check = await conf(
				"quoted-strings:",
				"  quote-type: consistent",
				"  check-keys: true",
				"  required: false",
			);

			await check([
				"---",
				"string1: 'foo'",
				"string2: \"bar\"",
				"string3: 'baz'",
				"string4: {'key': \"val\"}",
				"string5: {\"key\": 'val'}",
				"string6:",
				"  'key': \"val\"",
				"string7:",
				"  \"key\": 'val'",
				"string8:",
				"  \"string\"",
				"string9: >",
				"  \"string\"",
				"",
			], [
				[3, 10],
				[5, 18],
				[6, 11],
				[8, 10],
				[10, 3],
				[12, 3],
			]);
		});
	});

	describe("not required", () => {
		test("any quotes", async () => {
			const check = await conf(
				"quoted-strings:",
				"  quote-type: any",
				"  required: false",
			);

			await check(keys[0], [
			]);

			await check(keys[1], [
			]);
		});

		test("single quotes", async () => {
			const check = await conf(
				"quoted-strings:",
				"  quote-type: single",
				"  required: false",
			);

			await check(keys[0], [
				[5, 10],
				[6, 10],
				[7, 10],
				[18, 5],
				[19, 17],
				[20, 23],
				[21, 18],
				[21, 29],
				[21, 41],
				[22, 24],
				[23, 33],
				[24, 30],
				[24, 45],
			]);

			await check(keys[1], [
				[12, 3],
				[15, 3],
			]);
		});
	});

	describe("only when needed", () => {
		test("normal", async () => {
			const check = await conf(
				"quoted-strings:",
				"  required: only-when-needed",
			);

			await check(keys[0], [
				[5, 10],
				[8, 10],
				[18, 5],
				[19, 17],
				[20, 23],
			]);

			await check(keys[1], [
				[12, 3],
			]);
		});

		test("single quotes", async () => {
			const check = await conf(
				"quoted-strings:",
				"  quote-type: single",
				"  required: only-when-needed",
			);

			await check(keys[0], [
				[5, 10],
				[6, 10],
				[7, 10],
				[8, 10],
				[18, 5],
				[19, 17],
				[20, 23],
				[21, 18],
				[21, 29],
				[21, 41],
				[22, 24],
				[23, 33],
				[24, 30],
				[24, 45],
			]);

			await check(keys[1], [
				[12, 3],
				[15, 3],
			]);
		});

		test("corner cases", async () => {
			const check = await conf(
				"quoted-strings:",
				"  required: only-when-needed",
			);

			await check([
				"---",
				"- \"\"",
				"- \"- item\"",
				"- \"key: value\"",
				"- \"%H:%M:%S\"",
				"- \"%wheel ALL=(ALL) NOPASSWD: ALL\"",
				"- '\"quoted\"'",
				"- \"'foo' == 'bar'\"",
				"- \"'Mac' in ansible_facts.product_name\"",
				"- 'foo # bar'",
				"",
			], [
			]);

			await check([
				"---",
				"k1: \"\"",
				"k2: \"- item\"",
				"k3: \"key: value\"",
				"k4: \"%H:%M:%S\"",
				"k5: \"%wheel ALL=(ALL) NOPASSWD: ALL\"",
				"k6: '\"quoted\"'",
				"k7: \"'foo' == 'bar'\"",
				"k8: \"'Mac' in ansible_facts.product_name\"",
				"",
			], [
			]);

			await check([
				"---",
				"- ---",
				"- \"---\"",
				"- ----------",
				"- \"----------\"",
				"- :wq",
				"- \":wq\"",
				"",
			], [
				[3, 3],
				[5, 3],
				[7, 3],
			]);

			await check([
				"---",
				"k1: ---",
				"k2: \"---\"",
				"k3: ----------",
				"k4: \"----------\"",
				"k5: :wq",
				"k6: \":wq\"",
				"",
			], [
				[3, 5],
				[5, 5],
				[7, 5],
			]);
		});

		test("extras", async () => {
			let check: Awaited<ReturnType<typeof conf>>;

			await assertConfigError(() => conf(
				"quoted-strings:",
				"  required: true",
				"  extra-allowed: [^http://]",
			));

			await assertConfigError(() => conf(
				"quoted-strings:",
				"  required: true",
				"  extra-required: [^http://]",
			));

			await assertConfigError(() => conf(
				"quoted-strings:",
				"  required: false",
				"  extra-allowed: [^http://]",
			));



			check = await conf(
				"quoted-strings:",
				"  required: true",
			);

			await check([
				"---",
				"- 123",
				"- \"123\"",
				"- localhost",
				"- \"localhost\"",
				"- http://localhost",
				"- \"http://localhost\"",
				"- ftp://localhost",
				"- \"ftp://localhost\"",
				"",
			], [
				[4, 3],
				[6, 3],
				[8, 3],
			]);



			check = await conf(
				"quoted-strings:",
				"  required: only-when-needed",
				"  extra-allowed: [^ftp://]",
				"  extra-required: [^http://]",
			);

			await check([
				"---",
				"- 123",
				"- \"123\"",
				"- localhost",
				"- \"localhost\"",
				"- http://localhost",
				"- \"http://localhost\"",
				"- ftp://localhost",
				"- \"ftp://localhost\"",
				"",
			], [
				[5, 3],
				[6, 3],
			]);



			check = await conf(
				"quoted-strings:",
				"  required: false",
				"  extra-required: [^http://, ^ftp://]",
			);

			await check([
				"---",
				"- 123",
				"- \"123\"",
				"- localhost",
				"- \"localhost\"",
				"- http://localhost",
				"- \"http://localhost\"",
				"- ftp://localhost",
				"- \"ftp://localhost\"",
				"",
			], [
				[6, 3],
				[8, 3],
			]);



			check = await conf(
				"quoted-strings:",
				"  required: only-when-needed",
				"  extra-allowed: [^ftp://, \";$\", \" \"]",
			);

			await check([
				"---",
				"- localhost",
				"- \"localhost\"",
				"- ftp://localhost",
				"- \"ftp://localhost\"",
				"- i=i+1",
				"- \"i=i+1\"",
				"- i=i+2;",
				"- \"i=i+2;\"",
				"- foo",
				"- \"foo\"",
				"- foo bar",
				"- \"foo bar\"",
				"",
			], [
				[3, 3],
				[7, 3],
				[11, 3],
			]);
		});

		test("special characters", async () => {
			const check = await conf(
				"quoted-strings:",
				"  required: only-when-needed",
			);

			await check([
				"---",
				"k1: \"\\u001b\"",
				"",
			], [
			]);

			await check([
				"---",
				"k1: '\\u001b'",
				"",
			], [
				[2, 5],
			]);

			await check([
				"---",
				"k1: \\u001b",
				"",
			], [
			]);

			await check([
				"---",
				"k1: \"\u001b\"",
				"",
			], [
			]);

			await check([
				"---",
				"k1: '\u001b'",
				"",
			], [
				[2, 5],
			]);

			await check([
				"---",
				"k1: \u001b",
				"",
			], [
			]);
		});
	});

	test("octal values", async () => {
		const check = await conf(
			"quoted-strings:",
			"  required: true",
		);

		await check([
			"---",
			"- 100",
			"- 0100",
			"- 0o100",
			"- 777",
			"- 0777",
			"- 0o777",
			"- 800",
			"- 0800",
			"- 0o800",
			"- \"0800\"",
			"- \"0o800\"",
			"",
		], [
			[9, 3],
			[10, 3],
		]);
	});

	test("allow quoted quotes", async () => {
		let check: Awaited<ReturnType<typeof conf>>;

		check = await conf(
			"quoted-strings:",
			"  quote-type: single",
			"  required: false",
			"  allow-quoted-quotes: false",
		);

		await check([
			"---",
			"foo1: \"[barbaz]\"",
			"foo2: \"[bar'baz]\"",
			"",
		], [
			[2, 7],
			[3, 7],
		]);



		check = await conf(
			"quoted-strings:",
			"  quote-type: single",
			"  required: false",
			"  allow-quoted-quotes: true",
		);

		await check([
			"---",
			"foo1: \"[barbaz]\"",
			"foo2: \"[bar'baz]\"",
			"",
		], [
			[2, 7],
		]);



		check = await conf(
			"quoted-strings:",
			"  quote-type: single",
			"  required: true",
			"  allow-quoted-quotes: false",
		);

		await check([
			"---",
			"foo1: \"[barbaz]\"",
			"foo2: \"[bar'baz]\"",
			"",
		], [
			[2, 7],
			[3, 7],
		]);



		check = await conf(
			"quoted-strings:",
			"  quote-type: single",
			"  required: true",
			"  allow-quoted-quotes: true",
		);

		await check([
			"---",
			"foo1: \"[barbaz]\"",
			"foo2: \"[bar'baz]\"",
			"",
		], [
			[2, 7],
		]);



		check = await conf(
			"quoted-strings:",
			"  quote-type: single",
			"  required: only-when-needed",
			"  allow-quoted-quotes: false",
		);

		await check([
			"---",
			"foo1: \"[barbaz]\"",
			"foo2: \"[bar'baz]\"",
			"",
		], [
			[2, 7],
			[3, 7],
		]);



		check = await conf(
			"quoted-strings:",
			"  quote-type: single",
			"  required: only-when-needed",
			"  allow-quoted-quotes: true",
		);

		await check([
			"---",
			"foo1: \"[barbaz]\"",
			"foo2: \"[bar'baz]\"",
			"",
		], [
			[2, 7],
		]);



		check = await conf(
			"quoted-strings:",
			"  quote-type: double",
			"  required: false",
			"  allow-quoted-quotes: false",
		);

		await check([
			"---",
			"foo1: '[barbaz]'",
			"foo2: '[bar\"baz]'",
			"",
		], [
			[2, 7],
			[3, 7],
		]);



		check = await conf(
			"quoted-strings:",
			"  quote-type: double",
			"  required: false",
			"  allow-quoted-quotes: true",
		);

		await check([
			"---",
			"foo1: '[barbaz]'",
			"foo2: '[bar\"baz]'",
			"",
		], [
			[2, 7],
		]);



		check = await conf(
			"quoted-strings:",
			"  quote-type: double",
			"  required: true",
			"  allow-quoted-quotes: false",
		);

		await check([
			"---",
			"foo1: '[barbaz]'",
			"foo2: '[bar\"baz]'",
			"",
		], [
			[2, 7],
			[3, 7],
		]);



		check = await conf(
			"quoted-strings:",
			"  quote-type: double",
			"  required: true",
			"  allow-quoted-quotes: true",
		);

		await check([
			"---",
			"foo1: '[barbaz]'",
			"foo2: '[bar\"baz]'",
			"",
		], [
			[2, 7],
		]);



		check = await conf(
			"quoted-strings:",
			"  quote-type: double",
			"  required: only-when-needed",
			"  allow-quoted-quotes: false",
		);

		await check([
			"---",
			"foo1: '[barbaz]'",
			"foo2: '[bar\"baz]'",
			"",
		], [
			[2, 7],
			[3, 7],
		]);



		check = await conf(
			"quoted-strings:",
			"  quote-type: double",
			"  required: only-when-needed",
			"  allow-quoted-quotes: true",
		);

		await check([
			"---",
			"foo1: '[barbaz]'",
			"foo2: '[bar\"baz]'",
			"",
		], [
			[2, 7],
		]);



		check = await conf(
			"quoted-strings:",
			"  quote-type: any",
		);

		await check([
			"---",
			"foo1: '[barbaz]'",
			"foo2: '[bar\"baz]'",
			"",
		], [
		]);
	});
});



describe("Quoted Keys Test Case", () => {
	const conf = ruleTestCase("quoted-strings");

	const keys = [
		"---",
		"true: 2",
		"123: 3",
		"foo1: 4",
		"\"foo2\": 5",
		"\"false\": 6",
		"\"234\": 7",
		"'bar': 8",
		"!!str generic_string: 9",
		"!!str 456: 10",
		"!!str \"quoted_generic_string\": 11",
		"!!binary binstring: 12",
		"!!int int_string: 13",
		"!!bool bool_string: 14",
		"!!bool \"quoted_bool_string\": 15",
		"? - 16", // Sequences and mappings
		"  - 17",
		": 18",
		"[119, 219]: 19",
		"? a: 20",
		"  \"b\": 21",
		": 22",
		"{a: 123, \"b\": 223}: 23",
		"? |", // Multiline strings
		"  line 1",
		"  line 2",
		": 27",
		"? >",
		"  line 1",
		"  line 2",
		": 31",
		"?",
		"  line 1",
		"  line 2",
		": 35",
		"?",
		"  \"line 1",
		"  line 2\"",
		": 37",
		"?",
		"  \"line 1\\",
		"   line 2\"",
		": 39",
		"",
	];

	test("disabled", async () => {
		const check = await conf(
			"quoted-strings: {}",
			"key-duplicates: disable",
		);

		await check(keys);
	});

	test("default", async () => {
		const check = await conf(
			"quoted-strings:",
			"  check-keys: true",
			"key-duplicates: disable",
		);

		await check(keys, [
			[4, 1],
			[20, 3],
			[23, 2],
			[33, 3],
		]);
	});

	describe("quote type", () => {
		test("any", async () => {
			const check = await conf(
				"quoted-strings:",
				"  check-keys: true",
				"  quote-type: any",
				"key-duplicates: disable",
			);

			await check(keys, [
				[4, 1],
				[20, 3],
				[23, 2],
				[33, 3],
			]);
		});

		test("single", async () => {
			const check = await conf(
				"quoted-strings:",
				"  check-keys: true",
				"  quote-type: single",
				"key-duplicates: disable",
			);

			await check(keys, [
				[4, 1],
				[5, 1],
				[6, 1],
				[7, 1],
				[20, 3],
				[21, 3],
				[23, 2],
				[23, 10],
				[33, 3],
				[37, 3],
				[41, 3],
			]);
		});

		test("double", async () => {
			const check = await conf(
				"quoted-strings:",
				"  check-keys: true",
				"  quote-type: double",
				"key-duplicates: disable",
			);

			await check(keys, [
				[4, 1],
				[8, 1],
				[20, 3],
				[23, 2],
				[33, 3],
			]);
		});
	});

	describe("not required", () => {
		test("any quotes", async () => {
			const check = await conf(
				"quoted-strings:",
				"  check-keys: true",
				"  quote-type: any",
				"  required: false",
				"key-duplicates: disable",
			);

			await check(keys, [
			]);
		});

		test("single quotes", async () => {
			const check = await conf(
				"quoted-strings:",
				"  check-keys: true",
				"  quote-type: single",
				"  required: false",
				"key-duplicates: disable",
			);

			await check(keys, [
				[5, 1],
				[6, 1],
				[7, 1],
				[21, 3],
				[23, 10],
				[37, 3],
				[41, 3],
			]);
		});
	});

	describe("only when needed", () => {
		test("normal", async () => {
			const check = await conf(
				"quoted-strings:",
				"  check-keys: true",
				"  required: only-when-needed",
				"key-duplicates: disable",
			);

			await check(keys, [
				[5, 1],
				[8, 1],
				[21, 3],
				[23, 10],
				[37, 3],
			]);
		});

		test("single quotes", async () => {
			const check = await conf(
				"quoted-strings:",
				"  check-keys: true",
				"  quote-type: single",
				"  required: only-when-needed",
				"key-duplicates: disable",
			);

			await check(keys, [
				[5, 1],
				[6, 1],
				[7, 1],
				[8, 1],
				[21, 3],
				[23, 10],
				[37, 3],
				[41, 3],
			]);
		});

		test("corner cases", async () => {
			const check = await conf(
				"quoted-strings:",
				"  check-keys: true",
				"  required: only-when-needed",
			);

			await check([
				"---",
				"\"\": 2",
				"\"- item\": 3",
				"\"key: value\": 4",
				"\"%H:%M:%S\": 5",
				"\"%wheel ALL=(ALL) NOPASSWD: ALL\": 6",
				"'\"quoted\"': 7",
				"\"'foo' == 'bar'\": 8",
				"\"'Mac' in ansible_facts.product_name\": 9",
				"'foo # bar': 10",
				"",
			], [
			]);

			await check([
				"---",
				"\"\": 2",
				"\"- item\": 3",
				"\"key: value\": 4",
				"\"%H:%M:%S\": 5",
				"\"%wheel ALL=(ALL) NOPASSWD: ALL\": 6",
				"'\"quoted\"': 7",
				"\"'foo' == 'bar'\": 8",
				"\"'Mac' in ansible_facts.product_name\": 9",
				"",
			], [
			]);

			await check([
				"---",
				"---: 2",
				"\"----\": 3",
				"---------: 4",
				"\"----------\": 5",
				":wq: 6",
				"\":cw\": 7",
				"",
			], [
				[3, 1],
				[5, 1],
				[7, 1],
			]);
		});

		test("extras", async () => {
			let check: Awaited<ReturnType<typeof conf>>;

			await assertConfigError(() => conf(
				"quoted-strings:",
				"  check-keys: true",
				"  required: true",
				"  extra-allowed: [^http://]",
			));

			await assertConfigError(() => conf(
				"quoted-strings:",
				"  check-keys: true",
				"  required: true",
				"  extra-required: [^http://]",
			));

			await assertConfigError(() => conf(
				"quoted-strings:",
				"  check-keys: true",
				"  required: false",
				"  extra-allowed: [^http://]",
			));



			check = await conf(
				"quoted-strings:",
				"  check-keys: true",
				"  required: true",
			);

			await check([
				"---",
				"123: 2",
				"\"234\": 3",
				"localhost: 4",
				"\"host.local\": 5",
				"http://localhost: 6",
				"\"http://host.local\": 7",
				"ftp://localhost: 8",
				"\"ftp://host.local\": 9",
				"",
			], [
				[4, 1],
				[6, 1],
				[8, 1],
			]);



			check = await conf(
				"quoted-strings:",
				"  check-keys: true",
				"  required: only-when-needed",
				"  extra-allowed: [^ftp://]",
				"  extra-required: [^http://]",
			);

			await check([
				"---",
				"123: 2",
				"\"234\": 3",
				"localhost: 4",
				"\"host.local\": 5",
				"http://localhost: 6",
				"\"http://host.local\": 7",
				"ftp://localhost: 8",
				"\"ftp://host.local\": 9",
				"",
			], [
				[5, 1],
				[6, 1],
			]);



			check = await conf(
				"quoted-strings:",
				"  check-keys: true",
				"  required: false",
				"  extra-required: [^http://, ^ftp://]",
			);

			await check([
				"---",
				"123: 2",
				"\"234\": 3",
				"localhost: 4",
				"\"host.local\": 5",
				"http://localhost: 6",
				"\"http://host.local\": 7",
				"ftp://localhost: 8",
				"\"ftp://host.local\": 9",
				"",
			], [
				[6, 1],
				[8, 1],
			]);



			check = await conf(
				"quoted-strings:",
				"  check-keys: true",
				"  required: only-when-needed",
				"  extra-allowed: [^ftp://, \";$\", \" \"]",
			);

			await check([
				"---",
				"localhost: 2",
				"\"host.local\": 3",
				"ftp://localhost: 4",
				"\"ftp://host.local\": 5",
				"i=i+1: 6",
				"\"i=i+2\": 7",
				"i=i+3;: 8",
				"\"i=i+4;\": 9",
				"foo1: 10",
				"\"foo2\": 11",
				"foo bar1: 12",
				"\"foo bar2\": 13",
				"",
			], [
				[3, 1],
				[7, 1],
				[11, 1],
			]);
		});
	});

	test("octal values", async () => {
		const check = await conf(
			"quoted-strings:",
			"  check-keys: true",
			"  required: true",
		);

		await check([
			"---",
			"100: 2",
			"0100: 3",
			"0o100: 4",
			"777: 5",
			"0777: 6",
			"0o777: 7",
			"800: 8",
			"0800: 9",
			"0o800: 10",
			"\"0900\": 11",
			"\"0o900\": 12",
			"",
		], [
			[9, 1],
			[10, 1],
		]);
	});

	test("allow quoted quotes", async () => {
		let check: Awaited<ReturnType<typeof conf>>;

		check = await conf(
			"quoted-strings:",
			"  check-keys: true",
			"  quote-type: single",
			"  required: false",
			"  allow-quoted-quotes: false",
		);

		await check([
			"---",
			"\"[barbaz]\": 2",
			"\"[bar'baz]\": 3",
			"",
		], [
			[2, 1],
			[3, 1],
		]);



		check = await conf(
			"quoted-strings:",
			"  check-keys: true",
			"  quote-type: single",
			"  required: false",
			"  allow-quoted-quotes: true",
		);

		await check([
			"---",
			"\"[barbaz]\": 2",
			"\"[bar'baz]\": 3",
			"",
		], [
			[2, 1],
		]);



		check = await conf(
			"quoted-strings:",
			"  check-keys: true",
			"  quote-type: single",
			"  required: true",
			"  allow-quoted-quotes: false",
		);

		await check([
			"---",
			"\"[barbaz]\": 2",
			"\"[bar'baz]\": 3",
			"",
		], [
			[2, 1],
			[3, 1],
		]);



		check = await conf(
			"quoted-strings:",
			"  check-keys: true",
			"  quote-type: single",
			"  required: true",
			"  allow-quoted-quotes: true",
		);

		await check([
			"---",
			"\"[barbaz]\": 2",
			"\"[bar'baz]\": 3",
			"",
		], [
			[2, 1],
		]);



		check = await conf(
			"quoted-strings:",
			"  check-keys: true",
			"  quote-type: single",
			"  required: only-when-needed",
			"  allow-quoted-quotes: false",
		);

		await check([
			"---",
			"\"[barbaz]\": 2",
			"\"[bar'baz]\": 3",
			"",
		], [
			[2, 1],
			[3, 1],
		]);



		check = await conf(
			"quoted-strings:",
			"  check-keys: true",
			"  quote-type: single",
			"  required: only-when-needed",
			"  allow-quoted-quotes: true",
		);

		await check([
			"---",
			"\"[barbaz]\": 2",
			"\"[bar'baz]\": 3",
			"",
		], [
			[2, 1],
		]);



		check = await conf(
			"quoted-strings:",
			"  check-keys: true",
			"  quote-type: double",
			"  required: false",
			"  allow-quoted-quotes: false",
		);

		await check([
			"---",
			"'[barbaz]': 2",
			"'[bar\"baz]': 3",
			"",
		], [
			[2, 1],
			[3, 1],
		]);



		check = await conf(
			"quoted-strings:",
			"  check-keys: true",
			"  quote-type: double",
			"  required: false",
			"  allow-quoted-quotes: true",
		);

		await check([
			"---",
			"'[barbaz]': 2",
			"'[bar\"baz]': 3",
			"",
		], [
			[2, 1],
		]);



		check = await conf(
			"quoted-strings:",
			"  check-keys: true",
			"  quote-type: double",
			"  required: true",
			"  allow-quoted-quotes: false",
		);

		await check([
			"---",
			"'[barbaz]': 2",
			"'[bar\"baz]': 3",
			"",
		], [
			[2, 1],
			[3, 1],
		]);



		check = await conf(
			"quoted-strings:",
			"  check-keys: true",
			"  quote-type: double",
			"  required: true",
			"  allow-quoted-quotes: true",
		);

		await check([
			"---",
			"'[barbaz]': 2",
			"'[bar\"baz]': 3",
			"",
		], [
			[2, 1],
		]);



		check = await conf(
			"quoted-strings:",
			"  check-keys: true",
			"  quote-type: double",
			"  required: only-when-needed",
			"  allow-quoted-quotes: false",
		);

		await check([
			"---",
			"'[barbaz]': 2",
			"'[bar\"baz]': 3",
			"",
		], [
			[2, 1],
			[3, 1],
		]);



		check = await conf(
			"quoted-strings:",
			"  check-keys: true",
			"  quote-type: double",
			"  required: only-when-needed",
			"  allow-quoted-quotes: true",
		);

		await check([
			"---",
			"'[barbaz]': 2",
			"'[bar\"baz]': 3",
			"",
		], [
			[2, 1],
		]);



		check = await conf(
			"quoted-strings:",
			"  check-keys: true",
			"  quote-type: any",
		);

		await check([
			"---",
			"'[barbaz]': 2",
			"'[bar\"baz]': 3",
			"",
		], [
		]);
	});
});
