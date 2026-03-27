# Smart Paste

A plugin that intercepts paste events and automatically cleans and transforms clipboard content before it reaches your notes. Raw HTML is converted to clean Markdown, bare URLs become titled links, tracking parameters are stripped, and whitespace is normalized.

## Features

- **HTML to Markdown conversion** -- Copy content from any web page and paste it as clean Markdown. Supports headings, bold, italic, strikethrough, links, images, ordered and unordered lists (including nested), blockquotes, code blocks with language detection, tables, and horizontal rules. Also handles Google Docs and Microsoft Word style-based formatting (bold/italic/strikethrough via inline styles on `<span>` elements).
- **Link title fetching** -- Paste a bare URL and the plugin fetches the page title, replacing it with a proper `[Page Title](url)` Markdown link. Falls back gracefully to the plain URL if the title cannot be fetched within 5 seconds.
- **Tracking parameter removal** -- Automatically strips common tracking parameters from URLs: `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `utm_id`, `fbclid`, `gclid`, `gclsrc`, `mc_cid`, `mc_eid`, `msclkid`, `twclid`, `igshid`, `_ga`, `_gl`, `yclid`, `_hsenc`, `_hsmi`, `vero_id`, `mkt_tok`, and any custom parameters you configure.
- **Amazon URL cleaning** -- Strips `/ref=` tracking paths from Amazon and amzn.to product URLs.
- **Whitespace normalization** -- Collapses three or more consecutive blank lines down to two, trims trailing whitespace from each line, and normalizes line endings to LF.
- **Code block awareness** -- Detects when the cursor is inside a fenced code block (both backtick and tilde fences) and passes the paste through without any transformation.
- **Frontmatter awareness** -- Detects when the cursor is inside YAML frontmatter and passes the paste through untouched.
- **Image pass-through** -- Clipboard content containing images is never intercepted, preserving the default image paste behavior.

## How it works

When you paste (`Ctrl/Cmd+V`), the plugin checks the following conditions in order:

1. If the paste event was already handled by another plugin, it does nothing.
2. If the clipboard contains an image, it does nothing (default handling).
3. If the cursor is inside a fenced code block, it does nothing.
4. If the cursor is inside YAML frontmatter, it does nothing.
5. If the plugin is disabled in settings, it does nothing.

Only after all these checks pass does the plugin intercept the paste and apply transforms:

- If the clipboard has HTML content and HTML-to-Markdown conversion is enabled, it converts the HTML to Markdown, optionally cleans embedded URLs, and normalizes whitespace.
- If the clipboard has plain text containing a single bare URL, it optionally strips tracking parameters and fetches the page title.
- If the clipboard has plain text with embedded URLs, it cleans tracking parameters from each URL in place.

## Installation

### Community plugins (once accepted)

1. Open Settings
2. Go to Community plugins and disable Restricted mode
3. Click Browse and search for "Smart Paste"
4. Click Install, then Enable

### Manual

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/konstantinosGkilas/smart-paste/releases/latest)
2. Create a folder called `smart-paste` inside your vault's `.obsidian/plugins/` directory
3. Copy the three downloaded files into that folder
4. Open Settings > Community plugins, find Smart Paste, and enable it

### From source

```bash
git clone https://github.com/konstantinosGkilas/smart-paste.git
cd smart-paste
npm install
npm run build
```

Copy `main.js`, `manifest.json`, and `styles.css` into your vault's `.obsidian/plugins/smart-paste/` directory.

## Settings

All settings are found under Settings > Community plugins > Smart Paste.

| Setting | Default | Description |
|---|---|---|
| Enable smart paste | On | Master toggle. When disabled, all paste events pass through normally. |
| Convert HTML to Markdown | On | Converts rich HTML clipboard content into clean Markdown. |
| Fetch link titles for urls | On | When pasting a single bare URL, fetches the page title and creates a `[title](url)` link. |
| Strip tracking parameters from urls | On | Removes common tracking parameters from all URLs in pasted content. |
| Normalize whitespace | On | Collapses excessive blank lines, trims trailing spaces, and normalizes line endings. |
| Custom tracking parameters | Empty | A comma-separated list of additional URL parameter names to strip beyond the built-in defaults. |

## Supported HTML elements

The HTML-to-Markdown converter handles the following elements:

| HTML | Markdown |
|---|---|
| `<h1>` through `<h6>` | `#` through `######` |
| `<strong>`, `<b>` | `**bold**` |
| `<em>`, `<i>` | `_italic_` |
| `<del>`, `<s>` | `~~strikethrough~~` |
| `<a href="...">` | `[text](url)` |
| `<img>` | `![alt](src)` |
| `<ul>`, `<ol>`, `<li>` | `- item` or `1. item` (nested with indentation) |
| `<blockquote>` | `> quoted text` |
| `<pre><code>` | Fenced code block with language detection |
| `<code>` | `` `inline code` `` |
| `<table>` | Pipe-delimited Markdown table |
| `<br>` | Line break |
| `<hr>` | `---` |
| `<p>`, `<div>` | Block-level separation |
| `<sup>`, `<sub>` | `<sup>`, `<sub>` (inline HTML) |
| `<span style="font-weight:bold">` | `**bold**` (Google Docs / Word) |
| `<span style="font-style:italic">` | `_italic_` (Google Docs / Word) |
| `<span style="text-decoration:line-through">` | `~~strikethrough~~` (Google Docs / Word) |
| `<script>`, `<style>`, `<meta>` | Stripped entirely |

## Development

```bash
npm install          # Install dependencies
npm run dev          # Watch mode with inline source maps
npm run build        # Production build (minified, no source maps)
npm run lint         # Run eslint with obsidianmd plugin rules
npm test             # Run unit tests
```

### Project structure

```
main.ts                      Entry point, paste event registration
src/
  settings.ts                Settings interface and settings tab
  paste-handler.ts           Orchestration: clipboard data to processed text
  html-to-markdown.ts        DOMParser-based HTML to Markdown converter
  url-cleaner.ts             URL cleaning and tracking parameter removal
  url-titler.ts              Page title fetching via requestUrl
  whitespace.ts              Whitespace normalization
tests/
  html-to-markdown.test.ts   HTML conversion tests (34 cases)
  url-cleaner.test.ts        URL cleaning tests (22 cases)
  whitespace.test.ts         Whitespace normalization tests (10 cases)
eslint.config.mjs            ESLint 9 flat config with obsidianmd plugin
esbuild.config.mjs           esbuild bundler configuration
jest.config.js               Jest test runner configuration
tsconfig.json                TypeScript strict mode configuration
```

### Design decisions

- **Zero runtime dependencies.** The HTML-to-Markdown converter is hand-rolled using the browser's built-in `DOMParser` API. No external libraries are bundled.
- **All transforms are individually toggleable.** Each feature can be enabled or disabled independently in settings.
- **Checks before `preventDefault()`.** The plugin checks for images, code blocks, frontmatter, and the enabled state before intercepting the paste event. This ensures default behavior is always preserved when the plugin should not act.
- **Title fetch timeout.** URL title fetching uses `Promise.race` with a 5-second timeout to avoid blocking the paste operation on slow or unresponsive servers.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Write tests for your changes
4. Run `npm run lint` and `npm test` to verify
5. Submit a pull request

## License

[MIT](LICENSE)
