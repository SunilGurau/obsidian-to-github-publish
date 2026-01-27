import { debounce, Plugin, TAbstractFile, TFile } from 'obsidian';
import {
	DEFAULT_SETTINGS,
	PublishPluginSettings,
	PublishSettingTab,
} from './settings';
import GithubConnector from './githubClient';

// import { debounce } from "obsidian";

export default class PublishPlugin extends Plugin {
	settings: PublishPluginSettings;
	// console.log(settings.repo)
	githubConnector: GithubConnector;

	private initializeGithubConnector() {
		this.githubConnector = new GithubConnector(
			this.settings.github_pat,
			this.settings.owner,
			this.settings.repo,
			this.settings.branch,
			this.settings.path
		);
	}
	private onModifyHandler = async (file: TAbstractFile) => {
		//if not file a markdown file or push_on_change is false, return
		console.log('filepath:', file.path);
		console.log('push_on_change:', this.settings.push_on_change);
		console.log('remote path:', this.settings.path);
		console.log('file instance of TFile:', file instanceof TFile);
		console.log(
			'file extension:',
			file instanceof TFile ? file.extension : 'N/A'
		);
		console.log('Evaluating conditions to push file to GitHub...');
		if (
			!(file instanceof TFile) ||
			file.extension !== 'md' ||
			!this.settings.push_on_change //push
		)
			return;

		// if (file instanceof TFile) {
		// 	console.log('file extension:', file.extension);
		// }
		// // Here you would add the logic to push the file to GitHub using your GithubConnector
		// console.log('Pushing because push_on_change is enabled');
		// console.log('File Content:', await this.app.vault.read(file));
		let fileContent: string;

		try {
			fileContent = await this.app.vault.read(file);
		} catch {
			console.error('Error reading file content');
			return;
		}
		console.log('Encoding content to base64');
		const encodedContent = Buffer.from(fileContent).toString('base64');
		console.log('Encoded Content:', encodedContent);

		let response;
		try {
			response = await this.githubConnector.getFile(file.path);
			console.log('File exists on GitHub.');
			let sha = response.data.sha;
			console.log('File SHA:', sha);
			try {
				await this.githubConnector.updateFile(
					file.path,
					encodedContent,
					{
						name: this.settings.committer.name,
						email: this.settings.committer.email,
					},
					sha
				);
				console.log(`File ${file.path} updated on GitHub successfully.`);
			} catch (error) {
				console.error('Error updating file:', error);
			}
		} catch (error) {
			if (error.response.status === 404) {
				console.log('File does not exist on GitHub. Creating new file.');
				try {
					await this.githubConnector.createFile(file.path, encodedContent, {
						name: this.settings.committer.name,
						email: this.settings.committer.email,
					});
					console.log(`File ${file.path} pushed to GitHub successfully.`);
				} catch (error) {
					console.error('Error creating file:', error);
				}
			} else {
				console.error(
					'Error fetching file from GitHub:',
					error.response.data.message
				);
			}
		}

		// try {
		// 	await this.githubConnector.createFile(file.path, encodedContent, {
		// 		name: this.settings.committer.name,
		// 		email: this.settings.committer.email,
		// 	});
		// 	console.log(`File ${file.path} pushed to GitHub successfully.`);
		// } catch (error) {
		// 	console.error('Error creating file:', error);
		// }
	};

	async onload() {
		await this.loadSettings();
		// Initialize GitHub Connector
		this.initializeGithubConnector();
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new PublishSettingTab(this.app, this));

		this.registerEvent(
			this.app.vault.on('modify', debounce(this.onModifyHandler, 6000, true))
		);
		this.addCommand({
			id: 'my-plugin-do-something',
			name: 'Do something cool',
			callback: () => {
				console.log('Doing something cool!');
			},
		});
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<PublishPluginSettings>
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
