import { Notice, Plugin, TFile } from 'obsidian';
import GithubConnector from './githubClient';
import {
	DEFAULT_SETTINGS,
	PublishPluginSettings,
	PublishSettingTab,
} from './settings';

import { ReturnTypeOf } from '@octokit/core/dist-types/types';
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
				// console.log(`Error updating file ${filePath} on GitHub:`, error);
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
			// console.log(`Frontmatter tags for file ${file.path}:`, tags);

			//if tag_to_publish is set, only push files that have that tag
			//if tag_to_publish is not set, push all modified files
			if (
				this.settings.tag_to_publish &&
				!tags.includes(this.settings.tag_to_publish)
			) {
				// console.log(
				// 	`File ${file.path} has no '${this.settings.tag_to_publish}' tag. Cannot push changes.`
				// );
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
					// console.log('Response:', response.data.content.trim());
					// console.log('Encoded Content:', encodedContent.trim());
					// console.log(
					// 	'Are equal:',
					// 	areSameBase64Contents(response.data.content, encodedContent)
					// );

					//dont push a note if it hasnt changed
					//consequently, the notes associated with it will also not be pushed
					//at least not directly because of this note
					if (areSameBase64Contents(response.data.content, encodedContent)) {
						// No changes detected
						new Notice(`No changes detected for file ${file.path}.`);
						// continue;
						return 'no change';
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
						// console.log('Unauthorized access or other error');
						new Notice('Unauthorized access or other error');
						return;
					}
				} else {
					// console.log('Network error while accessing GitHub');
					new Notice('Network error while accessing GitHub');
					return;
				}
			}
			try {
				await this.pushFileToGitHub(file.path, encodedContent, pushMode, sha);
			} catch {
				// console.log('Error caught');
				return; //stop processing further if there was an error pushing the main file
			}
			//should i wrap this in pushMode === 'update'? conditional
			// Also process embedded files
			if (this.settings.embeds_included) {
				const embeddedFiles = getEmbeddedFiles(file, this.app);
				// Optional: reverse to preserve same order as recursive DFS

				// console.log('Embedded files to process:', embeddedFiles);
				for (let i = embeddedFiles.length - 1; i >= 0; i--) {
					const embeddedFile = embeddedFiles[i];
					if (embeddedFile === undefined) continue; //satisfy TypeScript
					// console.log('Processing embedded file:', embeddedFile.path);
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
	// private debounceTimeout: ReturnType<typeof setTimeout> | null = null;
	// private delayTimeout: ReturnType<typeof setTimeout> | null = null;
	// private uploading = false;

	// //debounce the upload to avoid multiple uploads when multiple changes are made in a short period of time
	// private async scheduleUpload(
	// 	file: TFile,
	// 	delay: number,
	// 	debounceInterval: number
	// ) {
	//   let debounceTimeoutExpired = false;
	//   let delayTimeoutExpired = false;
	// 	if (this.debounceTimeout) {
	// 		new Notice('Upload already scheduled, resetting timer.');
	// 		debounceTimeoutExpired = true;
	// 		clearTimeout(this.debounceTimeout); //cancel the pending upload
	// 	}
	// 	this.delayTimeout = setTimeout(() => {
	// 		this.delayTimeout = null;
	// 		this.debounceTimeout = setTimeout(
	// 			() => {
	// 				void this.onModifyHandler(file);
	// 				this.debounceTimeout = null;
	// 			},
	// 			this.debounceTimeout ? Math.max(debounceInterval-delay, 0) : 0
	// 		);
	// 	}, delay);
	// }

	private debounce(
		cb: (file: TFile) => Promise<string | void>,
		timeout: number
	) {
		let buttonTimeoutExpired = true;
		let modifyTimeoutExpired = true;

		let start: number | undefined;
		let elapsed: number;
		let modifyTimer: ReturnTypeOf<typeof setTimeout>;
		let buttonCallback = async (file: TFile) => {
			console.log('buttonTimeoutExpired', buttonTimeoutExpired);
			if (buttonTimeoutExpired) {
				console.log('Button Timeout expired is true');
				if (!modifyTimeoutExpired) {
					clearTimeout(modifyTimer);
					//mark it true so that the function handles other modification in the future
					modifyTimeoutExpired = true;
				}
				start = Date.now();
				//mark it false so that push button does not work before 'timeout' duration
				buttonTimeoutExpired = false;
				//run the function right after the button is pushed, not after timeout
				if ((await cb(file)) === 'no change') {
					buttonTimeoutExpired = true;
					return;
				}
				elapsed = Date.now() - start;
				setTimeout(() => {
					//mark it true so that the button push works again after 'timeout' duration
					buttonTimeoutExpired = true;
				}, timeout - elapsed); //account for the time spent in running the callback function
			}
			//when the timeout has not expired, deny the action and do not reset the current timeout
			else if (!buttonTimeoutExpired) {
				if (start !== undefined) {
					elapsed = Date.now() - start;
				}
				const waitFor = (timeout - elapsed) / 1000;
				new Notice(
					`Upload already scheduled, wait for ${Math.ceil(waitFor)}s before you can upload again.`
				);
				return;
			}
		};
		let modifyCallback = (file: TFile) => {
			if (!modifyTimeoutExpired) {
				clearTimeout(modifyTimer);
			}
			//mark it false so that the modification before the timeout expires cause renewal of the timer
			//so that a new timer is set
			modifyTimeoutExpired = false;
			modifyTimer = setTimeout(() => {
				void cb(file);
				//mark it true so that the function handles other modification in the future
				modifyTimeoutExpired = true;
			}, timeout);
		};
		return { buttonCallback, modifyCallback };
	}

	async onload() {
		await this.loadSettings();
		// Initialize GitHub Connector
		this.initializeGithubConnector();
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new PublishSettingTab(this.app, this));

		const { buttonCallback, modifyCallback } = this.debounce(
			this.onModifyHandler,
			60000
		);

		this.registerEvent(
			this.app.vault.on('modify', (file: TFile) => {
				modifyCallback(file);
			})
		);
		//add push button to the ribbon
		this.addRibbonIcon('upload', 'Push to GitHub', async () => {
			const activeFile = this.app.workspace.getActiveFile();
			if (activeFile) {
				await buttonCallback(activeFile);
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
