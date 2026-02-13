import { vi, describe, test, expect } from "vitest";
import os from "node:os";

import {
	B,
	isASCII,
	splitlines,
	bufferStartsWith,
	once,
	getHomedir,
	formatErrorMessage,
	toKebabCase,
	toKebabCaseKeys,
} from "../src/utils";

import { envWorkspace } from "./common";



describe("B", () => {
	test("should return a Buffer instance", () => {
		expect(B("text")).toBeInstanceOf(Buffer);
		expect(B("text").toString()).toBe("text");
		expect(B("random").toString()).toBe("random");
	});
});

describe("isASCII", () => {
	test("should detect ASCII characters", () => {
		expect(isASCII("xxx")).toBe(true);
		expect(isASCII("xxx\u00a0")).toBe(false);
	});
});

describe("splitlines", () => {
	test("should split lines", () => {
		expect(splitlines(
			"a\nb\r\nc\vd\fe\x1cf\x1dg\x1eh\x85i\u2028j\u2029k",
		)).toStrictEqual(
			["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k"],
		);
	});
});

describe("bufferStartsWith", () => {
	test("should detect the prefix", () => {
		expect(bufferStartsWith(B("text"), B("te"))).toBe(true);
		expect(bufferStartsWith(B("text"), B("text"))).toBe(true);
		expect(bufferStartsWith(B("text"), B("texte"))).toBe(false);
	});
});

describe("once", () => {
	test("should call the function once", () => {
		const fn = vi.fn(() => {
			// pass
		});
		const onceFn = once(fn);

		onceFn();
		expect(fn).toHaveBeenCalledTimes(1);
		onceFn();
		expect(fn).toHaveBeenCalledTimes(1);
	});

	test("should call again if the function returns false", () => {
		const max = 10;
		let curr = max;
		const fn = vi.fn(() => {
			curr--;
			return curr === 0;
		});

		const onceFn = once(fn);
		for (let i = 1; i < max + 1; i++) {
			onceFn();
			expect(fn).toHaveBeenCalledTimes(i);
		}

		onceFn();
		expect(fn).toHaveBeenCalledTimes(max);
	});
});

describe("getHomedir", () => {
	test("should ", async () => {
		const envHome = "/this/is/env/home";

		expect(getHomedir()).toBe(os.homedir());
		await envWorkspace({ HOME: envHome }, () => {
			expect(getHomedir()).toBe(envHome);
		});
	});
});

describe("formatErrorMessage", () => {
	test("should ", () => {
		const prefix = "Error: ";
		const error = new Error("error");
		const string = "string";

		expect(formatErrorMessage("", error)).toBe(error.message);
		expect(formatErrorMessage("", string)).toBe(string);
		expect(formatErrorMessage(prefix, error)).toBe(`${prefix}${error.message}`);
		expect(formatErrorMessage(prefix, string)).toBe(`${prefix}${string}`);
	});
});

describe("toKebabCase", () => {
	test("should convert to kebab case", () => {
		expect(toKebabCase("camelCase")).toBe("camel-case");
		expect(toKebabCase("PascalCase")).toBe("pascal-case");
		expect(toKebabCase("kebab-case")).toBe("kebab-case");
	});
});

describe("toKebabCaseKeys", () => {
	test("should convert to kebab case", () => {
		expect(toKebabCaseKeys({
			camelCase: "value",
			PascalCase: "value",
			"kebab-case": "value",
		})).toStrictEqual({
			"camel-case": "value",
			"pascal-case": "value",
			"kebab-case": "value",
		});
	});
});
