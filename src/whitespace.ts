export function normalizeWhitespace(text: string): string {
	// Normalize line endings: CRLF and CR to LF
	let result = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

	// Trim trailing whitespace per line (preserve leading for indentation)
	result = result.replace(/[ \t]+$/gm, "");

	// Collapse 3+ consecutive newlines to 2 (one blank line max)
	result = result.replace(/\n{3,}/g, "\n\n");

	// Trim trailing newlines (keep at most one)
	result = result.replace(/\n+$/, "\n");

	return result;
}
