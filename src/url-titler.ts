import { requestUrl } from "obsidian";

const TITLE_REGEX = /<title[^>]*>([\s\S]*?)<\/title>/i;
const FETCH_TIMEOUT_MS = 5000;

const ENTITY_MAP: Record<string, string> = {
	"&amp;": "&",
	"&lt;": "<",
	"&gt;": ">",
	"&quot;": '"',
	"&#39;": "'",
	"&#x27;": "'",
	"&apos;": "'",
	"&nbsp;": " ",
	"&ndash;": "\u2013",
	"&mdash;": "\u2014",
	"&lsquo;": "\u2018",
	"&rsquo;": "\u2019",
	"&ldquo;": "\u201C",
	"&rdquo;": "\u201D",
	"&bull;": "\u2022",
	"&hellip;": "\u2026",
	"&copy;": "\u00A9",
	"&reg;": "\u00AE",
	"&trade;": "\u2122",
};

const ENTITY_REGEX =
	/&(?:amp|lt|gt|quot|apos|nbsp|ndash|mdash|lsquo|rsquo|ldquo|rdquo|bull|hellip|copy|reg|trade|#39|#x27|#x[0-9a-fA-F]+|#\d+);/gi;

function decodeHtmlEntities(text: string): string {
	return text.replace(ENTITY_REGEX, (match: string) => {
		const lower = match.toLowerCase();
		if (ENTITY_MAP[lower]) {
			return ENTITY_MAP[lower];
		}
		if (lower.startsWith("&#x")) {
			const code = parseInt(lower.slice(3, -1), 16);
			return isNaN(code) ? match : String.fromCodePoint(code);
		}
		if (lower.startsWith("&#")) {
			const code = parseInt(lower.slice(2, -1), 10);
			return isNaN(code) ? match : String.fromCodePoint(code);
		}
		return match;
	});
}

function timeoutPromise(ms: number): Promise<never> {
	return new Promise((_resolve, reject) => {
		window.setTimeout(() => reject(new Error("Timeout")), ms);
	});
}

export async function fetchPageTitle(url: string): Promise<string | null> {
	try {
		const response = await Promise.race([
			requestUrl({ url, method: "GET" }),
			timeoutPromise(FETCH_TIMEOUT_MS),
		]);

		const html = response.text;
		const match = TITLE_REGEX.exec(html);
		if (!match || !match[1]) {
			return null;
		}

		const title = decodeHtmlEntities(match[1].trim());
		return title || null;
	} catch {
		return null;
	}
}
