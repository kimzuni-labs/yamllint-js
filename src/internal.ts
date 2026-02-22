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

export type {
	AllLevel,
	BuiltInExtendName,
	RuleId,
	Prettify,
} from "./types";

export {
	type Level,
	type Alias,
	LEVELS,
	ALIASES,
} from "./constants";

export {
	type CamelCaseConfigData,
	type KebabCaseConfigData,
	type MaybeCamelCaseConfigData,
	type YamlLintConfigProps,
	YamlLintConfig,
	YamlLintConfigError,
	findProjectConfigFilepath,
	loadConfigFile,
	detectUserGlobalConfig,
	loadYamlLintConfig,
	validateLevel,
} from "./config";

export {
	LintProblem,
	run as linter,
} from "./linter";
