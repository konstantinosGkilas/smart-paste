import { htmlToMarkdown } from "../src/html-to-markdown";

describe("htmlToMarkdown", () => {
	describe("empty/invalid input", () => {
		it("returns empty string for empty input", () => {
			expect(htmlToMarkdown("")).toBe("");
		});

		it("returns empty string for whitespace-only input", () => {
			expect(htmlToMarkdown("   ")).toBe("");
		});

		it("handles plain text without HTML", () => {
			expect(htmlToMarkdown("Hello world")).toBe("Hello world");
		});
	});

	describe("headings", () => {
		it("converts h1", () => {
			expect(htmlToMarkdown("<h1>Title</h1>")).toBe("# Title");
		});

		it("converts h2", () => {
			expect(htmlToMarkdown("<h2>Subtitle</h2>")).toBe("## Subtitle");
		});

		it("converts h3 through h6", () => {
			expect(htmlToMarkdown("<h3>H3</h3>")).toBe("### H3");
			expect(htmlToMarkdown("<h4>H4</h4>")).toBe("#### H4");
			expect(htmlToMarkdown("<h5>H5</h5>")).toBe("##### H5");
			expect(htmlToMarkdown("<h6>H6</h6>")).toBe("###### H6");
		});
	});

	describe("inline formatting", () => {
		it("converts bold (strong)", () => {
			expect(htmlToMarkdown("<strong>bold</strong>")).toBe("**bold**");
		});

		it("converts bold (b)", () => {
			expect(htmlToMarkdown("<b>bold</b>")).toBe("**bold**");
		});

		it("converts italic (em)", () => {
			expect(htmlToMarkdown("<em>italic</em>")).toBe("_italic_");
		});

		it("converts italic (i)", () => {
			expect(htmlToMarkdown("<i>italic</i>")).toBe("_italic_");
		});

		it("converts strikethrough (del)", () => {
			expect(htmlToMarkdown("<del>removed</del>")).toBe("~~removed~~");
		});

		it("converts strikethrough (s)", () => {
			expect(htmlToMarkdown("<s>removed</s>")).toBe("~~removed~~");
		});

		it("converts inline code", () => {
			expect(htmlToMarkdown("<code>const x = 1</code>")).toBe(
				"`const x = 1`",
			);
		});
	});

	describe("links and images", () => {
		it("converts links", () => {
			expect(
				htmlToMarkdown('<a href="https://example.com">Example</a>'),
			).toBe("[Example](https://example.com)");
		});

		it("handles links without href", () => {
			expect(htmlToMarkdown("<a>text</a>")).toBe("text");
		});

		it("handles links with # href", () => {
			expect(htmlToMarkdown('<a href="#">text</a>')).toBe("text");
		});

		it("converts images", () => {
			expect(
				htmlToMarkdown('<img src="image.png" alt="My image" />'),
			).toBe("![My image](image.png)");
		});

		it("handles images without alt", () => {
			expect(htmlToMarkdown('<img src="image.png" />')).toBe(
				"![](image.png)",
			);
		});
	});

	describe("lists", () => {
		it("converts unordered lists", () => {
			const html = "<ul><li>Item 1</li><li>Item 2</li></ul>";
			const result = htmlToMarkdown(html);
			expect(result).toContain("- Item 1");
			expect(result).toContain("- Item 2");
		});

		it("converts ordered lists", () => {
			const html = "<ol><li>First</li><li>Second</li></ol>";
			const result = htmlToMarkdown(html);
			expect(result).toContain("1. First");
			expect(result).toContain("2. Second");
		});

		it("handles nested lists", () => {
			const html =
				"<ul><li>Parent<ul><li>Child</li></ul></li></ul>";
			const result = htmlToMarkdown(html);
			expect(result).toContain("- Parent");
			expect(result).toContain("  - Child");
		});
	});

	describe("blockquotes", () => {
		it("converts blockquotes", () => {
			const result = htmlToMarkdown(
				"<blockquote>Quoted text</blockquote>",
			);
			expect(result).toContain("> Quoted text");
		});

		it("handles multi-line blockquotes", () => {
			const result = htmlToMarkdown(
				"<blockquote><p>Line 1</p><p>Line 2</p></blockquote>",
			);
			const lines = result.split("\n").filter((l: string) => l.startsWith(">"));
			expect(lines.length).toBeGreaterThanOrEqual(2);
		});
	});

	describe("code blocks", () => {
		it("converts pre > code blocks", () => {
			const html = "<pre><code>function foo() {}</code></pre>";
			const result = htmlToMarkdown(html);
			expect(result).toContain("```");
			expect(result).toContain("function foo() {}");
		});

		it("detects language from class", () => {
			const html =
				'<pre><code class="language-javascript">const x = 1;</code></pre>';
			const result = htmlToMarkdown(html);
			expect(result).toContain("```javascript");
		});

		it("handles pre without code", () => {
			const html = "<pre>plain preformatted</pre>";
			const result = htmlToMarkdown(html);
			expect(result).toContain("```");
			expect(result).toContain("plain preformatted");
		});
	});

	describe("tables", () => {
		it("converts simple tables", () => {
			const html = `
				<table>
					<tr><th>Name</th><th>Age</th></tr>
					<tr><td>Alice</td><td>30</td></tr>
					<tr><td>Bob</td><td>25</td></tr>
				</table>
			`;
			const result = htmlToMarkdown(html);
			expect(result).toContain("| Name | Age |");
			expect(result).toContain("| --- | --- |");
			expect(result).toContain("| Alice | 30 |");
			expect(result).toContain("| Bob | 25 |");
		});
	});

	describe("block elements", () => {
		it("converts paragraphs", () => {
			const result = htmlToMarkdown("<p>First</p><p>Second</p>");
			expect(result).toContain("First");
			expect(result).toContain("Second");
		});

		it("converts line breaks", () => {
			const result = htmlToMarkdown("Line 1<br>Line 2");
			expect(result).toContain("Line 1\nLine 2");
		});

		it("converts horizontal rules", () => {
			const result = htmlToMarkdown("<p>Above</p><hr><p>Below</p>");
			expect(result).toContain("---");
		});
	});

	describe("skip tags", () => {
		it("skips script tags", () => {
			const result = htmlToMarkdown(
				"<p>Text</p><script>alert('xss')</script>",
			);
			expect(result).not.toContain("alert");
			expect(result).toContain("Text");
		});

		it("skips style tags", () => {
			const result = htmlToMarkdown(
				"<p>Text</p><style>body{color:red}</style>",
			);
			expect(result).not.toContain("color");
			expect(result).toContain("Text");
		});
	});

	describe("nested structures", () => {
		it("handles bold inside heading", () => {
			const result = htmlToMarkdown(
				"<h2>Title with <strong>bold</strong></h2>",
			);
			expect(result).toBe("## Title with **bold**");
		});

		it("handles link inside list item", () => {
			const result = htmlToMarkdown(
				'<ul><li><a href="https://example.com">Link</a></li></ul>',
			);
			expect(result).toContain("- [Link](https://example.com)");
		});

		it("handles italic inside bold", () => {
			const result = htmlToMarkdown(
				"<strong>bold and <em>italic</em></strong>",
			);
			expect(result).toBe("**bold and _italic_**");
		});
	});

	describe("Google Docs / Word style-based formatting", () => {
		it("converts font-weight:700 spans to bold", () => {
			const html =
				'<p><span style="font-weight: 700;">Bold text</span> normal text</p>';
			const result = htmlToMarkdown(html);
			expect(result).toContain("**Bold text**");
			expect(result).toContain("normal text");
		});

		it("converts font-weight:bold spans to bold", () => {
			const html =
				'<p><span style="font-weight: bold;">Bold</span></p>';
			const result = htmlToMarkdown(html);
			expect(result).toContain("**Bold**");
		});

		it("converts font-style:italic spans to italic", () => {
			const html =
				'<p><span style="font-style: italic;">Italic</span></p>';
			const result = htmlToMarkdown(html);
			expect(result).toContain("_Italic_");
		});

		it("converts text-decoration:line-through spans to strikethrough", () => {
			const html =
				'<p><span style="text-decoration: line-through;">Deleted</span></p>';
			const result = htmlToMarkdown(html);
			expect(result).toContain("~~Deleted~~");
		});

		it("handles combined bold+italic styles", () => {
			const html =
				'<p><span style="font-weight:bold; font-style:italic;">Both</span></p>';
			const result = htmlToMarkdown(html);
			expect(result).toContain("**_Both_**");
		});
	});

	describe("escaping edge cases", () => {
		it("escapes parentheses in link URLs", () => {
			const result = htmlToMarkdown(
				'<a href="https://example.com/path(1)">Link</a>',
			);
			expect(result).toBe("[Link](https://example.com/path(1%29)");
		});

		it("escapes pipes in table cells", () => {
			const html =
				"<table><tr><th>A</th><th>B</th></tr><tr><td>a|b</td><td>c</td></tr></table>";
			const result = htmlToMarkdown(html);
			expect(result).toContain("a\\|b");
		});

		it("handles inline code containing backticks", () => {
			const result = htmlToMarkdown(
				"<code>const x = `y`</code>",
			);
			expect(result).toContain("``");
			expect(result).toContain("const x = `y`");
		});

		it("escapes spaces in image URLs", () => {
			const result = htmlToMarkdown(
				'<img src="path/my image.png" alt="test" />',
			);
			expect(result).toBe("![test](path/my%20image.png)");
		});
	});

	describe("empty list items", () => {
		it("skips empty list items", () => {
			const result = htmlToMarkdown(
				"<ul><li></li><li>Real item</li></ul>",
			);
			expect(result).not.toMatch(/^- $/m);
			expect(result).toContain("- Real item");
		});
	});
});
