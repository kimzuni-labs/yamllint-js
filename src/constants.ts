/*
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

import { B } from "./utils";



/**
 * delimiter of `str.splitlines` in Python.
 *
 * @see https://docs.python.org/3/library/stdtypes.html#str.splitlines
 */
// eslint-disable-next-line no-control-regex
export const PY_EOL = /\r\n|\r|\n|\v|\f|\x1c|\x1d|\x1e|\x85|\u2028|\u2029/;

/**
 * @example
 *
 * ```typescript
 * "a\r\nbc\r\n".replace(PY_EOL_END, "") === "a\r\nbc"
 * ```
 */
export const PY_EOL_END = new RegExp(`(${PY_EOL.source})$`);

// eslint-disable-next-line no-control-regex
export const ASCII = /^[\x00-\x7F]*$/;



/**
 * Equivalent of Python's `codecs`.
 *
 * @see https://docs.python.org/3/library/codecs.html#codecs.BOM
 */
export const CODECS = {
	BOM_UTF8: B("\xef\xbb\xbf"),
	BOM_UTF16_BE: B("\xfe\xff"),
	BOM_UTF16_LE: B("\xff\xfe"),
	BOM_UTF32_BE: B("\x00\x00\xfe\xff"),
	BOM_UTF32_LE: B("\xff\xfe\x00\x00"),
	UTF16_ZERO: B("\x00"),
	UTF32_ZERO: B("\x00\x00\x00"),
};
