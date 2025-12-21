import type { AllLevel, RuleId } from "./types";
import type { RuleConf } from "./rules/types";



interface IgnoreData {
	ignore?: string | string[];
	"ignore-from-file"?: string | string[];
}

type CamelCase<S extends string> =
	S extends `${infer T}-${infer U}`
		? `${T}${Capitalize<CamelCase<U>>}`
		: S;

type CamelCaseKeys<T> = {
	[K in keyof T as K extends string ? CamelCase<K> : K]: T[K];
} & {};


type Level = Extract<AllLevel, "off" | "warn" | "error"> | 0 | 1 | 2;

type UserConfigRules = {
	[ID in RuleId]?: [
		level: Level,
		options?: CamelCaseKeys<IgnoreData & Partial<RuleConf<ID>>>,
	]
};

export interface UserConfig extends CamelCaseKeys<IgnoreData> {
	extends?: "default" | "relaxed" | (string & {});
	yamlFiles?: string | string[];
	locale?: string;
	rules?: Partial<UserConfigRules>;
}

export function defineConfig(options?: UserConfig) {
	return options;
}
