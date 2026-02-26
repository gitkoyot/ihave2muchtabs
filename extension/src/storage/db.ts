import type { BookmarkRecord, PageAnalysis } from "../types/models";

const DB_NAME = "iHave2MuchTabsDb";
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

      if (!db.objectStoreNames.contains("bookmark_records")) {
        const store = db.createObjectStore("bookmark_records", { keyPath: "id" });
        store.createIndex("by_url", "url", { unique: true });
        store.createIndex("by_status", "processingStatus");
        store.createIndex("by_folder", "folderPath");
        store.createIndex("by_updated_at", "updatedAt");
      }

      if (!db.objectStoreNames.contains("page_analyses")) {
        const store = db.createObjectStore("page_analyses", { keyPath: "id" });
        store.createIndex("by_record_id", "recordId", { unique: true });
        store.createIndex("by_final_url", "finalUrl");
        store.createIndex("by_fetch_status", "fetchStatus");
        store.createIndex("by_tags", "tags", { multiEntry: true });
        store.createIndex("by_topics", "topics", { multiEntry: true });
      }

      if (!db.objectStoreNames.contains("processing_jobs")) {
        const store = db.createObjectStore("processing_jobs", { keyPath: "id" });
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

export async function putBookmarkRecord(record: BookmarkRecord): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("bookmark_records", "readwrite");
  tx.objectStore("bookmark_records").put(record);
  await txToPromise(tx);
}

export async function putPageAnalysis(analysis: PageAnalysis): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("page_analyses", "readwrite");
  tx.objectStore("page_analyses").put(analysis);
  await txToPromise(tx);
}

export async function getAllBookmarkRecords(): Promise<BookmarkRecord[]> {
  const db = await openDb();
  const tx = db.transaction("bookmark_records", "readonly");
  const req = tx.objectStore("bookmark_records").getAll();
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

