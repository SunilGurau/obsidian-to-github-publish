import { Octokit } from '@octokit/core';
import { TAbstractFile, TFile } from 'obsidian';

export default class GithubConnector {
	private github_pat: string;
	private owner: string;
	private repo: string;
	private branch: string;
	private path: string;
	private octokit: Octokit;

	constructor(
		github_pat: string,
		owner: string,
		repo: string,
		branch: string,
		path: string = ''
	) {
		this.github_pat = github_pat;
		this.owner = owner;
		this.repo = repo;
		this.branch = branch;
		this.path = path;
		this.octokit = new Octokit({
			auth: this.github_pat,
		});
	}

	// private async getFileSha(filepath: string): Promise<string> {
	// 	const owner = this.owner;
	// 	const repo = this.repo;
	// 	const path = filepath;

	// 	const response = await this.octokit.request(
	// 		'GET /repos/{owner}/{repo}/contents/{path}',
	// 		{ owner, repo, path }
	// 	);

	// 	// console.log(response.data.sha);
	// 	return response.data.sha;
	// }
	async getFile(filepath: string) {
		const res = await this.octokit.request(
			'GET /repos/{owner}/{repo}/contents/{path}',
			{
				owner: this.owner,
				repo: this.repo,
				ref: this.branch,
				path: this.path + '/' + filepath,
				headers: {
					'X-GitHub-Api-Version': '2022-11-28',
				},
			}
		);
		return res;
	}

	async createFile(
		filepath: string,
		content: string,
		committer: { name: string; email: string }
	) {
		const res = await this.octokit.request(
			'PUT /repos/{owner}/{repo}/contents/{path}',
			{
				owner: this.owner,
				repo: this.repo,
				branch: this.branch,
				path: this.path + '/' + filepath,
				message: 'obsidian note added',
				committer: {
					name: committer.name,
					email: committer.email,
				},
				content: content,
				headers: {
					'X-GitHub-Api-Version': '2022-11-28',
				},
			}
		);
	}

	async updateFile(
		filepath: string,
		content: string,
		committer: { name: string; email: string },
		sha: string
	) {
		const res = await this.octokit.request(
			'PUT /repos/{owner}/{repo}/contents/{path}',
			{
				owner: this.owner,
				repo: this.repo,
				path: this.path + '/' + filepath,
				branch: this.branch,

				message: 'obsidian note updated',
				committer: {
					name: committer.name,
					email: committer.email,
				},
				content: content,
				sha: sha,
				headers: {
					'X-GitHub-Api-Version': '2022-11-28',
				},
			}
		);
	}
}

// function main() {
// 	const connector = new GithubConnector(
// 		'github pat here',
// 		'SunilGurau',
// 		'portfolio-website',
// 		// "test.txt")
// 		'portfolio-site/test.txt'
// 	);
// 	connector
// 		.getFileSha()
// 		.then((res) => {
// 			// console.debug(res); // actual file info
// 		})
// 		.catch((err) => {
// 			console.error(err);
// 		});
// }

// main();
