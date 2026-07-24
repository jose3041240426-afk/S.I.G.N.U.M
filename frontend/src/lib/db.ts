const DB_NAME = "signum";
const DB_VERSION = 2;

const STORES = {
  samples: "samples",
  models: "models",
  aiCache: "aiCache",
} as const;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORES.samples)) {
        const store = db.createObjectStore(STORES.samples, {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("label", "label", { unique: false });
        store.createIndex("type", "type", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.models)) {
        db.createObjectStore(STORES.models, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORES.aiCache)) {
        const store = db.createObjectStore(STORES.aiCache, { keyPath: "phrase" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        const req = work(store);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

export type SignType = "letter" | "word" | "dynamic";

export interface SampleRecord {
  id?: number;
  label: string;
  type: SignType;
  landmarks: number[];
  createdAt: number;
}

export interface StoredModel {
  id: string;
  type: SignType;
  data: unknown;
  classes: string[];
  createdAt: number;
}

export interface AiCacheRecord {
  phrase: string;
  completed: string;
  createdAt: number;
}

export const db = {
  addSample(sample: Omit<SampleRecord, "id" | "createdAt">): Promise<number> {
    return tx<IDBValidKey>(STORES.samples, "readwrite", (s) =>
      s.add({ ...sample, createdAt: Date.now() } as SampleRecord),
    ).then((key) => key as number);
  },

  addSamples(samples: Omit<SampleRecord, "id" | "createdAt">[]): Promise<void> {
    return openDB().then((db) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.samples, "readwrite");
        const store = transaction.objectStore(STORES.samples);
        for (const sample of samples) {
          store.add({ ...sample, createdAt: Date.now() });
        }
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    });
  },

  getSamplesByLabel(label: string): Promise<SampleRecord[]> {
    return openDB().then((db) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.samples, "readonly");
        const store = transaction.objectStore(STORES.samples);
        const index = store.index("label");
        const req = index.getAll(label);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    });
  },

  getSamplesByType(type: SignType): Promise<SampleRecord[]> {
    return openDB().then((db) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.samples, "readonly");
        const store = transaction.objectStore(STORES.samples);
        const index = store.index("type");
        const req = index.getAll(type);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    });
  },

  getAllSamples(): Promise<SampleRecord[]> {
    return tx(STORES.samples, "readonly", (s) => s.getAll());
  },

  getDistinctLabels(type: SignType): Promise<string[]> {
    return db.getSamplesByType(type).then((samples) => {
      const labels = new Set(samples.map((s) => s.label));
      return Array.from(labels).sort();
    });
  },

  countSamplesByLabel(label: string): Promise<number> {
    return openDB().then((db) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.samples, "readonly");
        const store = transaction.objectStore(STORES.samples);
        const index = store.index("label");
        const req = index.count(label);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    });
  },

  deleteSamplesByLabel(label: string): Promise<void> {
    return openDB().then((db) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.samples, "readwrite");
        const store = transaction.objectStore(STORES.samples);
        const index = store.index("label");
        const req = index.openCursor(label);
        req.onsuccess = (e) => {
          const cursor = (e.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          }
        };
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    });
  },

  clearSamples(): Promise<void> {
    return tx(STORES.samples, "readwrite", (s) => s.clear());
  },

  saveModel(model: Omit<StoredModel, "createdAt">): Promise<void> {
    return tx(STORES.models, "readwrite", (s) =>
      s.put({ ...model, createdAt: Date.now() }),
    ).then(() => {});
  },

  getModel(id: string): Promise<StoredModel | undefined> {
    return tx(STORES.models, "readonly", (s) => s.get(id));
  },

  getAllModels(): Promise<StoredModel[]> {
    return tx(STORES.models, "readonly", (s) => s.getAll());
  },

  deleteModel(id: string): Promise<void> {
    return tx(STORES.models, "readwrite", (s) => s.delete(id));
  },

  clearModels(): Promise<void> {
    return tx(STORES.models, "readwrite", (s) => s.clear());
  },

  getCachedCompletion(phrase: string): Promise<AiCacheRecord | undefined> {
    return tx(STORES.aiCache, "readonly", (s) => s.get(phrase));
  },

  saveCompletion(phrase: string, completed: string): Promise<void> {
    return tx(STORES.aiCache, "readwrite", (s) =>
      s.put({ phrase, completed, createdAt: Date.now() } as AiCacheRecord),
    ).then(() => {});
  },

  clearAiCache(): Promise<void> {
    return tx(STORES.aiCache, "readwrite", (s) => s.clear());
  },

  clearAll(): Promise<void> {
    return openDB().then((db) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.samples, STORES.models, STORES.aiCache], "readwrite");
        transaction.objectStore(STORES.samples).clear();
        transaction.objectStore(STORES.models).clear();
        transaction.objectStore(STORES.aiCache).clear();
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    });
  },
};
