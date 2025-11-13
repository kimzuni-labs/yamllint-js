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

/**
 * @file
 *
 * Use this rule to force the type of new line characters.
 *
 * .. rubric:: Options
 *
 * * Set ``type`` to ``unix`` to enforce UNIX-typed new line characters (``\\n``),
 *   set ``type`` to ``dos`` to enforce DOS-typed new line characters
 *   (``\\r\\n``), or set ``type`` to ``platform`` to infer the type from the
 *   system running yamllint (``\\n`` on POSIX / UNIX / Linux / Mac OS systems or
 *   ``\\r\\n`` on DOS / Windows systems).
 *
 * .. rubric:: Default values (when enabled)
 *
 * .. code-block:: yaml
 *
 *  rules:
 *    new-lines:
 *      type: unix
 */

import { EOL } from "node:os";
import z from "zod";

import { LintProblem } from "../linter";

import type { LineCheckProps } from "./types";



export const ID = "new-lines";
export const TYPE = "line";
export const CONF = z.object({
	type: z.enum(["unix", "dos", "platform"]),
});
export const DEFAULT: Conf = {
	type: "unix",
};

export type Conf = z.infer<typeof CONF>;



export function* check({ conf, line }: LineCheckProps<Conf>) {
	let newlineChar: string;
	switch (conf.type) {
		case "unix":
			newlineChar = "\n";
			break;
		case "dos":
			newlineChar = "\r\n";
			break;
		default:
			newlineChar = EOL;
			break;
	}

	if (line.start === 0 && line.buffer.length > line.end) {
		if (line.buffer.slice(line.end, line.end + newlineChar.length) !== newlineChar) {
			const c = JSON.stringify(newlineChar).slice(1, -1);
			yield new LintProblem(
				1,
				line.end - line.start + 1,
				`wrong new line character: expected ${c}`,
			);
		}
	}
}
