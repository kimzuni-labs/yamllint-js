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

import type { Rule } from "./types";

import * as anchors from "./anchors";
import * as braces from "./braces";
import * as brackets from "./brackets";
import * as colons from "./colons";
import * as commas from "./commas";
import * as commentsIndentation from "./comments_indentation";
import * as comments from "./comments";
import * as documentEnd from "./document_end";
import * as documentStart from "./document_start";
import * as emptyLines from "./empty_lines";
import * as emptyValues from "./empty_values";
import * as floatValues from "./float_values";
import * as hyphens from "./hyphens";
import * as indentation from "./indentation";
import * as keyDuplicates from "./key_duplicates";
import * as keyOrdering from "./key_ordering";
import * as lineLength from "./line_length";
import * as newLineAtEndOfFile from "./new_line_at_end_of_file";
import * as newLines from "./new_lines";
import * as octalValues from "./octal_values";
import * as quotedStrings from "./quoted_strings";
import * as trailingSpaces from "./trailing_spaces";
import * as truthy from "./truthy";



export const _rules = {
	[anchors.ID]: anchors,
	[braces.ID]: braces,
	[brackets.ID]: brackets,
	[colons.ID]: colons,
	[commas.ID]: commas,
	[commentsIndentation.ID]: commentsIndentation,
	[comments.ID]: comments,
	[documentEnd.ID]: documentEnd,
	[documentStart.ID]: documentStart,
	[emptyLines.ID]: emptyLines,
	[emptyValues.ID]: emptyValues,
	[floatValues.ID]: floatValues,
	[hyphens.ID]: hyphens,
	[indentation.ID]: indentation,
	[keyDuplicates.ID]: keyDuplicates,
	[keyOrdering.ID]: keyOrdering,
	[lineLength.ID]: lineLength,
	[newLineAtEndOfFile.ID]: newLineAtEndOfFile,
	[newLines.ID]: newLines,
	[octalValues.ID]: octalValues,
	[quotedStrings.ID]: quotedStrings,
	[trailingSpaces.ID]: trailingSpaces,
	[truthy.ID]: truthy,
} as const;

export type RuleId = keyof typeof _rules;
export const _RULES = { ..._rules } as unknown as Partial<Record<string, Rule>>;



export function get(id: string) {
	const rule = _RULES[id];
	if (!rule) {
		throw new Error(`no such rule: "${id}"`);
	}

	return rule;
}
