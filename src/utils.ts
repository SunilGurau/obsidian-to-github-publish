import { App, TFile } from 'obsidian';

//returns an array of tags from the frontmatter of a given TFile
export function getFrontmatterTags(file: TFile, app: App): string[] {
	// console.log(`Getting frontmatter tags for file: ${file.path}`);
	const metadata = app.metadataCache.getFileCache(file);
	// console.log('Metadata:', metadata);
	const tags = metadata?.frontmatter?.tags as string[] | undefined;
	return tags || [];
}

//returns an array of the embedded files in a given TFile
export function getEmbeddedFiles(file: TFile, app: App): TFile[] {
	const cache = app.metadataCache.getFileCache(file);
	if (!cache?.embeds) return [];
	const embeds = cache?.embeds;

	const resolvedFiles = embeds
		.map((e) => app.metadataCache.getFirstLinkpathDest(e.link, file.path))
		.filter((f) => f instanceof TFile);
	return resolvedFiles;
}

//returns an array of the outgoing linked files in a given TFile
export function getOutgoingLinks(file: TFile, app: App): TFile[] {
	const cache = app.metadataCache.getFileCache(file);
	if (!cache?.links) return [];
	const links = cache?.links;

	const resolvedFiles = links
		.map((l) => app.metadataCache.getFirstLinkpathDest(l.link, file.path))
		.filter((f) => f instanceof TFile);
	return resolvedFiles;
}

//returns the base64 encoded content of a given TFile
export async function base64EncodeFile(file: TFile, app: App): Promise<string> {
	const buffer = await app.vault.readBinary(file);
	return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

export function areSameBase64Contents(
	content1: string,
	content2: string
): boolean {
	const normalized1 = content1.replace(/\s+/g, '');
	const normalized2 = content2.replace(/\s+/g, '');
	console.log('Normalized Content 1:', normalized1);
	console.log('Normalized Content 2:', normalized2);
	return normalized1 === normalized2;
}

// private readLocalFileContent = async (
// 	file: TFile
// ): Promise<string | null> => {
// 	try {
// 		const content = await this.app.vault.read(file);
// 		return content;
// 	} catch {
// 		new Notice(`Error reading content of file: ${file.path}`);
// 	}
// };
