import {App, Editor, MarkdownView, Modal, Notice, Plugin, requestUrl, RequestUrlParam} from 'obsidian';
import {DEFAULT_SETTINGS, PublishPluginSettings, PublishSettingTab} from "./settings";
import { Octokit } from '@octokit/core';

// Remember to rename these classes and interfaces!
class GithubConnector {
  private github_pat: string;
  private owner: string;
  private repo: string;
  private octokit: Octokit;

  constructor(github_pat: string, owner: string, repo: string) {
    this.github_pat = github_pat;
    this.owner = owner;
    this.repo = repo;
    this.octokit = new Octokit({
      auth: this.github_pat,
    });
  }

}

  // Octokit.js
// https://github.com/octokit/core.js#readme

await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
  owner: 'OWNER',
  repo: 'REPO',
  path: 'PATH',
  message: 'a new commit message',
  committer: {
    name: 'Monalisa Octocat',
    email: 'octocat@github.com'
  },
  content: 'bXkgdXBkYXRlZCBmaWxlIGNvbnRlbnRz',
  sha: '95b966ae1c166bd92f8ae7d1c313e738c731dfc3',
  headers: {
    'X-GitHub-Api-Version': '2022-11-28'
  }
})
  async uploadFile(path: string, content: string, directory: string): Promise<void> {
    const apiUrl = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${directory}/${path}`;

    const requestParam:RequestUrlParam = {
      url: apiUrl,
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${this.github_pat}`,
        "Content-Type": "application/json"
      },
    };
    await requestUrl(requestParam);
  }
}


export default class PublishPlugin extends Plugin {
	settings: PublishPluginSettings;

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
