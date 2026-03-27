import { Editor, type MarkdownFileInfo, type MarkdownView, Plugin } from "obsidian";
import {
	DEFAULT_SETTINGS,
	SmartPasteSettingTab,
	type SmartPasteSettings,
} from "./src/settings";
import { hasImageInClipboard, processPaste } from "./src/paste-handler";

export default class SmartPastePlugin extends Plugin {
	settings: SmartPasteSettings = DEFAULT_SETTINGS;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.registerEvent(
			this.app.workspace.on(
				"editor-paste",
				(
					evt: ClipboardEvent,
					editor: Editor,
					_info: MarkdownView | MarkdownFileInfo,
				) => {
					if (evt.defaultPrevented) return;
					if (!evt.clipboardData) return;
					if (!this.settings.enabled) return;
					if (hasImageInClipboard(evt.clipboardData)) return;
					if (this.isInsideCodeBlock(editor)) return;
					if (this.isInsideFrontmatter(editor)) return;

					evt.preventDefault();
					void this.handlePaste(evt.clipboardData, editor);
				},
			),
		);

		this.addSettingTab(new SmartPasteSettingTab(this.app, this));
	}

	private async handlePaste(
		clipboardData: DataTransfer,
		editor: Editor,
	): Promise<void> {
		try {
			const result = await processPaste(clipboardData, this.settings);
			if (result.handled) {
				editor.replaceSelection(result.text);
			} else {
				const plain = clipboardData.getData("text/plain");
				if (plain) {
					editor.replaceSelection(plain);
				}
			}
		} catch (e: unknown) {
			const plain = clipboardData.getData("text/plain");
			if (plain) {
				editor.replaceSelection(plain);
			}
			if (e instanceof Error) {
				console.error("Smart Paste error:", e.message);
			}
		}
	}

	private isInsideCodeBlock(editor: Editor): boolean {
		const cursor = editor.getCursor();
		let insideCodeBlock = false;
		for (let i = 0; i <= cursor.line; i++) {
			const line = editor.getLine(i);
			const trimmed = line.trimStart();
			if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
				insideCodeBlock = !insideCodeBlock;
			}
		}
		return insideCodeBlock;
	}

	private isInsideFrontmatter(editor: Editor): boolean {
		const cursor = editor.getCursor();
		if (editor.getLine(0).trim() !== "---") {
			return false;
		}
		for (let i = 1; i <= cursor.line; i++) {
			if (editor.getLine(i).trim() === "---") {
				return cursor.line <= i;
			}
		}
		return true;
	}

	async loadSettings(): Promise<void> {
		const loaded = ((await this.loadData()) ?? {}) as Partial<SmartPasteSettings>;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, loaded);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
