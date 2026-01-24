import { debounce, Plugin, TAbstractFile, TFile } from "obsidian";
import {
	DEFAULT_SETTINGS,
	PublishPluginSettings,
	PublishSettingTab,
} from "./settings";

// import { debounce } from "obsidian";

export default class PublishPlugin extends Plugin {
	settings: PublishPluginSettings;
	// console.log(settings.repo)

	async onload() {
		await this.loadSettings();
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new PublishSettingTab(this.app, this));

		//acts as a decorator to limit the rate of function calls
		//takes a function and returns a new function that can only be called once every X milliseconds
		const onModify = debounce(
			async (file: TFile) => {
				const content = await this.app.vault.read(file);
				console.log("Debounced modify:", file.path);
				console.log("Content:", content);
			},
			5000,
			true,
		);

		this.registerEvent(
			this.app.vault.on("modify", (file: TAbstractFile) => {
				if (file instanceof TFile) {
					onModify(file);
				}
			}),
		);
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<MyPluginSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
