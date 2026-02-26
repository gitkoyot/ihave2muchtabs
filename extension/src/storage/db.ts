import type { PageAnalysis, TabRecord } from "../types/models";

const DB_NAME = "iHave2MuchTabsDb";
const DB_VERSION = 2;

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

    req.onupgradeneeded = (event) => {
      const db = req.result;
      const tx = req.transaction;
      const oldVersion = event.oldVersion;

      if (!db.objectStoreNames.contains("tab_records")) {
        const store = db.createObjectStore("tab_records", { keyPath: "id" });
        store.createIndex("by_url", "url", { unique: true });
        store.createIndex("by_status", "processingStatus");
        store.createIndex("by_window", "sourceWindowId");
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

      // v1 -> v2 migration: move bookmark_records into tab_records with renamed fields.
      if (oldVersion < 2 && db.objectStoreNames.contains("bookmark_records") && tx) {
        const oldStore = tx.objectStore("bookmark_records");
        const newStore = tx.objectStore("tab_records");
        const cursorReq = oldStore.openCursor();
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result;
          if (!cursor) {
            return;
          }
          const oldValue = cursor.value as Record<string, unknown>;
          const now = Date.now();
          const migrated: TabRecord = {
            id: String(oldValue.id ?? ""),
            tabId: String(oldValue.bookmarkId ?? ""),
            url: String(oldValue.url ?? ""),
            tabTitle: String(oldValue.bookmarkTitle ?? oldValue.url ?? ""),
            sourceWindowId: parseWindowIdFromLegacyFolderPath(oldValue.folderPath),
            sourceWindowLabel: String(oldValue.folderPath ?? "Window unknown"),
            capturedAt: (typeof oldValue.dateAdded === "number" ? oldValue.dateAdded : now) as number,
            processingStatus: normalizeProcessingStatus(oldValue.processingStatus),
            lastProcessedAt:
              typeof oldValue.lastProcessedAt === "number" ? (oldValue.lastProcessedAt as number) : null,
            lastErrorMessage:
              typeof oldValue.lastErrorMessage === "string" ? (oldValue.lastErrorMessage as string) : null,
            createdAt: typeof oldValue.createdAt === "number" ? (oldValue.createdAt as number) : now,
            updatedAt: typeof oldValue.updatedAt === "number" ? (oldValue.updatedAt as number) : now
          };
          if (migrated.id && migrated.url) {
            newStore.put(migrated);
          }
          cursor.continue();
        };
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Failed to open IndexedDB"));
  });
}

function normalizeProcessingStatus(value: unknown): TabRecord["processingStatus"] {
  if (
    value === "pending" ||
    value === "processing" ||
    value === "done" ||
    value === "failed" ||
    value === "restricted"
  ) {
    return value;
  }
  return "pending";
}

function parseWindowIdFromLegacyFolderPath(value: unknown): number | null {
  if (typeof value !== "string") {
    return null;
  }
  const match = value.match(/Window\s+(\d+)/i);
  return match ? Number(match[1]) : null;
}

export async function putTabRecord(record: TabRecord): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("tab_records", "readwrite");
  tx.objectStore("tab_records").put(record);
  await txToPromise(tx);
}

export async function putPageAnalysis(analysis: PageAnalysis): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("page_analyses", "readwrite");
  tx.objectStore("page_analyses").put(analysis);
  await txToPromise(tx);
}

export async function getAllTabRecords(): Promise<TabRecord[]> {
  const db = await openDb();
  const tx = db.transaction("tab_records", "readonly");
  const req = tx.objectStore("tab_records").getAll();
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
  const storeNames = ["tab_records", "page_analyses", "processing_jobs", "query_history"].filter((name) =>
    db.objectStoreNames.contains(name)
  );
  if (storeNames.length === 0) {
    return;
  }
  const tx = db.transaction(storeNames, "readwrite");
  for (const name of storeNames) {
    tx.objectStore(name).clear();
  }
  await txToPromise(tx);
}
