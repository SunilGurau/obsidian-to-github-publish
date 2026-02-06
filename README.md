# Obsidian to GitHub Publish

An Obsidian plugin that automatically pushes your notes to a GitHub repository, including linked notes and embedded media files.

This plugin is useful if you want to:
- Back up your vault (or parts of it) to GitHub
- Publish or sync notes outside Obsidian
- Integrate obsidian notes inside other projects

> ⚠️ This plugin is **not yet published** in the Obsidian community plugin store.
## Features

- **Optionally push embedded media files** (images, attachments, etc.)
- **Optionally include outward linked notes**
- **Optionally push on file modification with debouncing** (auto-publish)
- **Manual push via ribbon action**
- **Rate limiting** to avoid excessive GitHub API calls
- **
## Installation (Manual)

Since the plugin is not published yet, you need to install it manually.

1. Clone this repository into .obsidian/plugins of your Obsidian vault:
   ```bash
   git clone https://github.com/SunilGurau/obsidian-to-github-publish.git
2. Enable the plugin in `Installed plugin` in `Community plugins` tab in Settings.
3. Get the Personal Access Token(PAT) (fine-grained recommended) with read and write access to the repository you intend to publish to from `Settings>Developer Settings>Personal Access Tokens` in your Github.
4. Configure the plugin with the necessary information like repo, branch, path to push to, valid PAT, committer name, committer email etc.
5. Use tag(`#publish` by default) in your note that you configured in the setting to indicate that you intend to publish.
6. Modify file and push using ribbon action or wait after modifying for a while to auto-publish(if enabled).
