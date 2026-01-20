import { Octokit } from '@octokit/core';

interface Test{
  foo: string;
}
export default class GithubConnector {
  private github_pat: string;
  private owner: string;
  private repo: string;
  private path: string;
  private octokit: Octokit;
  private fooTest: Test;

  constructor(github_pat: string, owner: string, repo: string, path: string) {
    this.github_pat = github_pat;
    this.owner = owner;
    this.repo = repo;
    this.path = path
    this.octokit = new Octokit({
      auth: this.github_pat,
    });
  }

  private async getFileSha() {
  const owner = this.owner;
  const repo = this.repo;
  const path = this.path;

  const response = await this.octokit.request(
    "GET /repos/{owner}/{repo}/contents/{path}",
    { owner, repo, path }
  );

  // console.log(response.data.sha);
  return response.data.sha;
}
  async getFile()
  {
    const res = await this.octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
  owner: this.owner,
  repo: this.repo,
  path: this.path,
  headers: {
    'X-GitHub-Api-Version': '2022-11-28'
  }
})
    return res;
  }

  async createFile()
  {
    const res = await this.octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
  owner: this.owner,
  repo: this.repo,
  path: this.path,
  message: 'obsidian note added',
  committer: {
    name: 'name here',
    email: 'email here'
  },
  content: 'bXkgbmV3IGZpbGUgY29udGVudHM=',
  headers: {
    'X-GitHub-Api-Version': '2022-11-28'
  }
})
  }

  async updateFile()
  {
    const fileSha = await this.getFileSha();
    console.debug("File SHA", fileSha);
    const res = await this.octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
      owner: this.owner,
      repo: this.repo,
      path: this.path,
      message: 'obsidian note updated',
      committer: {
        name: 'name here',
        email: 'email here'
      },
      content: 'bXkgdXBkYXRlZCBmaWxlIGNvbnRlbnRz',
      sha: fileSha,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })
    
  }
}

function main(){

  const connector = new GithubConnector(
    "github_pat_here",
    "SunilGurau",
    "portfolio-website",
    // "test.txt")
    "test.txt")
  connector.updateFile().then(res => {
    // console.debug(res); // actual file info
  }).catch(err => {
    console.error(err);
  });

}

main();



