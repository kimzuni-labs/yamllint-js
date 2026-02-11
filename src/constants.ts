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

import type yaml from "yaml";
import { getDefaultSearchPlaces } from "cosmiconfig";

import pkg from "../package.json";



export const APP = {
	NAME: "yamllint",
	VERSION: pkg.version,
	DESCRIPTION: [
		pkg.description,
		"yamllint does not only check for syntax validity,",
		"but for weirdnesses like key repetition and cosmetic problems",
		"such as lines length, trailing spaces, indentation, etc.",
	].join(" "),
};

export const YAML_OPTIONS: yaml.ParseOptions & yaml.DocumentOptions = {
	version: "1.1",
	uniqueKeys: false,
};

export const CONFIG_SEARCH_PLACES = [
	...getDefaultSearchPlaces("yamllint"),
	".yamllint",
	".yamllint.yaml",
	".yamllint.yml",
];



export type Level = typeof LEVELS[number];
export type Alias = keyof typeof ALIASES;
export const LEVELS = [null, "warning", "error"] as const;
export const ALIASES = {
	off: null,
	warn: "warning",
	err: "error",
	0: null,
	1: "warning",
	2: "error",
} as const satisfies Record<string | number, Level>;
export const PROBLEM_LEVELS = {
	warning: 1,
	error: 2,
};



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
