/*
 * Copyright (C) 2017 Adrien Vergé
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

/* eslint-disable @typescript-eslint/no-floating-promises */

import assert from "node:assert/strict";
import { describe, test, before, after } from "node:test";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import * as tsdown from "tsdown";

import { APP } from "../src/constants";
import { splitlines } from "../src/utils";

import {
	buildTempWorkspace,
	type BuildTempWorkspaceReturnType,
} from "./common";



const dist = path.join(process.cwd(), await fs.mkdtemp("dist-"));
const cli = path.join(dist, "main.mjs");

function run(...args: string[]) {
	return new Promise<{
		returncode: number | null;
		output: string;
	}>((resolve) => {
		const env = { ...process.env };
		delete env.GITHUB_ACTIONS;
		delete env.GITHUB_WORKFLOW;

		const child = spawn(process.execPath, [cli, ...args], {
			stdio: "pipe",
			env,
		});

		let output = "";
		const writeOutput = (data: unknown) => {
			output += String(data);
		};

		child.stdout.on("data", writeOutput);
		child.stderr.on("data", writeOutput);
		child.once("error", (err) => {
			resolve({ returncode: 1, output: output + String(err) });
		});
		child.once("exit", (returncode) => {
			resolve({ returncode, output });
		});
	});
}

const build = () => tsdown.build({
	config: false,
	clean: true,
	dts: false,
	entry: "./src/main.ts",
	outDir: dist,
	copy: "src/conf",
	format: "esm",
	logLevel: "silent",
});



describe("Module Test Case", () => {
	let resolve: BuildTempWorkspaceReturnType["resolve"];
	let cleanup: BuildTempWorkspaceReturnType["cleanup"] = async () => {
		// pass
	};
	after(() => Promise.all([
		cleanup(),
		fs.rm(dist, { recursive: true }),
	]));
	before(async () => {
		const temp = await buildTempWorkspace({
			// file with only one warning
			"warn.yaml": "key: value\n",

			// file in dir
			"sub/nok.yaml": "---\nlist: [  1, 1, 2, 3, 5, 8]  \n",
		});
		resolve = temp.resolve;
		cleanup = temp.cleanup;

		try {
			// eslint-disable-next-line no-console
			console.log("building...");
			await build();
		} catch {
			throw new Error("failed");
		}
	});

	const check = (output: string, filepath: string, problems: string[]) => {
		const [line, ...lines] = splitlines(output);
		assert.ok(line.includes(filepath));
		assert.deepStrictEqual(lines, problems);
	};

	test("run module no args", async () => {
		const ctx = await run();
		assert.notEqual(ctx.returncode, 0);
		assert.ok(ctx.output.startsWith("usage: yamllint"));
	});

	test("run module version", async () => {
		const ctx = await run("--version");
		assert.equal(ctx.returncode, 0);
		assert.equal(ctx.output.trimEnd(), APP.VERSION);
	});

	test("run module on bad dir", async () => {
		const ctx = await run("/does/not/exist");
		assert.ok(ctx.output.includes("no such file or directory"));
	});

	test("run module on file", async () => {
		const ctx = await run(resolve("warn.yaml"));
		check(ctx.output, "/warn.yaml", [
			"  1:1       warning  missing document start \"---\"  (document-start)",
			"",
		]);
	});

	test("run module on dir", async () => {
		const ctx = await run(resolve());
		assert.equal(ctx.returncode, 1);

		const files = ctx.output.split("\n\n");
		check(files[0], "/warn.yaml", [
			"  1:1       warning  missing document start \"---\"  (document-start)",
		]);
		check(files[1], "/sub/nok.yaml", [
			"  2:9       error    too many spaces inside brackets  (brackets)",
			"  2:27      error    trailing spaces  (trailing-spaces)",
		]);
	});
});
