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

import os from "node:os";

import { PY_EOL, PY_EOL_END, ASCII } from "./constants";



/**
 * Binary string to buffer
 */
export function B(string: string) {
	return Buffer.from(string, "latin1");
}

/**
 * Equivalent of Python's `str.isascii`.
 *
 * @see https://docs.python.org/3/library/stdtypes.html#str.isascii
 */
export function isASCII(string: string) {
	return ASCII.test(string);
}

/**
 * Equivalent of Python's `str.splitlines`.
 *
 * @see https://docs.python.org/3/library/stdtypes.html#str.splitlines
 */
export function splitlines(string: string) {
	return string.replace(PY_EOL_END, "").split(PY_EOL);
}

/**
 * Equivalent of Python's `bytes.startswith`.
 *
 * @see https://docs.python.org/3/library/stdtypes.html#bytes.startswith
 */
export function bufferStartsWith(buf: Buffer, prefix: Buffer, position = 0) {
	const start = position;
	const end = prefix.length + start;
	if (buf.length < end) return false;
	const subarray = buf.subarray(start, end);
	return Buffer.compare(subarray, prefix) === 0;
}



export const getHomedir = () => process.env.HOME ?? os.homedir();

export const formatErrorMessage = (prefix: string, e: unknown) => `${prefix}${e instanceof Error ? e.message : String(e)}`;
