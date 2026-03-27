import type { SmartPasteSettings } from "./settings";
import { htmlToMarkdown } from "./html-to-markdown";
import { cleanUrl, cleanUrlsInText, isUrl } from "./url-cleaner";
import { fetchPageTitle } from "./url-titler";
import { normalizeWhitespace } from "./whitespace";

export interface PasteResult {
	text: string;
	handled: boolean;
}

function parseCustomParams(raw: string): string[] {
	return raw
		.split(",")
		.map((s: string) => s.trim().toLowerCase())
		.filter(Boolean);
}

export function hasImageInClipboard(clipboardData: DataTransfer): boolean {
	for (let i = 0; i < clipboardData.items.length; i++) {
		if (clipboardData.items[i].type.startsWith("image/")) {
			return true;
		}
	}
	return false;
}

export async function processPaste(
	clipboardData: DataTransfer,
	settings: SmartPasteSettings,
): Promise<PasteResult> {
	if (!settings.enabled) {
		return { text: "", handled: false };
	}

	// Don't intercept image pastes
	if (hasImageInClipboard(clipboardData)) {
		return { text: "", handled: false };
	}

	const htmlContent = clipboardData.getData("text/html");
	const plainContent = clipboardData.getData("text/plain");
	const customParams = parseCustomParams(settings.customTrackingParams);

	// HTML path
	if (htmlContent && settings.htmlToMarkdown) {
		let result = htmlToMarkdown(htmlContent);

		if (settings.trackerStripping) {
			result = cleanUrlsInText(result, customParams);
		}

		if (settings.whitespaceNormalization) {
			result = normalizeWhitespace(result);
		}

		if (result.trim()) {
			return { text: result, handled: true };
		}
	}

	// Plain text path
	if (plainContent) {
		let result = plainContent;
		const trimmed = result.trim();

		// Single bare URL: fetch title and create markdown link
		if (isUrl(trimmed)) {
			const cleaned = settings.trackerStripping
				? cleanUrl(trimmed, customParams)
				: trimmed;

			if (settings.urlLinkFetching) {
				const title = await fetchPageTitle(cleaned);
				if (title) {
					result = "[" + title + "](" + cleaned + ")";
				} else {
					result = cleaned;
				}
			} else if (settings.trackerStripping) {
				result = cleaned;
			}
		} else {
			// Multi-line text or non-URL: just clean URLs in place
			if (settings.trackerStripping) {
				result = cleanUrlsInText(result, customParams);
			}
		}

		if (settings.whitespaceNormalization) {
			result = normalizeWhitespace(result);
		}

		return { text: result, handled: true };
	}

	return { text: "", handled: false };
}
