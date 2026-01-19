import {App, PluginSettingTab, Setting} from "obsidian";
import MyPlugin from "./main";

export interface PublishPluginSettings {
	github_pat: string;
  owner: string;
  repo: string;
  directory: string;
}

export const DEFAULT_SETTINGS: PublishPluginSettings = {
	github_pat: '',
  owner: '',
  repo: '',
  directory: ''
}

export class PublishSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Repository')
			.addText(text => text
				.setPlaceholder('Enter your repo name')
				.setValue(this.plugin.settings.github_pat)
				.onChange(async (value) => {
					this.plugin.settings.github_pat = value;
					await this.plugin.saveSettings();
				}));

    new Setting(containerEl)  
    .setName('Directory')    
    .addText((text) =>  
      text  
          .setPlaceholder('Enter directory path')  
          .setValue(this.plugin.settings.directory)  
          .onChange(async (value) => {  
            this.plugin.settings.directory = value;
            await this.plugin.saveSettings();
          })
    );

    new Setting(containerEl)  
    .setName('Owner')    
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
    .setName("Personal access token")
    .addText((text) =>  
      text  
          .setPlaceholder('Enter your personal access token')  
          .setValue(this.plugin.settings.github_pat)  
          .onChange(async (value) => {  
            this.plugin.settings.github_pat = value;
            await this.plugin.saveSettings();
          })
    );

	}
}
