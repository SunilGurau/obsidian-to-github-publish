import { App, PluginSettingTab, Setting } from 'obsidian';
import MyPlugin from './main';

export interface PublishPluginSettings {
	github_pat: string;
	owner: string;
	repo: string;
	branch: string;
	path: string;
	committer: {
		name: string;
		email: string;
	};
	push_on_change: boolean;
}

export const DEFAULT_SETTINGS: PublishPluginSettings = {
	github_pat: '',
	owner: '',
	repo: '',
	branch: '',
	path: '',
	committer: {
		name: '',
		email: '',
	},
	push_on_change: false,
};

export class PublishSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Repository')
			.setDesc('GitHub repository name to publish files to.')
			.addText((text) =>
				text
					.setPlaceholder('Enter your repo name')
					.setValue(this.plugin.settings.repo)
					.onChange(async (value) => {
						this.plugin.settings.repo = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Branch')
			.setDesc('Branch in the repository to publish files to.')
			.addText((text) =>
				text
					.setPlaceholder('Enter branch name')
					.setValue(this.plugin.settings.branch)
					.onChange(async (value) => {
						this.plugin.settings.branch = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Path')
			.setDesc('Path in the repository to publish files to.')
			.addText((text) =>
				text
					.setPlaceholder('Enter file path')
					.setValue(this.plugin.settings.path)
					.onChange(async (value) => {
						this.plugin.settings.path = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Owner')
			.setDesc('GitHub repository owner.')
			.addText((text) =>
				text
					.setPlaceholder('Enter repository owner')
					.setValue(this.plugin.settings.owner)
					.onChange(async (value) => {
						this.plugin.settings.owner = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName('Personal access token')
			.setDesc('Personal access token with write access to the repository.')
			.addText((text) =>
				text
					.setPlaceholder('Enter your PAT')
					.setValue(this.plugin.settings.github_pat)
					.onChange(async (value) => {
						this.plugin.settings.github_pat = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Committer Name')
			.setDesc('Name of the committer for GitHub commits.')
			.addText((text) =>
				text
					.setPlaceholder('Enter committer name')
					.setValue(this.plugin.settings.committer.name)
					.onChange(async (value) => {
						this.plugin.settings.committer.name = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Committer Email')
			.setDesc('Email of the committer for GitHub commits.')
			.addText((text) =>
				text
					.setPlaceholder('Enter committer email')
					.setValue(this.plugin.settings.committer.email)
					.onChange(async (value) => {
						this.plugin.settings.committer.email = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName('Push on change')
			.setDesc('Automatically push changes to GitHub when a file is modified.')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.push_on_change)
					.onChange(async (value) => {
						this.plugin.settings.push_on_change = value;
						await this.plugin.saveSettings();
						this.display();
					})
			);
	}
}
