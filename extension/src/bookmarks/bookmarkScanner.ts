import type { BookmarkRecord } from "../types/models";
import { makeId } from "../utils/id";

function isSupportedUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

export async function scanBookmarks(folderIds?: string[]): Promise<BookmarkRecord[]> {
  const roots = await chrome.bookmarks.getTree();
  const targetFolderIds = folderIds?.length ? new Set(folderIds) : null;
  const seenUrls = new Set<string>();
  const records: BookmarkRecord[] = [];

  const visit = (
    node: chrome.bookmarks.BookmarkTreeNode,
    path: string[],
    underSelectedFolder: boolean
  ): void => {
    const nextPath = node.title ? [...path, node.title] : path;
    const isFolder = !node.url;
    const isSelectedHere = targetFolderIds ? targetFolderIds.has(node.id) : true;
    const selected = underSelectedFolder || isSelectedHere;

    if (isFolder) {
      for (const child of node.children ?? []) {
        visit(child, nextPath, selected);
      }
      return;
    }

    if (!selected || !node.url || !isSupportedUrl(node.url)) {
      return;
    }

    if (seenUrls.has(node.url)) {
      return;
    }
    seenUrls.add(node.url);

    const now = Date.now();
    records.push({
      id: makeId("rec"),
      bookmarkId: node.id,
      url: node.url,
      bookmarkTitle: node.title || node.url,
      folderPath: nextPath.slice(0, -1).join("/"),
      dateAdded: node.dateAdded ?? null,
      processingStatus: "pending",
      lastProcessedAt: null,
      createdAt: now,
      updatedAt: now
    });
  };

  for (const root of roots) {
    visit(root, [], false);
  }

  return records;
}

