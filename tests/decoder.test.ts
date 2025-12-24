/*
 * Copyright (C) 2023–2025 Jason Yundt
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
import iconv from "iconv-lite";

import { B } from "../src/utils";
import * as decoder from "../src/decoder";

import {
	UTF_CODECS,
	encode,
	isTestCodec,
	iconvEquivalentOfTestCodec,
	usesBom,
	encodingDetectable,
	tempWorkspace,
	tempWorkspaceWithFilesInManyCodecs,
	envWorkspace,
	consoleWorkspace,
} from "./common";



interface PreEncodedTestStringInfo {
	inputBytes: Buffer;
	codecForInputBytes: string | undefined;
	expectedOutputStr: string;
}

const toTestInfoData = (
	input: string,
	codec: string | undefined,
	output: string,
): PreEncodedTestStringInfo => ({
	inputBytes: B(input),
	codecForInputBytes: codec,
	expectedOutputStr: output,
});

const PRE_ENCODED_TEST_STRING_INFOS: PreEncodedTestStringInfo[] = [
	toTestInfoData(
		"",
		undefined,
		"",
	),
	toTestInfoData(
		"\x00\x00\x00|",
		"utf_32_be",
		"|",
	),
	toTestInfoData(
		"\x00\x00\xfe\xff\x00\x00\x00|",
		"utf_32", // BE with BOM
		"|",
	),
	toTestInfoData(
		"|\x00\x00\x00",
		"utf_32_le",
		"|",
	),
	toTestInfoData(
		"\xff\xfe\x00\x00|\x00\x00\x00",
		"utf_32", // LE with BOM
		"|",
	),
	toTestInfoData(
		"\x00|",
		"utf_16_be",
		"|",
	),
	toTestInfoData(
		"\xfe\xff\x00|",
		"utf_16", // BE with BOM
		"|",
	),
	toTestInfoData(
		"|\x00",
		"utf_16_le",
		"|",
	),
	toTestInfoData(
		"\xff\xfe|\x00",
		"utf_16", // LE with BOM
		"|",
	),
	toTestInfoData(
		"|",
		"utf_8",
		"|",
	),
	toTestInfoData(
		"\xef\xbb\xbf|",
		"utf_8", // with BOM
		"|",
	),

	// A string that starts with an ASCII character
	toTestInfoData(
		"\x00\x00\x00W\x00\x00\x00h\x00\x00\x00a\x00\x00\x00t\x00\x00 \x19\x00\x00\x00s\x00\x00\x00 \x00\x00\x00u\x00\x00\x00p\x00\x00\x00?",
		"utf_32_be",
		"What’s up?",
	),
	toTestInfoData(
		"\x00\x00\xfe\xff\x00\x00\x00W\x00\x00\x00h\x00\x00\x00a\x00\x00\x00t\x00\x00 \x19\x00\x00\x00s\x00\x00\x00 \x00\x00\x00u\x00\x00\x00p\x00\x00\x00?",
		"utf_32", // BE with BOM
		"What’s up?",
	),
	toTestInfoData(
		"W\x00\x00\x00h\x00\x00\x00a\x00\x00\x00t\x00\x00\x00\x19 \x00\x00s\x00\x00\x00 \x00\x00\x00u\x00\x00\x00p\x00\x00\x00?\x00\x00\x00",
		"utf_32_le",
		"What’s up?",
	),
	toTestInfoData(
		"\xff\xfe\x00\x00W\x00\x00\x00h\x00\x00\x00a\x00\x00\x00t\x00\x00\x00\x19 \x00\x00s\x00\x00\x00 \x00\x00\x00u\x00\x00\x00p\x00\x00\x00?\x00\x00\x00",
		"utf_32", // LE with BOM
		"What’s up?",
	),
	toTestInfoData(
		"\x00W\x00h\x00a\x00t \x19\x00s\x00 \x00u\x00p\x00?",
		"utf_16_be",
		"What’s up?",
	),
	toTestInfoData(
		"\xfe\xff\x00W\x00h\x00a\x00t \x19\x00s\x00 \x00u\x00p\x00?",
		"utf_16", // BE with BOM
		"What’s up?",
	),
	toTestInfoData(
		"W\x00h\x00a\x00t\x00\x19 s\x00 \x00u\x00p\x00?\x00",
		"utf_16_le",
		"What’s up?",
	),
	toTestInfoData(
		"\xff\xfeW\x00h\x00a\x00t\x00\x19 s\x00 \x00u\x00p\x00?\x00",
		"utf_16", // LE with BOM
		"What’s up?",
	),
	toTestInfoData(
		"What\xe2\x80\x99s up?",
		"utf_8",
		"What’s up?",
	),
	toTestInfoData(
		"\xef\xbb\xbfWhat\xe2\x80\x99s up?",
		"utf_8", // with BOM
		"What’s up?",
	),

	// A single non-ASCII character
	toTestInfoData(
		"\x00\x00\xfe\xff\x00\x01\xf4;",
		"utf_32", // BE with BOM
		"🐻",
	),
	toTestInfoData(
		"\xff\xfe\x00\x00;\xf4\x01\x00",
		"utf_32", // LE with BOM
		"🐻",
	),
	toTestInfoData(
		"\xfe\xff\xd8=\xdc;",
		"utf_16", // BE with BOM
		"🐻",
	),
	toTestInfoData(
		"\xff\xfe=\xd8;\xdc",
		"utf_16", // LE with BOM
		"🐻",
	),
	toTestInfoData(
		"\xef\xbb\xbf\xf0\x9f\x90\xbb",
		"utf_8", // with BOM
		"🐻",
	),

	// A string that starts with a non-ASCII character
	toTestInfoData(
		"\x00\x00\xfe\xff\x00\x00\x00\xc7\x00\x00\x00a\x00\x00\x00 \x00\x00\x00v\x00\x00\x00a\x00\x00\x00?",
		"utf_32", // BE with BOM
		"Ça va?",
	),
	toTestInfoData(
		"\xff\xfe\x00\x00\xc7\x00\x00\x00a\x00\x00\x00 \x00\x00\x00v\x00\x00\x00a\x00\x00\x00?\x00\x00\x00",
		"utf_32", // LE with BOM
		"Ça va?",
	),
	toTestInfoData(
		"\xfe\xff\x00\xc7\x00a\x00 \x00v\x00a\x00?",
		"utf_16", // BE with BOM
		"Ça va?",
	),
	toTestInfoData(
		"\xff\xfe\xc7\x00a\x00 \x00v\x00a\x00?\x00",
		"utf_16", // LE with BOM
		"Ça va?",
	),
	toTestInfoData(
		"\xef\xbb\xbf\xc3\x87a va?",
		"utf_8", // with BOM
		"Ça va?",
	),
];

const TEST_STRINGS_TO_ENCODE_AT_RUNTIME = [
	"",
	"y",
	"yaml",
	"🇾⁠🇦⁠🇲⁠🇱⁠❗",
];



describe("Encoding Stuff From Common Test Case", () => {
	test("test codecs and utf codecs", () => {
		for (const string of TEST_STRINGS_TO_ENCODE_AT_RUNTIME) {
			for (const codec of UTF_CODECS) {
				assert.equal(
					string,
					iconv.decode(encode(string, codec), codec.replace(/_sig/, "")),
					`${codec} failed to correctly encode then decode ${string}.`,
				);
			}
		}
	});

	test("is test codec", () => {
		assert.equal(isTestCodec("utf_32"), false);
		assert.equal(isTestCodec("utf_32_be"), false);
		assert.equal(isTestCodec("utf_32_be_sig"), true);
		assert.equal(isTestCodec("utf_32_le"), false);
		assert.equal(isTestCodec("utf_32_le_sig"), true);

		assert.equal(isTestCodec("utf_16"), false);
		assert.equal(isTestCodec("utf_16_be"), false);
		assert.equal(isTestCodec("utf_16_be_sig"), true);
		assert.equal(isTestCodec("utf_16_le"), false);
		assert.equal(isTestCodec("utf_16_le_sig"), true);

		assert.equal(isTestCodec("utf_8"), false);
		assert.equal(isTestCodec("utf_8_be"), false);
	});

	test("iconv equivalent of test codec", () => {
		assert.equal("utf_32", iconvEquivalentOfTestCodec("utf_32_be_sig"));
		assert.equal("utf_32", iconvEquivalentOfTestCodec("utf_32_le_sig"));
		assert.equal("utf_16", iconvEquivalentOfTestCodec("utf_16_be_sig"));
		assert.equal("utf_16", iconvEquivalentOfTestCodec("utf_16_le_sig"));
	});

	test("uses bom", () => {
		assert.equal(usesBom("utf_32"), true);
		assert.equal(usesBom("utf_32_be"), false);
		assert.equal(usesBom("utf_32_be_sig"), true);
		assert.equal(usesBom("utf_32_le"), false);
		assert.equal(usesBom("utf_32_le_sig"), true);

		assert.equal(usesBom("utf_16"), true);
		assert.equal(usesBom("utf_16_be"), false);
		assert.equal(usesBom("utf_16_be_sig"), true);
		assert.equal(usesBom("utf_16_le"), false);
		assert.equal(usesBom("utf_16_le_sig"), true);

		assert.equal(usesBom("utf_8"), false);
		assert.equal(usesBom("utf_8_sig"), true);
	});

	test("encoding detectable", () => {
		// No BOM + nothing
		assert.equal(encodingDetectable("", "utf_32_be"), false);
		assert.equal(encodingDetectable("", "utf_32_le"), false);

		assert.equal(encodingDetectable("", "utf_16_be"), false);
		assert.equal(encodingDetectable("", "utf_16_le"), false);

		assert.equal(encodingDetectable("", "utf_8"), false);

		// BOM + nothing
		assert.equal(encodingDetectable("", "utf_32"), true);
		assert.equal(encodingDetectable("", "utf_32_be_sig"), true);
		assert.equal(encodingDetectable("", "utf_32_le_sig"), true);

		assert.equal(encodingDetectable("", "utf_16"), true);
		assert.equal(encodingDetectable("", "utf_16_be_sig"), true);
		assert.equal(encodingDetectable("", "utf_16_le_sig"), true);

		assert.equal(encodingDetectable("", "utf_8_sig"), true);

		// No BOM + non-ASCII
		assert.equal(encodingDetectable("Ⓝⓔ", "utf_32_be"), false);
		assert.equal(encodingDetectable("ⓥⓔ", "utf_32_le"), false);

		assert.equal(encodingDetectable("ⓡ ", "utf_16_be"), false);
		assert.equal(encodingDetectable("ⓖⓞ", "utf_16_le"), false);

		assert.equal(encodingDetectable("ⓝⓝ", "utf_8"), false);

		// No BOM + ASCII
		assert.equal(encodingDetectable("a ", "utf_32_be"), true);
		assert.equal(encodingDetectable("gi", "utf_32_le"), true);

		assert.equal(encodingDetectable("ve", "utf_16_be"), true);
		assert.equal(encodingDetectable(" y", "utf_16_le"), true);

		assert.equal(encodingDetectable("ou", "utf_8"), true);

		// BOM + non-ASCII
		assert.equal(encodingDetectable("␣ⓤ", "utf_32"), true);
		assert.equal(encodingDetectable("ⓟ␤", "utf_32_be_sig"), true);
		assert.equal(encodingDetectable("Ⓝⓔ", "utf_32_le_sig"), true);

		assert.equal(encodingDetectable("ⓥⓔ", "utf_16"), true);
		assert.equal(encodingDetectable("ⓡ␣", "utf_16_be_sig"), true);
		assert.equal(encodingDetectable("ⓖⓞ", "utf_16_le_sig"), true);

		assert.equal(encodingDetectable("ⓝⓝ", "utf_8_sig"), true);

		// BOM + ASCII
		assert.equal(encodingDetectable("a ", "utf_32"), true);
		assert.equal(encodingDetectable("le", "utf_32_be_sig"), true);
		assert.equal(encodingDetectable("t ", "utf_32_le_sig"), true);

		assert.equal(encodingDetectable("yo", "utf_16"), true);
		assert.equal(encodingDetectable("u ", "utf_16_be_sig"), true);
		assert.equal(encodingDetectable("do", "utf_16_le_sig"), true);

		assert.equal(encodingDetectable("wn", "utf_8_sig"), true);
	});
});



describe("Decoder Test Case", () => {
	function detectEncodingTestHelper({
		inputBytes,
		codecForInputBytes: expectedCodec,
	}: Omit<PreEncodedTestStringInfo, "expectedOutputStr">) {
		const actualCodec = decoder.detectEncoding(inputBytes);
		if (expectedCodec) {
			assert.equal(
				expectedCodec,
				actualCodec,
				`${inputBytes.toString()} was encoded with ${expectedCodec}, but detectEncoding() returned ${actualCodec}.`,
			);
		}

		assert.equal(
			isTestCodec(actualCodec),
			false,
			`detectEncoding("${inputBytes.toString()}") returned a codec that doesn't exists.`,
		);
	}

	test("detect encoding with pre encoded strings", () => {
		for (const pre_encoded_test_string_info of PRE_ENCODED_TEST_STRING_INFOS) {
			detectEncodingTestHelper(pre_encoded_test_string_info);
		}
	});

	test("detect encoding with strings encoded at runtime", () => {
		for (const string of TEST_STRINGS_TO_ENCODE_AT_RUNTIME) {
			for (const codec of UTF_CODECS) {
				let expectedCodec: string | undefined;
				if (!usesBom(codec) && string.length === 0) {
					expectedCodec = "utf_8";
				} else if (!encodingDetectable(string, codec)) {
					expectedCodec = undefined;
				} else if (isTestCodec(codec)) {
					expectedCodec = iconvEquivalentOfTestCodec(codec);
				} else {
					expectedCodec = codec;
				}
				detectEncodingTestHelper({
					inputBytes: encode(string, codec),
					codecForInputBytes: expectedCodec,
				});
			}
		}
	});



	test("detect encoding with env var override", async () => {
		// These three encodings were chosen randomly.
		const NONSTANDARD_ENCODINGS = ["iso8859_6", "iso8859_11", "euc_jis_2004"];
		const RANDOM_BYTES = B("\x90Jg\xd9rS\x95\xd6[\x1d\x8b\xc4Ir\x0fC");

		const { warn } = await consoleWorkspace([
			"warn",
		], async () => {
			for (const YAMLLINT_FILE_ENCODING of NONSTANDARD_ENCODINGS) {
				await envWorkspace({ YAMLLINT_FILE_ENCODING }, () => {
					assert.equal(decoder.detectEncoding(RANDOM_BYTES), YAMLLINT_FILE_ENCODING);
				});
			}
		});
		assert.ok(warn);
	});



	function autoDecodeTestHelper({
		inputBytes,
		codecForInputBytes,
		expectedOutputStr: expectedString,
	}: PreEncodedTestStringInfo) {
		const doesAutoDetectEncodingsReturnValueMatter = (
			codecForInputBytes !== undefined
			&& (
				encodingDetectable(expectedString, codecForInputBytes)
				|| inputBytes.length === 0
			)
		);
		if (doesAutoDetectEncodingsReturnValueMatter) {
			const actualOutput = decoder.autoDecode(inputBytes);
			assert.equal(
				expectedString,
				actualOutput,
				`auto_decode("${inputBytes.toString()}") returned the wrong value.`,
			);
		} else {
			decoder.autoDecode(inputBytes);
		}
	}

	test("auto decode with pre encoded strings", () => {
		for (const pre_encoded_test_string_info of PRE_ENCODED_TEST_STRING_INFOS) {
			autoDecodeTestHelper(pre_encoded_test_string_info);
		}
	});

	test("auto decode with strings encoded at runtime", () => {
		let atLeastOneDecodeError = false;
		for (const string of TEST_STRINGS_TO_ENCODE_AT_RUNTIME) {
			for (const codec of UTF_CODECS) {
				try {
					autoDecodeTestHelper({
						inputBytes: encode(string, codec),
						codecForInputBytes: codec,
						expectedOutputStr: string,
					});
				} catch {
					atLeastOneDecodeError = true;
				}
			}
		}

		assert.equal(
			atLeastOneDecodeError,
			false,
			"Some of the TEST_STRINGS_TO_ENCODE_AT_RUNTIME triggered a decoding error.",
		);
	});



	async function performLinesInFileTest(strings: string[]) {
		const workspace = tempWorkspaceWithFilesInManyCodecs("{}", strings);
		await tempWorkspace(workspace, async () => {
			const filepaths = Object.keys(workspace);
			for (const filepath of filepaths) {
				const gen = decoder.linesInFiles([filepath]);
				const lines = [];
				for await (const line of gen) lines.push(line);
				assert.deepEqual(lines, strings);
			}
		});
	}

	test("lines in file", async () => {
		await performLinesInFileTest([
			"YAML",
			"ⓎⒶⓂⓁ",
			"🅨🅐🅜🅛",
			"ＹＡＭＬ",
		]);
		await performLinesInFileTest([
			"𝐘𝐀𝐌𝐋",
			"𝖄𝕬𝕸𝕷",
			"𝒀𝑨𝑴𝑳",
			"𝓨𝓐𝓜𝓛",
		]);
	});
});
