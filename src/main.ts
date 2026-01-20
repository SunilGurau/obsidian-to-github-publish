import {App, Editor, MarkdownView, Modal, Notice, Plugin, requestUrl, RequestUrlParam} from 'obsidian';
import {DEFAULT_SETTINGS, PublishPluginSettings, PublishSettingTab} from "./settings";

export default class PublishPlugin extends Plugin {
	settings: PublishPluginSettings;
  // console.log(settings.repo)

	async onload() {
		await this.loadSettings();
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new PublishSettingTab(this.app, this));
    
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<MyPluginSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
