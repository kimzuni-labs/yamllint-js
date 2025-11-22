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

import type { Rule } from "../types";

import * as braces from "./braces";



export const _RULES = ([
	braces,
] as Rule[]).reduce<Partial<Record<string, Rule>>>((acc, rule) => ({ ...acc, [rule.ID]: rule }), {});



export function get(id: string) {
	const rule = _RULES[id];
	if (!rule) {
		throw new Error(`no such rule: "${id}"`);
	}

	return rule;
}
