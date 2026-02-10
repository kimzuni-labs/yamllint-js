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

import fs from "node:fs/promises";
import iconv from "iconv-lite";

import type { AG } from "./types";
import { CODECS } from "./codecs";
import { bufferStartsWith, splitlines, once } from "./utils";



/**
 * Return stream_data’s character encoding
 *
 * Specifically, this function will take a bytes object and return a string
 * that contains the name of one of Python’s built-in codecs [1].
 *
 * The YAML spec says that streams must begin with a BOM or an ASCII
 * character. If stream_data doesn’t begin with either of those, then this
 * function might return the wrong encoding. See chapter 5.2 of the YAML spec
 * for details [2].
 *
 * Before this function was added, yamllint would sometimes decode text files
 * using a non-standard character encoding. It’s possible that there are users
 * out there who still want to use yamllint with non-standard character
 * encodings, so this function includes an override switch for those users. If
 * the YAMLLINT_FILE_ENCODING environment variable is set to "example_codec",
 * then this function will always return "example_codec".
 *
 * [1]: <https://docs.python.org/3/library/codecs.html#standard-encodings>
 * [2]: <https://yaml.org/spec/1.2.2/#52-character-encodings>
 */
export const detectEncoding = (() => {
	const warning = once(() => {
		console.warn(
			"YAMLLINT_FILE_ENCODING is meant for temporary",
			"workarounds. It may be removed in a future version of",
			"yamllint.",
		);
	});

	return function detectEncoding(streamData: Buffer) {
		if (process.env.YAMLLINT_FILE_ENCODING) {
			warning();
			return process.env.YAMLLINT_FILE_ENCODING;
		}
		if (bufferStartsWith(streamData, CODECS.BOM_UTF32_BE)) return "utf_32";
		if (bufferStartsWith(streamData, CODECS.UTF32_ZERO) && streamData.length >= 4) return "utf_32_be";
		if (bufferStartsWith(streamData, CODECS.BOM_UTF32_LE)) return "utf_32";
		if (bufferStartsWith(streamData, CODECS.UTF32_ZERO, 1)) return "utf_32_le";
		if (bufferStartsWith(streamData, CODECS.BOM_UTF16_BE)) return "utf_16";
		if (bufferStartsWith(streamData, CODECS.UTF16_ZERO) && streamData.length >= 2) return "utf_16_be";
		if (bufferStartsWith(streamData, CODECS.BOM_UTF16_LE)) return "utf_16";
		if (bufferStartsWith(streamData, CODECS.UTF16_ZERO, 1)) return "utf_16_le";

		/*
		 * iconv-lite is not support utf_8_sig.
		 * Use the `addBOM`/`stripBOM` option instead.
		 */
		if (bufferStartsWith(streamData, CODECS.BOM_UTF8)) return "utf_8";
		return "utf_8";
	};
})();



export function autoDecode(streamData: Buffer) {
	const encoding = detectEncoding(streamData);
	return iconv.decode(streamData, encoding, { stripBOM: true });
}



/**
 * Autodecodes files and yields their lines.
 */
export async function* linesInFiles(paths: string[]): AG<string> {
	for (const path of paths) {
		const text = autoDecode(await fs.readFile(path));
		yield* splitlines(text);
	}
}
