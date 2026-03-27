import { normalizeWhitespace } from "../src/whitespace";

describe("normalizeWhitespace", () => {
	it("normalizes CRLF to LF", () => {
		expect(normalizeWhitespace("foo\r\nbar\r\n")).toBe("foo\nbar\n");
	});

	it("normalizes CR to LF", () => {
		expect(normalizeWhitespace("foo\rbar\r")).toBe("foo\nbar\n");
	});

	it("trims trailing whitespace per line", () => {
		expect(normalizeWhitespace("foo   \nbar\t\n")).toBe("foo\nbar\n");
	});

	it("preserves leading whitespace (indentation)", () => {
		expect(normalizeWhitespace("  foo\n\tbar\n")).toBe("  foo\n\tbar\n");
	});

	it("collapses 3+ blank lines to 2", () => {
		expect(normalizeWhitespace("foo\n\n\n\nbar\n")).toBe(
			"foo\n\nbar\n",
		);
	});

	it("preserves single blank lines", () => {
		expect(normalizeWhitespace("foo\n\nbar\n")).toBe("foo\n\nbar\n");
	});

	it("trims trailing newlines to one", () => {
		expect(normalizeWhitespace("foo\n\n\n")).toBe("foo\n");
	});

	it("handles empty input", () => {
		expect(normalizeWhitespace("")).toBe("");
	});

	it("handles whitespace-only input", () => {
		expect(normalizeWhitespace("   \n  \n  \n")).toBe("\n");
	});

	it("is idempotent on clean input", () => {
		const clean = "foo\n\nbar\n";
		expect(normalizeWhitespace(clean)).toBe(clean);
	});
});
