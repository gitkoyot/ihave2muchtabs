import type { PageAnalysis, PageDocument, PageLink, TabRecord } from "../types/models";

const DB_NAME = "iHave2MuchTabsKnowledgeDb";
const DB_VERSION = 1;

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function txToPromise(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed"));
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted"));
  });
}

export async function openDb(): Promise<IDBDatabase> {
  return await new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;

      if (!db.objectStoreNames.contains("tab_captures")) {
        const store = db.createObjectStore("tab_captures", { keyPath: "id" });
        store.createIndex("by_url", "url", { unique: true });
        store.createIndex("by_status", "processingStatus");
        store.createIndex("by_window", "sourceWindowId");
        store.createIndex("by_updated_at", "updatedAt");
      }

      if (!db.objectStoreNames.contains("page_documents")) {
        const store = db.createObjectStore("page_documents", { keyPath: "id" });
        store.createIndex("by_canonical_url", "canonicalUrl", { unique: true });
        store.createIndex("by_domain", "domain");
        store.createIndex("by_last_seen_at", "lastSeenAt");
      }

      if (!db.objectStoreNames.contains("page_analyses")) {
        const store = db.createObjectStore("page_analyses", { keyPath: "id" });
        store.createIndex("by_record_id", "recordId", { unique: true });
        store.createIndex("by_document_id", "documentId");
        store.createIndex("by_final_url", "finalUrl");
        store.createIndex("by_fetch_status", "fetchStatus");
        store.createIndex("by_tags", "tags", { multiEntry: true });
        store.createIndex("by_topics", "topics", { multiEntry: true });
        store.createIndex("by_technologies", "technologies", { multiEntry: true });
      }

      if (!db.objectStoreNames.contains("page_links")) {
        const store = db.createObjectStore("page_links", { keyPath: "id" });
        store.createIndex("by_document_id", "documentId");
        store.createIndex("by_to_url", "toUrl");
      }

      if (!db.objectStoreNames.contains("scan_jobs")) {
        const store = db.createObjectStore("scan_jobs", { keyPath: "id" });
        store.createIndex("by_status", "status");
        store.createIndex("by_started_at", "startedAt");
      }

      if (!db.objectStoreNames.contains("query_history")) {
        const store = db.createObjectStore("query_history", { keyPath: "id" });
        store.createIndex("by_created_at", "createdAt");
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Failed to open IndexedDB"));
  });
}

export async function putTabRecord(record: TabRecord): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("tab_captures", "readwrite");
  tx.objectStore("tab_captures").put(record);
  await txToPromise(tx);
}

export async function putPageAnalysis(analysis: PageAnalysis): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("page_analyses", "readwrite");
  tx.objectStore("page_analyses").put(analysis);
  await txToPromise(tx);
}

export async function putPageDocument(document: PageDocument): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("page_documents", "readwrite");
  tx.objectStore("page_documents").put(document);
  await txToPromise(tx);
}

export async function replacePageLinksForDocument(documentId: string, urls: string[]): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("page_links", "readwrite");
  const store = tx.objectStore("page_links");
  const index = store.index("by_document_id");
  const existing = await requestToPromise(index.getAllKeys(documentId));
  for (const key of existing) {
    store.delete(key);
  }
  const now = Date.now();
  for (const toUrl of urls) {
    const link: PageLink = {
      id: `${documentId}|${toUrl}`,
      documentId,
      toUrl,
      createdAt: now
    };
    store.put(link);
  }
  await txToPromise(tx);
}

export async function getAllTabRecords(): Promise<TabRecord[]> {
  const db = await openDb();
  const tx = db.transaction("tab_captures", "readonly");
  const req = tx.objectStore("tab_captures").getAll();
  const data = await requestToPromise(req);
  await txToPromise(tx);
  return data;
}

export async function getAllPageAnalyses(): Promise<PageAnalysis[]> {
  const db = await openDb();
  const tx = db.transaction("page_analyses", "readonly");
  const req = tx.objectStore("page_analyses").getAll();
  const data = await requestToPromise(req);
  await txToPromise(tx);
  return data;
}

export async function clearAllDatabaseStores(): Promise<void> {
  const db = await openDb();
  const storeNames = [
    "tab_captures",
    "page_documents",
    "page_analyses",
    "page_links",
    "scan_jobs",
    "query_history"
  ].filter((name) => db.objectStoreNames.contains(name));
  if (storeNames.length === 0) {
    return;
  }
  const tx = db.transaction(storeNames, "readwrite");
  for (const name of storeNames) {
    tx.objectStore(name).clear();
  }
  await txToPromise(tx);
}

