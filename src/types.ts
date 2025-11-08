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

import type { Level, Alias } from "./constants";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Token } from "./parser";



export {
	Level,
	Alias,
};

export type AllLevel = Level | Alias;



/**
 * Generator with `undefined` as the return type.
 * Use this to avoid `void` return inference issues.
 */
export type G<T, TReturn = undefined, TNext = unknown> = Generator<T, TReturn, TNext>;

/**
 * AsyncGenerator with `undefined` as the return type.
 * Use this to avoid `void` return inference issues.
 */
export type AG<T, TReturn = undefined, TNext = unknown> = AsyncGenerator<T, TReturn, TNext>;



export interface Mark {
	line: number;
	column: number;
	pointer: number;
}

export interface ScalarAdditionalData {
	isKey?: boolean;
	isValue?: boolean;
}

export interface AdditionalData extends ScalarAdditionalData {
	buffer: string;
	startMark: Mark;
	endMark: Mark;
}

/**
 * {@link Token.ignoreTypes | Some types} are not included in this.
 */
export type TokenData = yaml.CST.Token;

export type ParentTokenData = Exclude<
	yaml.CST.Token,
	| yaml.CST.SourceToken
	| yaml.CST.ErrorToken
>;
