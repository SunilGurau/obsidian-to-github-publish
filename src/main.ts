import { debounce, Notice, Plugin, TFile } from 'obsidian';
import GithubConnector from './githubClient';
import {
	DEFAULT_SETTINGS,
	PublishPluginSettings,
	PublishSettingTab,
} from './settings';

import { RequestError } from '@octokit/request-error';
import {
	areSameBase64Contents,
	base64EncodeFile,
	getEmbeddedFiles,
	getFrontmatterTags,
	getOutgoingLinks,
} from 'utils';

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

	private pushFileToGitHub = async (
		filePath: string,
		fileContent: string,
		pushMode: 'create' | 'update',
		sha: string | undefined = undefined
	) => {
		if (pushMode === 'update') {
			try {
				await this.githubConnector.updateFile(
					filePath,
					fileContent,
					{
						name: this.settings.committer.name,
						email: this.settings.committer.email,
					},
					sha
				);
				new Notice(`File ${filePath} updated on GitHub successfully.`);
			} catch (error) {
				console.log(`Error updating file ${filePath} on GitHub:`, error);
				new Notice(`Error updating file ${filePath} on GitHub`);
				throw error;
			}
		} else if (pushMode === 'create') {
			try {
				await this.githubConnector.createFile(filePath, fileContent, {
					name: this.settings.committer.name,
					email: this.settings.committer.email,
				});
				new Notice(`File ${filePath} created on GitHub successfully.`);
			} catch (error) {
				//when the embed file already exists, do nothing
				if (error instanceof RequestError && error.response?.status === 422) {
					return;
				}
				new Notice(`Error creating file ${filePath} on GitHub.`);
				throw error;
			}
		}
	};

	private onModifyHandler = async (file: TFile) => {
		if (!this.settings.push_on_change) return;
		console.log(`currently modifying file: ${file.path}`);

		const visited = new Set<string>();
		const stack: TFile[] = [file];

		while (stack.length > 0) {
			const file = stack.pop()!; // LIFO → stack behavior

			// Skip if already visited
			if (visited.has(file.path)) {
				continue;
			}

			//skip if the file has no "publish" tag in frontmatter
			const tags = getFrontmatterTags(file, this.app);
			console.log(`Frontmatter tags for file ${file.path}:`, tags);

			//if tag_to_publish is set, only push files that have that tag
			//if tag_to_publish is not set, push all modified files
			if (
				this.settings.tag_to_publish &&
				!tags.includes(this.settings.tag_to_publish)
			) {
				console.log(
					`File ${file.path} has no '${this.settings.tag_to_publish}' tag. Cannot push changes.`
				);
				new Notice(
					`File ${file.path} has no '${this.settings.tag_to_publish}' tag. Cannot push changes.`
				);
				continue;
			}
			visited.add(file.path);

			let localFileContent;
			//read the local file content
			try {
				localFileContent = await this.app.vault.read(file);
			} catch {
				new Notice(`Error reading content of file: ${file.path}`);
				return;
			}
			const encodedContent = btoa(localFileContent);

			//read the file content from github and compare with local content
			let response;
			let sha;
			let pushMode: 'create' | 'update' = 'create';
			try {
				response = await this.githubConnector.getFile(file.path);
				if ('content' in response.data) {
					console.log('Response:', response.data.content.trim());
					console.log('Encoded Content:', encodedContent.trim());
					console.log(
						'Are equal:',
						areSameBase64Contents(response.data.content, encodedContent)
					);
					//dont push a note if it hasnt changed
					//consequently, the notes associated with it will also not be pushed
					//at least not directly because of this note
					if (areSameBase64Contents(response.data.content, encodedContent)) {
						// No changes detected
						new Notice(`No changes detected for file ${file.path}.`);
						// continue;
						return;
					}
				}

				if (response.status === 200) {
					pushMode = 'update';
					if ('sha' in response.data) sha = response.data.sha;
				}
			} catch (error) {
				if (error instanceof RequestError) {
					//satisfy TypeScript
					//file not found on github, so create it
					if (error.response?.status === 404) {
						pushMode = 'create';
					} else {
						console.log('Unauthorized access or other error');
						new Notice('Unauthorized access or other error');
						return;
					}
				} else {
					console.log('Network error while accessing GitHub');
					new Notice('Network error while accessing GitHub');
					return;
				}
			}
			try {
				await this.pushFileToGitHub(file.path, encodedContent, pushMode, sha);
			} catch {
				return; //stop processing further if there was an error pushing the main file
			}
			//should i wrap this in pushMode === 'update'? conditional
			// Also process embedded files
			if (this.settings.embeds_included) {
				const embeddedFiles = getEmbeddedFiles(file, this.app);
				// Optional: reverse to preserve same order as recursive DFS

				for (let i = embeddedFiles.length - 1; i >= 0; i--) {
					const embeddedFile = embeddedFiles[i];
					if (embeddedFile === undefined) continue; //satisfy TypeScript
					console.log('Processing embedded file:', embeddedFile.path);
					//skip if the
					await this.pushFileToGitHub(
						embeddedFile.path,
						await base64EncodeFile(embeddedFile, this.app),
						'create'
					);
				}
			}
			//recursively call the modify handler for all linked files
			if (this.settings.recursive_publish) {
				const outgoing = getOutgoingLinks(file, this.app);
				// Optional: reverse to preserve same order as recursive DFS
				for (let i = outgoing.length - 1; i >= 0; i--) {
					const linkedFile = outgoing[i];
					if (linkedFile === undefined) continue; //satisfy TypeScript

					if (!visited.has(linkedFile.path)) {
						stack.push(linkedFile);
					}
				}
			}
		}
	};
	private uploadTimeout: NodeJS.Timeout | null = null;
	private uploading = false;

	private async scheduleUpload(file: TFile, delay: number) {
		console.log(
			`Scheduling upload for file: ${file.path} with delay: ${delay}ms`
		);
		if (this.uploadTimeout) clearTimeout(this.uploadTimeout);
		this.uploadTimeout = setTimeout(async () => {
			console.log(`Executing scheduled upload for file: ${file.path}`);
			if (this.uploading) return;

			this.uploading = true;
			try {
				await this.onModifyHandler(file);
			} finally {
				this.uploading = false;
				this.uploadTimeout = null;
			}
		}, delay);
	}

	async onload() {
		await this.loadSettings();
		// Initialize GitHub Connector
		this.initializeGithubConnector();
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new PublishSettingTab(this.app, this));
		const debouncedPushHandler = debounce(this.onModifyHandler, 6000, true);
		this.registerEvent(
			this.app.vault.on('modify', async (file: TFile) => {
				await this.scheduleUpload(file, 6000);
			})
		);
		//add push button to the ribbon
		this.addRibbonIcon('upload', 'Push to GitHub', async () => {
			const activeFile = this.app.workspace.getActiveFile();
			if (activeFile) {
				await this.scheduleUpload(activeFile, 0);
			} else {
				new Notice('No active file to push.');
			}
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
