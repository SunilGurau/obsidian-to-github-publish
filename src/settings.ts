import {App, PluginSettingTab, Setting} from "obsidian";
import MyPlugin from "./main";

export interface PublishPluginSettings {
	github_pat: string;
  owner: string;
  repo: string;
  directory: string;
  push_on_change: boolean;
}

export const DEFAULT_SETTINGS: PublishPluginSettings = {
	github_pat: '',
  owner: '',
  repo: '',
  directory: '',
  push_on_change: false
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
      .setDesc('GitHub repository name to publish files to.')
			.addText(text => text
				.setPlaceholder('Enter your repo name')
				.setValue(this.plugin.settings.github_pat)
				.onChange(async (value) => {
					this.plugin.settings.github_pat = value;
					await this.plugin.saveSettings();
				}));

    new Setting(containerEl)  
    .setName('Directory')
    .setDesc('Directory in the repository to publish files to.')   
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
    .setName("Personal access token")
    .setDesc("Personal access token with write access to the repository.")
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
    .setName('Push on change')
    .setDesc('Automatically push changes to GitHub when a file is modified.')
    .addToggle(toggle => toggle  
       .setValue(this.plugin.settings.push_on_change)  
       .onChange(async (value) => {  
          this.plugin.settings.push_on_change = value;  
          await this.plugin.saveSettings();  
          this.display();  
       })  
    );
	}
}
