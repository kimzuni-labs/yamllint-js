/*!
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

import assert from "node:assert";
import fs from "node:fs/promises";
import path from "node:path";
import yaml from "yaml";
import z from "zod";
import ignore, { type Ignore } from "ignore";
import { createJiti } from "jiti";

import type { Prettify, BuiltInExtendName, RuleConf, Rule, RuleId, AllLevel, Level, Alias, ToCamelCaseKeys, MaybeCamelCaseKeys } from "./types";
import { APP, LEVELS, ALIASES, YAMLLINT_JS_CONFIG_FILES, YAMLLINT_CONFIG_FILES, YAML_OPTIONS } from "./constants";
import { splitlines, getHomedir, formatErrorMessage, toKebabCaseKeys } from "./utils";
import * as yamllintRules from "./rules";
import * as decoder from "./decoder";



const ig = () => ignore({ allowRelativePaths: true });



interface IgnoreData<T extends Ignore | string | string[] = string | string[]> {
	ignore?: T;
	"ignore-from-file"?: T;
}



interface GenerateConfigData<T> {
	extends?: BuiltInExtendName | (string & {});
	"yaml-files"?: string | string[];
	locale?: string;
	rules?: T;
}

export type KebabCaseConfigData<L extends AllLevel = AllLevel> = Prettify<
	& IgnoreData
	& GenerateConfigData<{
		[ID in RuleId]?: L | [
			level?: L,
			options?: Prettify<IgnoreData & Partial<RuleConf<ID>>>,
		]
	}>
>;

export type CamelCaseConfigData<L extends AllLevel = AllLevel> = ToCamelCaseKeys<
	& IgnoreData
	& GenerateConfigData<{
		[ID in RuleId]?: L | [
			level?: L,
			options?: ToCamelCaseKeys<IgnoreData & Partial<RuleConf<ID>>>,
		]
	}>
>;

export type MaybeCamelCaseConfigData<L extends AllLevel = AllLevel> = MaybeCamelCaseKeys<
	& IgnoreData
	& GenerateConfigData<{
		[ID in RuleId]?: L | [
			level?: L,
			options?: MaybeCamelCaseKeys<IgnoreData & Partial<RuleConf<ID>>>,
		]
	}>
>;



export class YamlLintConfigError extends Error {}



type YamlLintConfigRules = {
	[ID in RuleId]?: false | Prettify<
		& {
			level: Extract<AllLevel, "warning" | "error">;
		}
		& IgnoreData<Ignore>
		& RuleConf<ID>
	>
};

export type YamlLintConfigProps = {
	file: string;
	content?: never;
	data?: never;
	_data?: never;
} | {
	file?: never;
	content: string;
	data?: never;
	_data?: never;
} | {
	file?: never;
	content?: never;
	data: MaybeCamelCaseConfigData;
	_data?: never;
} | {
	file?: never;
	content?: never;
	data?: never;
	_data: unknown;
};

/**
 * YAML lint configuration,
 * Only one of `file`, `content`, `data` can be specified.
 *
 * @example
 *
 * ```typescript
 * const conf = await YamlLintConfig.init({
 *   file: "path/to/yamllint.yaml",
 *   // content: "---\nYAML: content",
 *   // data: {}, // type-safe
 *   // _data: {}, // unknown type
 * });
 * ```
 */
export class YamlLintConfig {
	#props: YamlLintConfigProps;
	#data: unknown;
	#ignore?: Ignore;
	#yamlFiles = ig().add(["*.yaml", "*.yml", ".yamllint"]);
	locale?: string;
	#rules: Record<string, unknown> = {};
	get rules() {
		return this.#rules as YamlLintConfigRules;
	}

	static async init(props: YamlLintConfigProps) {
		const conf = new YamlLintConfig(props);
		await conf.#init();
		await conf.#parse();
		await conf.#validate();
		return conf;
	}

	constructor(props: YamlLintConfigProps) {
		assert(
			Number(props.file !== undefined)
			+ Number(props.content !== undefined)
			+ Number(props.data !== undefined)
			+ Number(props._data !== undefined)
			=== 1,
		);

		this.#props = props;
	}

	isFileIgnored(filepath: string) {
		return !!this.#ignore?.ignores(filepath);
	}

	isYamlFile(filepath: string) {
		return this.#yamlFiles.ignores(path.basename(filepath));
	}

	enabledRules(filepath?: string) {
		const rules: Rule[] = [];
		for (const id in this.rules) {
			const val = this.rules[id as RuleId];
			if (
				val
				&& (
					filepath === undefined
					|| !val.ignore?.ignores(filepath)
				)
			) {
				rules.push(yamllintRules.get(id));
			}
		}
		return rules;
	}

	extend(baseConfig: unknown) {
		assert(baseConfig instanceof YamlLintConfig);

		for (const rule in this.#rules) {
			if (
				typeof this.#rules[rule] === "object"
				&& rule in baseConfig.#rules
				&& baseConfig.#rules[rule] !== false
			) {
				baseConfig.#rules[rule] = Object.assign(baseConfig.#rules[rule] as object, this.#rules[rule]);
			} else {
				baseConfig.#rules[rule] = this.#rules[rule];
			}
		}

		this.#rules = baseConfig.#rules;
		if (baseConfig.#ignore) {
			this.#ignore = baseConfig.#ignore;
		}
	}

	async #init() {
		const props = this.#props;
		if (props._data !== undefined || props.data !== undefined) {
			this.#data = props._data ?? props.data;
		} else {
			try {
				if (props.content !== undefined) {
					this.#data = yaml.parse(props.content, YAML_OPTIONS) as unknown;
				} else {
					this.#data = await loadConfigFile(props.file);
				}
			} catch (e) {
				throw new YamlLintConfigError(formatErrorMessage("invalid config: ", e));
			}
		}
	}

	async #parse() {
		const value = this.#data;
		if (!value || Array.isArray(value) || typeof value !== "object") {
			throw new YamlLintConfigError("invalid config: not a mapping");
		}
		const conf = toKebabCaseKeys(value as Record<string, unknown>);

		if (
			conf.rules !== undefined
			&& (typeof conf.rules !== "object" || conf.rules === null)
		) {
			throw new YamlLintConfigError("invalid config: rules should be a mapping");
		}
		const userRules = (conf.rules ?? {}) as Record<string, unknown>;

		for (const key in userRules) {
			const userRule = userRules[key];
			const level = validateLevel(userRule);
			if (
				userRule === false
				|| userRule === "disable"
				|| level === null
				|| (
					Array.isArray(userRule)
					&& validateLevel(userRule[0]) === null
				)
			) {
				this.#rules[key] = false;
			} else if (level !== undefined || Array.isArray(userRule)) {
				const [ruleLevel, ruleConf] = level ? [level] : userRule as unknown[];
				this.#rules[key] = {
					level: ruleLevel,
					...(ruleConf && typeof ruleConf === "object" ? ruleConf : {}),
				};
			} else {
				this.#rules[key] = userRule === "enable" ? {} : userRule;
			}
		}

		// Does this conf override another conf that we need to load?
		if (conf.extends && typeof conf.extends === "string") {
			const file = await getExtendedConfigFile(conf.extends);
			const base = await YamlLintConfig.init({ file });
			try {
				this.extend(base);
			} catch (e) {
				throw new YamlLintConfigError(formatErrorMessage("invalid config: ", e));
			}
		}

		const ignore = await parseIgnoreData(conf);
		if (ignore) this.#ignore = ignore;

		if (conf["yaml-files"]) {
			this.#yamlFiles = ig().add(toStringArray(
				conf["yaml-files"],
				"invalid config: yaml-files should be a list of file patterns",
			));
		}

		if (conf.locale) {
			if (typeof conf.locale !== "string") {
				throw new YamlLintConfigError("invalid config: locale should be a string");
			}
			this.locale = conf.locale.split(".")[0].replaceAll("_", "-");
		}
	}

	async #validate() {
		for (const id in this.#rules) {
			let rule: Rule;
			try {
				rule = yamllintRules.get(id);
			} catch (e) {
				throw new YamlLintConfigError(formatErrorMessage("invalid config: ", e));
			}
			this.#rules[id] = await validateRuleConf(rule, this.#rules[id]);
		}
	}
}



export async function validateRuleConf(rule: ReturnType<typeof yamllintRules.get>, config: unknown) {
	// disable
	if (config === false) return false;

	if (!config || typeof config !== "object") {
		throw new YamlLintConfigError(`invalid config: rule "${rule.ID}": should be either "enable", "disable" or a mapping`);
	}
	const conf = toKebabCaseKeys(config as Record<string, unknown>);

	conf.level = validateLevel(conf.level);
	if (conf.level === undefined) {
		throw new YamlLintConfigError("invalid config: level should be \"error\" or \"warning\"");
	} else if (conf.level === null) {
		// disable
		return false;
	}

	const ignore = await parseIgnoreData(conf);
	if (ignore) conf.ignore = ignore;

	const options = rule.CONF;
	const optionsDefault = rule.DEFAULT ?? {};

	try {
		options
			?.extend({
				level: z.any(),
				ignore: z.any(),
				"ignore-from-file": z.any(),
			})
			.strict()
			.partial()
			.parse(conf);
	} catch (e) {
		assert(e instanceof z.ZodError);
		const issue = e.issues[0];

		if (issue.code === "unrecognized_keys") {
			throw new YamlLintConfigError(`invalid config: unknown option "${issue.keys[0]}" for rule "${rule.ID}"`);
		}

		const optkey = issue.path[0];
		const message = zodIssueDetect(issue).join("");
		throw new YamlLintConfigError(`invalid config: option "${optkey.toString()}" of "${rule.ID}" ${message}`);
	}

	const keys = options?.keyof().options ?? [];
	for (const optkey of keys) {
		if (!(optkey in conf)) {
			conf[optkey] = optionsDefault[optkey];
		}
	}

	if (rule.VALIDATE) {
		const res = rule.VALIDATE(conf);
		if (res) throw new YamlLintConfigError(`invalid config: ${rule.ID}: ${res}`);
	}

	return conf;
}



interface LoadConfigFileOptions {
	/**
	 * @default process.cwd()
	 */
	startDir?: string;

	/**
	 * @default getHomedir()
	 *
	 * @see {@link getHomedir}
	 */
	stopDir?: string;
}

/**
 * Load YAML lint configuration from a file.
 *
 * @example
 *
 * ```typescript
 * const autoDetected = await loadConfigFile();
 * const specified = await loadConfigFile("path/to/yamllint.yaml");
 * const withOptions = await loadConfigFile({ startDir, stopDir });
 * ```
 */
export const loadConfigFile = (() => {
	const extPattern = /\.[cm]?[jt]s$/;
	const filenames = [
		...YAMLLINT_JS_CONFIG_FILES,
		"package.json",
		...YAMLLINT_CONFIG_FILES,
	];

	const loadFile = async (filepath: string) => {
		try {
			filepath = path.resolve(filepath);
			const filename = path.basename(filepath);
			if (extPattern.test(filepath)) {
				const jiti = createJiti(import.meta.url);
				const size = await fs.stat(filepath).then(x => x.size).catch(() => 0);
				if (size > 0) {
					const mod = await jiti.import(filepath, { default: true });

					// @ts-expect-error: ts(18046)
					const value = (mod.default ?? mod) as unknown;
					if (typeof value === "object" && value !== null) {
						return value;
					}
				}
			} else if (filename === "package.json") {
				const content = decoder.autoDecode(await fs.readFile(filepath));
				const pkg = JSON.parse(content) as unknown;
				if (typeof pkg !== "object" || pkg === null) return;

				// @ts-expect-error: ts(7053)
				const value = pkg[APP.NAME] as unknown;
				return value ?? undefined;
			} else {
				const content = decoder.autoDecode(await fs.readFile(filepath));
				return yaml.parse(content, YAML_OPTIONS) as unknown;
			}
			throw new Error();
		} catch {
			throw new YamlLintConfigError(`failed to load config file "${filepath}"`);
		}
	};

	return async function loadConfigFile(filepath?: string | LoadConfigFileOptions) {
		if (typeof filepath === "string") {
			return loadFile(filepath);
		}

		const startDir = filepath?.startDir ?? process.cwd();
		const stopDir = filepath?.stopDir === undefined ? getHomedir() : path.resolve(filepath.stopDir);
		let currDir = path.resolve(startDir, "xxx");

		do {
			currDir = path.dirname(currDir);
			for (const filename of filenames) {
				const curr = path.join(currDir, filename);
				const isFile = await fs.stat(curr)
					.then(x => x.isFile() || x.isSymbolicLink())
					.catch(() => false);
				if (isFile) {
					const content = await loadFile(curr);
					if (content) return content;
				}
			}
		} while (
			currDir !== stopDir
			&& currDir !== path.dirname(currDir)
		);
	};
})();



/**
 * Detect user global config file path.
 *
 * @example
 *
 * ```typescript
 * await detectUserGlobalConfig(); // "/home/user/.config/yamllint/config"
 * ```
 */
export async function detectUserGlobalConfig() {
	let userGlobalConfig;
	if (process.env.YAMLLINT_CONFIG_FILE !== undefined) {
		userGlobalConfig = process.env.YAMLLINT_CONFIG_FILE;

	// User-global config is supposed to be in ~/.config/yamllint/config
	} else if (process.env.XDG_CONFIG_HOME !== undefined) {
		userGlobalConfig = path.join(process.env.XDG_CONFIG_HOME, "yamllint", "config");
	} else {
		userGlobalConfig = path.join(getHomedir(), ".config", "yamllint", "config");
	}

	const isFile = await fs.stat(userGlobalConfig).then(x => x.isFile()).catch(() => false);
	return isFile ? userGlobalConfig : undefined;
}

/**
 * Load and return a fully resolved YamlLint configuration instance.
 *
 * - First, try to load config file from the current directory to user home directory.
 * - If not found, try to load from the user global config file.
 * - If not found, try to load from the default config.
 */
export async function loadYamlLintConfig(options?: LoadConfigFileOptions) {
	let userGlobalConfig;
	let load;

	let conf: YamlLintConfig;
	if ((load = await loadConfigFile(options))) {
		conf = await YamlLintConfig.init({ _data: load });
	} else if ((userGlobalConfig = await detectUserGlobalConfig())) {
		conf = await YamlLintConfig.init({ file: userGlobalConfig });
	} else {
		conf = await YamlLintConfig.init({ content: "extends: default" });
	}
	return conf;
}



export async function getExtendedConfigFile(name: string) {
	// Is it a standard conf shipped with yamllint...
	if (!name.includes("/")) {
		const stdConf = path.join(import.meta.dirname, "conf", `${name}.yaml`);
		if (await fs.stat(stdConf).then(x => x.isFile()).catch(() => false)) {
			return stdConf;
		}
	}

	// or a custom conf on filesystem?
	return name;
}



/**
 * if value is {@link AllLevel} or undefined
 * then convert to {@link Level} (undefined -> "error"),
 * otherwise return undefined
 *
 * @example
 *
 * ```typescript
 * validateLevel(undefined) // "error"
 * validateLevel(2) // "error"
 * validateLevel(1) // "warning"
 * validateLevel("1") // "warning"
 * validateLevel("error") // "error"
 * validateLevel("warning") // "warning"
 * validateLevel("off") // null
 * validateLevel(null) // null
 * validateLevel(3) // undefined
 * validateLevel("invalid") // undefined
 * ```
 */
export function validateLevel(value: unknown): Level | undefined {
	if (value === undefined) {
		return "error";
	} else if (LEVELS.includes(value as Level)) {
		return value as Level;
	} else if ((value as Alias) in ALIASES) {
		return ALIASES[value as Alias];
	}
}



async function parseIgnoreData(data: Record<string, unknown>) {
	if (data.ignore !== undefined && data["ignore-from-file"] !== undefined) {
		throw new YamlLintConfigError("invalid config: ignore and ignore-from-file keys cannot be used together");
	} else if (data["ignore-from-file"] !== undefined) {
		const paths = toStringArray(
			data["ignore-from-file"],
			"invalid config: ignore-from-file should contain filename(s), either as a list or string",
		);
		const gen = decoder.linesInFiles(paths);
		const lines = [];
		for await (const line of gen) lines.push(line);
		return ig().add(lines);
	} else if (data.ignore) {
		return ig().add(toStringArray(
			data.ignore,
			"invalid config: ignore should contain file patterns",
		));
	}
}



function toStringArray(value: unknown, message: string) {
	if (typeof value === "string") {
		return splitlines(value.trim());
	} else if (Array.isArray(value) && value.every(x => typeof x === "string")) {
		return value;
	} else {
		throw new YamlLintConfigError(message);
	}
}



function zodIssueDetect(issue: z.core.$ZodIssue): string[] {
	/*
	 * Example: CONF = {option: (bool, 'mixed')}
	 *          → {option: true}         → {option: mixed}
	 */
	if (issue.code === "invalid_union") {
		const message = issue.errors.map(x => x.map(x => zodIssueDetect(x)[1])).flat();
		return ["should be in (", message.join(", "), ")"];
	}

	/*
	 * Example: CONF = {option: ['flag1', 'flag2', int]}
	 *          → {option: [flag1]}      → {option: [42, flag1, flag2]}
	 */
	if (issue.code === "invalid_value") {
		const values = JSON.stringify(issue.values).replaceAll(",", ", ").slice(1, -1);
		return ["should only contain values in [", values, "]"];
	}

	/*
	 * Example: CONF = {option: int}
	 *          → {option: 42}
	 */
	if (issue.code === "invalid_type") {
		return ["should be ", issue.expected];
	}

	return ["unknown error"];
}
