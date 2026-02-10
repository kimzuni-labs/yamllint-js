import { B } from "./utils";



/**
 * Equivalent of Python's `codecs`.
 *
 * @see https://docs.python.org/3/library/codecs.html#codecs.BOM
 */
export const CODECS = {
	BOM_UTF8: B("\xef\xbb\xbf"),
	BOM_UTF16_BE: B("\xfe\xff"),
	BOM_UTF16_LE: B("\xff\xfe"),
	BOM_UTF32_BE: B("\x00\x00\xfe\xff"),
	BOM_UTF32_LE: B("\xff\xfe\x00\x00"),
	UTF16_ZERO: B("\x00"),
	UTF32_ZERO: B("\x00\x00\x00"),
};
