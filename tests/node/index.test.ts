/*!
 * Copyright (C) 2026 kimzuni
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

import { describe, test, expect, beforeAll } from "vitest";
import { spawnSync } from "node:child_process";
import path from "node:path";



const dirname = path.join(__dirname, "root");

beforeAll(() => {
	spawnSync("npm", ["install", "--prefix", dirname]);
});

describe("Node.js Test Case", () => {
	test("cjs", () => {
		const { status } = spawnSync("node", [path.join(dirname, "index.cjs")]);
		expect(status).toBe(0);
	});
	test("esm", () => {
		const { status } = spawnSync("node", [path.join(dirname, "index.mjs")]);
		expect(status).toBe(0);
	});
});
