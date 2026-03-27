interface ConvertContext {
	listDepth: number;
	ordered: boolean;
	listIndex: number;
}

const SKIP_TAGS = new Set(["script", "style", "meta", "link", "head", "noscript"]);

const HEADING_TAGS: Record<string, number> = {
	h1: 1,
	h2: 2,
	h3: 3,
	h4: 4,
	h5: 5,
	h6: 6,
};

export function htmlToMarkdown(html: string): string {
	if (!html || !html.trim()) {
		return "";
	}

	const parser = new DOMParser();
	const doc = parser.parseFromString(html, "text/html");
	const body = doc.body;

	if (!body) {
		return "";
	}

	const defaultContext: ConvertContext = {
		listDepth: 0,
		ordered: false,
		listIndex: 0,
	};

	let result = convertNode(body, defaultContext);

	// Post-process: collapse excessive blank lines, trim
	result = result.replace(/\n{3,}/g, "\n\n");
	result = result.trim();

	return result;
}

function escapeTableCell(text: string): string {
	return text.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function escapeUrl(url: string): string {
	return url.replace(/\)/g, "%29").replace(/ /g, "%20");
}

function getStyleProperty(el: Element, prop: string): string {
	const style = el.getAttribute("style") ?? "";
	const match = style.match(new RegExp(prop + "\\s*:\\s*([^;]+)"));
	return match ? match[1].trim().toLowerCase() : "";
}

function isBoldStyle(el: Element): boolean {
	const weight = getStyleProperty(el, "font-weight");
	return weight === "bold" || weight === "700" || weight === "800" || weight === "900";
}

function isItalicStyle(el: Element): boolean {
	return getStyleProperty(el, "font-style") === "italic";
}

function isStrikethroughStyle(el: Element): boolean {
	const decoration = getStyleProperty(el, "text-decoration");
	return decoration.includes("line-through");
}

function convertNode(node: Node, ctx: ConvertContext): string {
	if (node.nodeType === Node.TEXT_NODE) {
		return node.textContent ?? "";
	}

	if (node.nodeType !== Node.ELEMENT_NODE) {
		return "";
	}

	const el = node as Element;
	const tag = el.tagName.toLowerCase();

	if (SKIP_TAGS.has(tag)) {
		return "";
	}

	// Headings
	if (tag in HEADING_TAGS) {
		const level = HEADING_TAGS[tag];
		const inner = convertChildren(el, ctx).trim();
		if (!inner) return "";
		return "\n\n" + "#".repeat(level) + " " + inner + "\n\n";
	}

	// Bold
	if (tag === "strong" || tag === "b") {
		const inner = convertChildren(el, ctx);
		if (!inner.trim()) return inner;
		return "**" + inner.trim() + "**";
	}

	// Italic
	if (tag === "em" || tag === "i") {
		const inner = convertChildren(el, ctx);
		if (!inner.trim()) return inner;
		return "_" + inner.trim() + "_";
	}

	// Strikethrough
	if (tag === "del" || tag === "s") {
		const inner = convertChildren(el, ctx);
		if (!inner.trim()) return inner;
		return "~~" + inner.trim() + "~~";
	}

	// Links
	if (tag === "a") {
		const href = el.getAttribute("href");
		const inner = convertChildren(el, ctx).trim();
		if (!href || href === "#") return inner;
		return "[" + inner + "](" + escapeUrl(href) + ")";
	}

	// Images
	if (tag === "img") {
		const src = el.getAttribute("src") ?? "";
		const alt = el.getAttribute("alt") ?? "";
		if (!src) return "";
		return "![" + alt + "](" + escapeUrl(src) + ")";
	}

	// Unordered list
	if (tag === "ul") {
		const childCtx: ConvertContext = {
			listDepth: ctx.listDepth + 1,
			ordered: false,
			listIndex: 0,
		};
		return "\n" + convertListItems(el, childCtx) + "\n";
	}

	// Ordered list
	if (tag === "ol") {
		const childCtx: ConvertContext = {
			listDepth: ctx.listDepth + 1,
			ordered: true,
			listIndex: 0,
		};
		return "\n" + convertListItems(el, childCtx) + "\n";
	}

	// List item — handled by convertListItems, but in case encountered directly
	if (tag === "li") {
		const inner = convertChildren(el, ctx).trim();
		if (!inner) return "";
		const indent = "  ".repeat(Math.max(0, ctx.listDepth - 1));
		const prefix = ctx.ordered
			? ctx.listIndex.toString() + ". "
			: "- ";
		return indent + prefix + inner + "\n";
	}

	// Blockquote
	if (tag === "blockquote") {
		const inner = convertChildren(el, ctx).trim();
		if (!inner) return "";
		const quoted = inner
			.split("\n")
			.map((line: string) => "> " + line)
			.join("\n");
		return "\n\n" + quoted + "\n\n";
	}

	// Code blocks: pre > code
	if (tag === "pre") {
		const codeEl = el.querySelector("code");
		const content = codeEl ? (codeEl.textContent ?? "") : (el.textContent ?? "");
		let lang = "";
		if (codeEl) {
			const className = codeEl.getAttribute("class") ?? "";
			const langMatch = className.match(/language-(\S+)/);
			if (langMatch) {
				lang = langMatch[1];
			}
		}
		return "\n\n```" + lang + "\n" + content + "\n```\n\n";
	}

	// Inline code
	if (tag === "code") {
		const content = el.textContent ?? "";
		if (content.includes("`")) {
			return "`` " + content + " ``";
		}
		return "`" + content + "`";
	}

	// Table
	if (tag === "table") {
		return "\n\n" + convertTable(el) + "\n\n";
	}

	// Line break
	if (tag === "br") {
		return "\n";
	}

	// Horizontal rule
	if (tag === "hr") {
		return "\n\n---\n\n";
	}

	// Paragraph
	if (tag === "p") {
		const inner = convertChildren(el, ctx).trim();
		if (!inner) return "";
		return "\n\n" + inner + "\n\n";
	}

	// Div — block-level separator
	if (tag === "div") {
		const inner = convertChildren(el, ctx);
		if (!inner.trim()) return "";
		return "\n" + inner + "\n";
	}

	// Sup/sub — use inline HTML (markdown supports it)
	if (tag === "sup" || tag === "sub") {
		const inner = convertChildren(el, ctx);
		return "<" + tag + ">" + inner + "</" + tag + ">";
	}

	// Span — check for inline style-based formatting (Google Docs, Word)
	if (tag === "span") {
		let inner = convertChildren(el, ctx);
		if (!inner.trim()) return inner;

		if (isStrikethroughStyle(el)) {
			inner = "~~" + inner.trim() + "~~";
		}
		if (isItalicStyle(el)) {
			inner = "_" + inner.trim() + "_";
		}
		if (isBoldStyle(el)) {
			inner = "**" + inner.trim() + "**";
		}

		return inner;
	}

	// Other unknown elements — just recurse
	return convertChildren(el, ctx);
}

function convertChildren(el: Element, ctx: ConvertContext): string {
	let result = "";
	const children = el.childNodes;
	for (let i = 0; i < children.length; i++) {
		result += convertNode(children[i], ctx);
	}
	return result;
}

function convertListItems(el: Element, ctx: ConvertContext): string {
	let result = "";
	let index = 1;
	const children = el.children;
	for (let i = 0; i < children.length; i++) {
		const child = children[i];
		if (child.tagName.toLowerCase() === "li") {
			const itemCtx: ConvertContext = {
				...ctx,
				listIndex: index,
			};
			const inner = convertChildren(child, itemCtx).trim();
			if (!inner) continue;
			const indent = "  ".repeat(Math.max(0, ctx.listDepth - 1));
			const prefix = ctx.ordered
				? index.toString() + ". "
				: "- ";
			result += indent + prefix + inner + "\n";
			index++;
		}
	}
	return result;
}

function convertTable(table: Element): string {
	const rows: string[][] = [];
	const trElements = table.querySelectorAll("tr");

	for (let i = 0; i < trElements.length; i++) {
		const tr = trElements[i];
		const cells: string[] = [];
		const cellElements = tr.querySelectorAll("td, th");
		for (let j = 0; j < cellElements.length; j++) {
			const cell = cellElements[j];
			const defaultCtx: ConvertContext = {
				listDepth: 0,
				ordered: false,
				listIndex: 0,
			};
			cells.push(escapeTableCell(convertChildren(cell, defaultCtx).trim()));
		}
		rows.push(cells);
	}

	if (rows.length === 0) return "";

	// Determine max columns
	let maxCols = 0;
	for (const row of rows) {
		if (row.length > maxCols) maxCols = row.length;
	}

	// Pad rows to maxCols
	for (const row of rows) {
		while (row.length < maxCols) {
			row.push("");
		}
	}

	// Build table
	const lines: string[] = [];
	// Header row
	lines.push("| " + rows[0].join(" | ") + " |");
	// Separator
	lines.push("| " + rows[0].map(() => "---").join(" | ") + " |");
	// Body rows
	for (let i = 1; i < rows.length; i++) {
		lines.push("| " + rows[i].join(" | ") + " |");
	}

	return lines.join("\n");
}
