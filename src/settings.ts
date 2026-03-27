import { App, PluginSettingTab, Setting } from "obsidian";
import type SmartPastePlugin from "../main";

export interface SmartPasteSettings {
	enabled: boolean;
	htmlToMarkdown: boolean;
	urlLinkFetching: boolean;
	trackerStripping: boolean;
	whitespaceNormalization: boolean;
	customTrackingParams: string;
}

export const DEFAULT_SETTINGS: SmartPasteSettings = {
	enabled: true,
	htmlToMarkdown: true,
	urlLinkFetching: true,
	trackerStripping: true,
	whitespaceNormalization: true,
	customTrackingParams: "",
};

export class SmartPasteSettingTab extends PluginSettingTab {
	plugin: SmartPastePlugin;

	constructor(app: App, plugin: SmartPastePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Behavior")
			.setHeading();

		new Setting(containerEl)
			.setName("Enable smart paste")
			.setDesc(
				"When enabled, clipboard content is automatically cleaned and transformed on paste.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enabled)
					.onChange(async (value) => {
						this.plugin.settings.enabled = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Transforms")
			.setHeading();

		new Setting(containerEl)
			.setName("Convert HTML to Markdown")
			.setDesc(
				"Convert rich HTML clipboard content into clean Markdown.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.htmlToMarkdown)
					.onChange(async (value) => {
						this.plugin.settings.htmlToMarkdown = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Fetch link titles for urls")
			.setDesc(
				"When pasting a bare URL, fetch the page title and create a Markdown link.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.urlLinkFetching)
					.onChange(async (value) => {
						this.plugin.settings.urlLinkFetching = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Strip tracking parameters from urls")
			.setDesc(
				"Remove common tracking parameters like utm_source, fbclid, and gclid from urls.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.trackerStripping)
					.onChange(async (value) => {
						this.plugin.settings.trackerStripping = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Normalize whitespace")
			.setDesc(
				"Clean up excessive blank lines, trailing spaces, and inconsistent line endings.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.whitespaceNormalization)
					.onChange(async (value) => {
						this.plugin.settings.whitespaceNormalization = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Advanced")
			.setHeading();

		new Setting(containerEl)
			.setName("Custom tracking parameters")
			.setDesc(
				"Comma-separated list of additional URL parameters to strip.",
			)
			.addTextArea((text) =>
				text
					.setPlaceholder("Param1, param2, param3")
					.setValue(this.plugin.settings.customTrackingParams)
					.onChange(async (value) => {
						this.plugin.settings.customTrackingParams = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
