/*
 * Copyright (C) 2016 Adrien Vergé
 * Copyright (C) 2023–2025 Jason Yundt
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

/* eslint-disable no-console */

import assert from "node:assert";
import fs from "node:fs/promises";
import os from "node:os";
import { Readable } from "node:stream";
import util from "node:util";
import path from "node:path";
import crypto from "node:crypto";
import yaml from "yaml";
import iconv from "iconv-lite";

import { isASCII } from "../src/utils";
import { YamlLintConfig, YamlLintConfigError } from "../src/config";
import * as linter from "../src/linter";
import * as cli from "../src/cli";



// Encoding related stuff:
export const UTF_CODECS = [
	"utf_32_be",
	"utf_32_be_sig",
	"utf_32_le",
	"utf_32_le_sig",
	"utf_16_be",
	"utf_16_be_sig",
	"utf_16_le",
	"utf_16_le_sig",
	"utf_8",
	"utf_8_sig",
];



export function encode(string: string, codec: string) {
	const addBOM = usesBom(codec);
	return iconv.encode(
		string,
		codec.replace(/_sig/g, ""),
		{ addBOM },
	);
}



export function isTestCodec(codec: string) {
	return codec.endsWith("_sig");
}



export function iconvEquivalentOfTestCodec(testCodec: string) {
	return testCodec.replace(/(_sig|_be|_le)/g, "");
}



export function usesBom(codec: string) {
	return (/(_32|_16|_sig)$/).test(codec);
}



export async function assertConfigError(
	block: () => Promise<unknown>,
	cb?: (e: YamlLintConfigError) => unknown,
) {
	await assert.rejects(
		block,
		(e) => {
			assert.ok(e instanceof YamlLintConfigError);
			if (cb) cb(e);
			return true;
		},
	);
}



/**
 * Returns True if encoding can be detected after string is encoded
 *
 * Encoding detection only works if you’re using a BOM or the first character
 * is ASCII. See yamllint.decoder.auto_decode()’s docstring.
 */
export function encodingDetectable(string: string, codec: string) {
	return usesBom(codec) || (string.length > 0 && isASCII(string[0]));
}



/**
 * if value is null, create directory
 */
export type Workspace = Record<string, string | string[] | Blob2 | Buffer | null>;

// Workspace related stuff:
export class Blob2 {
	constructor(
		public text: string,
		public encoding: string,
	) {}
}



export type BuildTempWorkspaceReturnType = Awaited<ReturnType<typeof buildTempWorkspace>>;
export async function buildTempWorkspace(files: Workspace) {
	const tempdir = await fs.mkdtemp(path.join(os.tmpdir(), "yamllint-tests-"));

	/**
	 * file generator with random string
	 *
	 * @example
	 *
	 * ```typescript
	 * const filepath = mkftemp(".yaml");
	 * // `${dirname}/a7dbb0516cb2919c38c6fb7f6bfdaeef.yaml`
	 * ```
	 */
	const mkftemp = (suffix?: string | { prefix?: string; suffix?: string }) => {
		const { prefix: p = "", suffix: s = "" } = typeof suffix === "object" ? suffix : { suffix };
		const h = crypto.randomBytes(16).toString("hex");
		return path.join(tempdir, p + h + s);
	};
	const resolve = (...paths: string[]) => path.resolve(tempdir, ...paths);

	for (const file in files) {
		const symlink = "symlink://";
		const content = files[file];
		const filepath = path.join(tempdir, file);
		const dirname = path.dirname(filepath);
		await fs.mkdir(dirname, { recursive: true });

		if (content === null) {
			await fs.mkdir(filepath, { recursive: true });
		} else if (typeof content === "string" && content.startsWith(symlink)) {
			await fs.symlink(content.slice(symlink.length), filepath);
		} else {
			let buf: Buffer;
			if (content instanceof Blob2) {
				buf = encode(content.text, content.encoding);
			} else {
				const source = typeof content !== "string" && Array.isArray(content) ? content.join("\n") : content;
				buf = Buffer.from(source);
			}
			await fs.writeFile(filepath, buf);
		}
	}

	return {
		mkftemp,
		resolve,
		dirname: tempdir,
		cleanup: async () => {
			await fs.rm(tempdir, { recursive: true });
		},
	};
}

/**
 * Provide a temporary workspace that is automatically cleaned up.
 */
export async function tempWorkspace<T>(
	workspace: Workspace,
	cb: (props: Omit<Awaited<ReturnType<typeof buildTempWorkspace>>, "cleanup">) => T,
) {
	const { cleanup, ...temp } = await buildTempWorkspace(workspace);

	const bak = process.cwd();
	try {
		process.chdir(temp.dirname);
		return await cb(temp);
	} finally {
		process.chdir(bak);
		await cleanup();
	}
}

export function tempWorkspaceWithFilesInManyCodecs(pathTemplate: string, text: string | string[]) {
	text = Array.isArray(text) ? text.join("\n") : text;

	const workspace: Workspace = {};
	for (const codec of UTF_CODECS) {
		if (encodingDetectable(text, codec)) {
			workspace[pathTemplate.replace("{}", codec)] = new Blob2(text, codec);
		}
	}
	return workspace;
}



// Miscellaneous stuff:
export type CheckProblem = [line: number, col: number, id?: string];
export const ruleTestCase = (id: string) => async (...config: string[] | [Record<string, unknown>, ...string[]]) => {
	const base = typeof config[0] === "string" ? undefined : config.shift() as Record<string, unknown>;
	if (config.length === 0) config = ["{}"];
	const conf = await YamlLintConfig.init({
		content: yaml.stringify({
			extends: "default",
			...base,
		}) + [
			"rules:",
			...(config as string[]).map(x => `  ${x}`),
		].join("\n"),
	});

	return async (
		source: string[],
		problems: CheckProblem[] = [],
	) => {
		const expectedProblems = [];
		for (const value of problems) {
			const ruleId = value[2] === "syntax" ? undefined : value[2] ?? (id === "syntax" ? undefined : id);
			expectedProblems.push(new linter.LintProblem(value[0], value[1], undefined, ruleId));
		}

		expectedProblems.sort((a, b) => (a.line !== b.line ? a.line - b.line : a.column - b.column));
		const result = linter.run(source.join("\n"), conf);
		for await (const x of result) {
			assert.ok(x.eq(expectedProblems.shift()), util.inspect(x));
		}
		assert.ok(expectedProblems.length === 0);
	};
};



export interface RunContextData {
	/**
	 * if `returncode` is `null`, `stdin` cannot be used on node.js.
	 *
	 * `TypeError: Cannot set property stdin of #<process> which has only a getter`
	 */
	returncode: number | null;
	stdout: string;
	stderr: string;
}

/**
 * Context manager for ``cli.run()`` to capture exit code and streams.
 */
export async function runContext(...options: string[] | [{
	chdir?: string;
	inputData?: string | Buffer;
	args?: string[];
	env?: Record<string, string | undefined>;
}]): Promise<RunContextData> {
	const {
		chdir,
		inputData,
		args = [],
		env = {},
	} = options.length === 0 || typeof options[0] === "string" ? { args: options as string[] } : options[0];

	type Key = typeof keys[number];
	const keys = ["log", "error"] as const;
	const bak = {} as Record<Key, typeof console.log>;
	const data = { log: "", error: "" } satisfies Record<Key, string>;
	const stdin = process.stdin;
	const processEnv = { ...process.env };

	const genLogFn = (key: Key) => (...args: unknown[]) => {
		const text = args.map(String).join(" ");
		data[key] += text + "\n";
	};

	const override = () => {
		for (const key in env) {
			process.env[key] = env[key];
		}

		if (inputData !== undefined) {
			// @ts-expect-error: ts(2322)
			process.stdin = Readable.from(inputData);
		}
		for (const key of keys) {
			bak[key] = console[key];
			console[key] = genLogFn(key);
		}
	};

	const restore = () => {
		process.env = processEnv;
		if (inputData !== undefined) {
			process.stdin = stdin;
		}
		for (const key of keys) {
			console[key] = bak[key];
		}
	};

	let returncode: number | null;
	if (typeof Bun === "undefined" && inputData !== undefined) {
		console.warn("Warning: Cannot capture exit code when using stdin in Node.js runtime");
		returncode = null;
	} else {
		const bak = process.cwd();
		try {
			override();
			if (chdir) process.chdir(chdir);
			returncode = await cli.run(args);
		} finally {
			process.chdir(bak);
			restore();
		}
	}

	return {
		returncode,
		stdout: data.log,
		stderr: data.error,
	};
}

export async function withTTYWorkspace(
	fn: () => void | Promise<void>,
) {
	const bak = process.stdout.isTTY;
	try {
		process.stdout.isTTY = true;
		await fn();
	} finally {
		process.stdout.isTTY = bak;
	}
}

export async function noTTYWorkspace(
	fn: () => void | Promise<void>,
) {
	const bak = process.stdout.isTTY;
	try {
		process.stdout.isTTY = false;
		await fn();
	} finally {
		process.stdout.isTTY = bak;
	}
}
