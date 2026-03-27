const DEFAULT_TRACKING_PARAMS: string[] = [
	"utm_source",
	"utm_medium",
	"utm_campaign",
	"utm_term",
	"utm_content",
	"utm_id",
	"fbclid",
	"gclid",
	"gclsrc",
	"mc_cid",
	"mc_eid",
	"msclkid",
	"twclid",
	"igshid",
	"_ga",
	"_gl",
	"yclid",
	"_hsenc",
	"_hsmi",
	"vero_id",
	"mkt_tok",
];

const TRACKING_PREFIXES: string[] = ["utm_", "mc_"];

export function isUrl(text: string): boolean {
	return /^https?:\/\/\S+$/.test(text.trim());
}

export function stripTrackingParams(
	url: string,
	customParams?: string[],
): string {
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		return url;
	}

	const allParams = customParams
		? [...DEFAULT_TRACKING_PARAMS, ...customParams]
		: DEFAULT_TRACKING_PARAMS;

	const keysToDelete: string[] = [];
	parsed.searchParams.forEach((_value: string, key: string) => {
		const lower = key.toLowerCase();
		if (allParams.includes(lower)) {
			keysToDelete.push(key);
			return;
		}
		for (const prefix of TRACKING_PREFIXES) {
			if (lower.startsWith(prefix)) {
				keysToDelete.push(key);
				return;
			}
		}
	});

	for (const key of keysToDelete) {
		parsed.searchParams.delete(key);
	}

	return parsed.toString();
}

export function cleanUrl(url: string, customParams?: string[]): string {
	let result = stripTrackingParams(url, customParams);

	let parsed: URL;
	try {
		parsed = new URL(result);
	} catch {
		return result;
	}

	// Clean Amazon URLs: strip /ref=... segments
	if (
		parsed.hostname.includes("amazon.") ||
		parsed.hostname.includes("amzn.")
	) {
		parsed.pathname = parsed.pathname.replace(/\/ref=[^/]*/, "");
	}

	// Strip trailing ? if no params remain
	result = parsed.toString();
	if (result.endsWith("?")) {
		result = result.slice(0, -1);
	}

	return result;
}

export function cleanUrlsInText(
	text: string,
	customParams?: string[],
): string {
	return text.replace(/https?:\/\/[^\s)>\]]+/g, (match: string) =>
		cleanUrl(match, customParams),
	);
}
