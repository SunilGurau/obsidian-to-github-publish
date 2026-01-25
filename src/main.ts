import { debounce, Plugin, TAbstractFile, TFile } from "obsidian";
import {
	DEFAULT_SETTINGS,
	PublishPluginSettings,
	PublishSettingTab,
} from "./settings";

import { extname } from "path";
// import { debounce } from "obsidian";

export default class PublishPlugin extends Plugin {
	settings: PublishPluginSettings;
	// console.log(settings.repo)

	private onModifyHandler = async (file: TAbstractFile) => {
		//if not file a markdown file or push_on_change is false, return
		console.log("filepath:", file.path);
		if (file instanceof TFile) {
			console.log("file extension:", file.extension);
		}
		if (
			!(file instanceof TFile) ||
			extname(file.path) !== ".md" ||
			!this.settings.push_on_change //push
		)
			return;
		// Here you would add the logic to push the file to GitHub using your GithubConnector
		console.log("Pushing because push_on_change is enabled");
		console.log("File Content:", await this.app.vault.read(file));
	};

	async onload() {
		await this.loadSettings();
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new PublishSettingTab(this.app, this));

		this.registerEvent(
			this.app.vault.on(
				"modify",
				debounce(this.onModifyHandler, 3000, true),
			),
		);

		this.addCommand({
			id: "my-plugin-do-something",
			name: "Do something cool",
			callback: () => {
				console.log("Doing something cool!");
			},
		});
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<PublishPluginSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
