import {
	isUrl,
	stripTrackingParams,
	cleanUrl,
	cleanUrlsInText,
} from "../src/url-cleaner";

describe("isUrl", () => {
	it("returns true for http URLs", () => {
		expect(isUrl("http://example.com")).toBe(true);
	});

	it("returns true for https URLs", () => {
		expect(isUrl("https://example.com/path?q=1")).toBe(true);
	});

	it("returns false for plain text", () => {
		expect(isUrl("not a url")).toBe(false);
	});

	it("returns false for partial URLs", () => {
		expect(isUrl("example.com")).toBe(false);
	});

	it("trims whitespace before checking", () => {
		expect(isUrl("  https://example.com  ")).toBe(true);
	});

	it("returns false for URLs with spaces", () => {
		expect(isUrl("https://example.com/path with spaces")).toBe(false);
	});
});

describe("stripTrackingParams", () => {
	it("strips utm_source", () => {
		const result = stripTrackingParams(
			"https://example.com/?utm_source=twitter&page=1",
		);
		expect(result).toContain("page=1");
		expect(result).not.toContain("utm_source");
	});

	it("strips all utm_ params", () => {
		const url =
			"https://example.com/?utm_source=a&utm_medium=b&utm_campaign=c&utm_term=d&utm_content=e";
		const result = stripTrackingParams(url);
		expect(result).toBe("https://example.com/");
	});

	it("strips fbclid", () => {
		const result = stripTrackingParams(
			"https://example.com/?fbclid=abc123&id=5",
		);
		expect(result).toContain("id=5");
		expect(result).not.toContain("fbclid");
	});

	it("strips gclid", () => {
		const result = stripTrackingParams(
			"https://example.com/?gclid=abc123",
		);
		expect(result).toBe("https://example.com/");
	});

	it("strips msclkid", () => {
		const result = stripTrackingParams(
			"https://example.com/?msclkid=abc",
		);
		expect(result).toBe("https://example.com/");
	});

	it("preserves non-tracking params", () => {
		const result = stripTrackingParams(
			"https://example.com/?page=2&sort=asc",
		);
		expect(result).toContain("page=2");
		expect(result).toContain("sort=asc");
	});

	it("handles custom params", () => {
		const result = stripTrackingParams(
			"https://example.com/?custom_track=1&page=2",
			["custom_track"],
		);
		expect(result).toContain("page=2");
		expect(result).not.toContain("custom_track");
	});

	it("returns invalid URLs unchanged", () => {
		expect(stripTrackingParams("not-a-url")).toBe("not-a-url");
	});
});

describe("cleanUrl", () => {
	it("strips tracking params and cleans Amazon URLs", () => {
		const result = cleanUrl(
			"https://www.amazon.com/dp/B08N5WRWNW/ref=cm_sw_r_cp_api?utm_source=twitter",
		);
		expect(result).not.toContain("ref=");
		expect(result).not.toContain("utm_source");
		expect(result).toContain("/dp/B08N5WRWNW");
	});

	it("strips trailing ? when no params remain", () => {
		const result = cleanUrl("https://example.com/?utm_source=twitter");
		expect(result).toBe("https://example.com/");
	});

	it("handles amzn.to URLs", () => {
		const result = cleanUrl(
			"https://amzn.to/abc/ref=sr_1_1?fbclid=123",
		);
		expect(result).not.toContain("ref=");
		expect(result).not.toContain("fbclid");
	});

	it("preserves non-tracking URLs unchanged", () => {
		const url = "https://example.com/page?id=42";
		expect(cleanUrl(url)).toBe(url);
	});
});

describe("cleanUrlsInText", () => {
	it("cleans URLs embedded in text", () => {
		const text =
			"Check this: https://example.com/?utm_source=test and this too";
		const result = cleanUrlsInText(text);
		expect(result).not.toContain("utm_source");
		expect(result).toContain("Check this:");
		expect(result).toContain("and this too");
	});

	it("cleans multiple URLs in text", () => {
		const text =
			"Link1: https://a.com/?fbclid=x Link2: https://b.com/?gclid=y";
		const result = cleanUrlsInText(text);
		expect(result).not.toContain("fbclid");
		expect(result).not.toContain("gclid");
	});

	it("preserves text without URLs", () => {
		const text = "No URLs here, just plain text.";
		expect(cleanUrlsInText(text)).toBe(text);
	});
});
