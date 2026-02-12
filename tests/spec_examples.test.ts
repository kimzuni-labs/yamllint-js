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

import { describe, test, expect } from "vitest";
import path from "node:path";
import fs from "node:fs/promises";

import { ruleTestCase, type CheckProblem } from "./common";



/**
 * This file checks examples from YAML 1.2 specification [1] against yamllint.
 *
 * [1]: http://www.yaml.org/spec/1.2/spec.html
 *
 * Example files generated with:
 *
 *     from bs4 import BeautifulSoup
 *     with open('spec.html', encoding='iso-8859-1') as f:
 *         soup = BeautifulSoup(f, 'lxml')
 *         for ex in soup.find_all('div', class_='example'):
 *             title = ex.find('p', class_='title').find('b').get_text()
 *             id = '-'.join(title.split('\xa0')[:2])[:-1].lower()
 *             span = ex.find('span', class_='database')
 *             for br in span.find_all("br"):
 *                 br.replace_with("\n")
 *             text = text.replace('\u2193', '')    # downwards arrow
 *             text = text.replace('\u21d3', '')    # double downwards arrow
 *             text = text.replace('\u00b7', ' ')   # visible space
 *             text = text.replace('\u21d4', '')    # byte order mark
 *             text = text.replace('\u2192', '\t')  # right arrow
 *             text = text.replace('\u00b0', '')    # empty scalar
 *             with open(f'tests/yaml-1.2-spec-examples/{id}', 'w',
 *                       encoding='utf-8') as g:
 *                 g.write(text)
 */

const conf = {
	general: [
		"document-start: disable",
		"comments: {min-spaces-from-content: 1}",
		"braces: {min-spaces-inside: 1, max-spaces-inside: 1}",
		"brackets: {min-spaces-inside: 1, max-spaces-inside: 1}",
		"",
	],
	overrides: {
		"example-2.2": [
			"colons: {max-spaces-after: 2}",
		],
		"example-2.4": [
			"colons: {max-spaces-after: 3}",
		],
		"example-2.5": [
			"empty-lines: {max-end: 2}",
			"brackets: {min-spaces-inside: 0, max-spaces-inside: 2}",
			"commas: {max-spaces-before: -1}",
		],
		"example-2.6": [
			"braces: {min-spaces-inside: 0, max-spaces-inside: 0}",
			"indentation: disable",
		],
		"example-2.12": [
			"empty-lines: {max-end: 1}",
			"colons: {max-spaces-before: -1}",
		],
		"example-2.16": [
			"empty-lines: {max-end: 1}",
		],
		"example-2.18": [
			"empty-lines: {max-end: 1}",
		],
		"example-2.19": [
			"empty-lines: {max-end: 1}",
		],
		"example-2.23": [
			"empty-lines: {max-end: 1}",
		],
		"example-2.24": [
			"braces: {min-spaces-inside: 0, max-spaces-inside: 1}",
			"comments-indentation: disable",
		],
		"example-2.27": [
			"colons: {max-spaces-before: -1}",
			"comments: {require-starting-space: false}",
		],
		"example-2.28": [
			"empty-lines: {max-end: 3}",
		],

		"example-5.3": [
			"indentation: {indent-sequences: false}",
			"colons: {max-spaces-before: 1}",
		],

		"example-6.1": [
			"comments-indentation: disable",
			"trailing-spaces: disable",
			"indentation: disable",
		],
		"example-6.2": [
			"hyphens: {max-spaces-after: 2}",
		],
		"example-6.3": [
			"colons: {max-spaces-after: 2}",
		],
		"example-6.4": [
			"trailing-spaces: disable",
		],
		"example-6.5": [
			"trailing-spaces: disable",
		],
		"example-6.6": [
			"trailing-spaces: disable",
		],
		"example-6.7": [
			"trailing-spaces: disable",
		],
		"example-6.8": [
			"trailing-spaces: disable",
		],
		"example-6.10": [
			"empty-lines: {max-end: 2}",
			"trailing-spaces: disable",
			"comments-indentation: disable",
		],
		"example-6.11": [
			"empty-lines: {max-end: 1}",
			"comments-indentation: disable",
		],
		"example-6.12": [
			"comments-indentation: disable",
			"indentation: disable",
		],
		"example-6.13": [
			"comments-indentation: disable",
		],
		"example-6.14": [
			"comments-indentation: disable",
		],
		"example-6.23": [
			"colons: {max-spaces-before: 1}",
		],
		"example-6.24": [
			"colons: {max-spaces-before: 1}",
		],

		"example-7.2": [
			"colons: {max-spaces-before: 1}",
			"indentation: disable",
		],
		"example-7.3": [
			"colons: {max-spaces-before: 1}",
			"indentation: disable",
		],
		"example-7.4": [
			"colons: {max-spaces-before: 1}",
			"indentation: disable",
		],
		"example-7.5": [
			"trailing-spaces: disable",
		],
		"example-7.6": [
			"trailing-spaces: disable",
		],
		"example-7.7": [
			"indentation: disable",
		],
		"example-7.8": [
			"colons: {max-spaces-before: 1}",
			"indentation: disable",
		],
		"example-7.9": [
			"trailing-spaces: disable",
		],
		"example-7.10": [
			"indentation: disable",
		],
		"example-7.11": [
			"colons: {max-spaces-before: 1}",
			"indentation: disable",
		],
		"example-7.12": [
			"trailing-spaces: disable",
		],
		"example-7.13": [
			"brackets: {min-spaces-inside: 0, max-spaces-inside: 1}",
			"commas: {max-spaces-before: 1, min-spaces-after: 0}",
		],
		"example-7.14": [
			"indentation: disable",
		],
		"example-7.15": [
			"braces: {min-spaces-inside: 0, max-spaces-inside: 1}",
			"commas: {max-spaces-before: 1, min-spaces-after: 0}",
			"colons: {max-spaces-before: 1}",
		],
		"example-7.16": [
			"indentation: disable",
		],
		"example-7.17": [
			"colons: {max-spaces-before: 1}",
			"indentation: disable",
		],
		"example-7.18": [
			"indentation: disable",
		],
		"example-7.19": [
			"indentation: disable",
		],
		"example-7.20": [
			"colons: {max-spaces-before: 1}",
			"indentation: disable",
		],
		"example-7.21": [
			"braces: {min-spaces-inside: 0}",
			"colons: {max-spaces-before: 1}",
			"indentation: disable",
		],
		"example-7.22": [
			"indentation: disable",
		],

		"example-8.1": [
			"empty-lines: {max-end: 1}",
			"indentation: disable",
		],
		"example-8.2": [
			"trailing-spaces: disable",
			"indentation: disable",
		],
		"example-8.3": [
			"trailing-spaces: disable",
			"indentation: disable",
		],
		"example-8.5": [
			"comments-indentation: disable",
			"trailing-spaces: disable",
		],
		"example-8.6": [
			"empty-lines: {max-end: 1}",
		],
		"example-8.7": [
			"empty-lines: {max-end: 1}",
		],
		"example-8.8": [
			"comments-indentation: disable",
			"trailing-spaces: disable",
		],
		"example-8.9": [
			"empty-lines: {max-end: 1}",
		],
		"example-8.14": [
			"colons: {max-spaces-before: 1}",
		],
		"example-8.16": [
			"indentation: {spaces: 1}",
		],
		"example-8.17": [
			"indentation: disable",
		],
		"example-8.18": [
			"indentation: disable",
		],
		"example-8.20": [
			"indentation: {indent-sequences: false}",
			"colons: {max-spaces-before: 1}",
		],
		"example-8.21": [
			"indentation: disable",
		],
		"example-8.22": [
			"indentation: disable",
		],

		"example-9.4": [
			"colons: {max-spaces-before: 1}",
		],

		"example-10.1": [
			"colons: {max-spaces-before: 2}",
		],
		"example-10.2": [
			"indentation: {indent-sequences: false}",
		],
		"example-10.8": [
			"truthy: disable",
		],
		"example-10.9": [
			"truthy: disable",
		],
	} as Record<string, string[] | undefined>,
	syntaxErrors: {
		"example-5.10": [
			[1, 16],
			[2, 15],
		],
		"example-5.13": [
			[4, 1],
		],
		"example-5.14": [
			[2, 4],
			[3, 3],
		],

		"example-6.15": [
			[3, 1],
		],
		"example-6.17": [
			[3, 1],
		],
		"example-6.25": [
			[1, 3],
		],
		"example-6.27": [
			[3, 3],
			[4, 3],
		],

		"example-7.22": [
			[1, 3],
		],

		"example-8.3": [
			[3, 2],
			[6, 1],
			[8, 1],
		],
	} as Record<string, CheckProblem[] | undefined>,
};



const dirname = path.join(import.meta.dirname, "yaml-1.2-spec-examples");
const files = await fs.readdir(dirname);
expect.assert(files.length === 132);



const genCheck = ruleTestCase("syntax");
async function genTest(buffer: string, config: string[], errors: CheckProblem[]) {
	const check = await genCheck(...config);
	return check([buffer], errors);
}



describe("Specification Test Case", () => {
	for (const file of files) {
		test(file, async () => {
			const filepath = path.join(dirname, file);
			const config = conf.general.concat(conf.overrides[file] ?? []);
			const errors = conf.syntaxErrors[file] ?? [];

			await fs.readFile(filepath)
				.then(x => x.toString())
				.then(x => genTest(x, config, errors));
		});
	}
});
