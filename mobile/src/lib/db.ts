import * as SQLite from "expo-sqlite";

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

const DB_NAME = "signum.db";

let dbInstance: SQLite.SQLiteDatabase | null = null;
let readyPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function initDB(): Promise<SQLite.SQLiteDatabase> {
  const conn = await SQLite.openDatabaseAsync(DB_NAME);
  await conn.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS samples (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      type TEXT NOT NULL,
      landmarks TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_samples_label ON samples(label);
    CREATE INDEX IF NOT EXISTS idx_samples_type ON samples(type);

    CREATE TABLE IF NOT EXISTS models (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      data TEXT NOT NULL,
      classes TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_cache (
      phrase TEXT PRIMARY KEY,
      completed TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );
  `);
  return conn;
}

async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  if (!readyPromise) {
    readyPromise = initDB()
      .then((conn) => {
        dbInstance = conn;
        return conn;
      })
      .catch((err) => {
        readyPromise = null;
        throw err;
      });
  }
  return readyPromise;
}

function parseLandmarks(raw: string): number[] {
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function parseClasses(raw: string): string[] {
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export const db = {
  async addSample(sample: Omit<SampleRecord, "id" | "createdAt">): Promise<number> {
    const dbClient = await getDB();
    const result = await dbClient.runAsync(
      "INSERT INTO samples (label, type, landmarks, createdAt) VALUES (?, ?, ?, ?)",
      [sample.label, sample.type, JSON.stringify(sample.landmarks), Date.now()],
    );
    return result.lastInsertRowId as number;
  },

  async addSamples(samples: Omit<SampleRecord, "id" | "createdAt">[]): Promise<void> {
    if (samples.length === 0) return;
    const dbClient = await getDB();
    const now = Date.now();
    await dbClient.withTransactionAsync(async () => {
      for (const sample of samples) {
        await dbClient.runAsync(
          "INSERT INTO samples (label, type, landmarks, createdAt) VALUES (?, ?, ?, ?)",
          [sample.label, sample.type, JSON.stringify(sample.landmarks), now],
        );
      }
    });
  },

  async getSamplesByLabel(label: string): Promise<SampleRecord[]> {
    const dbClient = await getDB();
    const rows = await dbClient.getAllAsync<any>(
      "SELECT * FROM samples WHERE label = ? ORDER BY id",
      [label],
    );
    return rows.map((r) => ({
      id: r.id,
      label: r.label,
      type: r.type,
      landmarks: parseLandmarks(r.landmarks),
      createdAt: r.createdAt,
    }));
  },

  async getSamplesByType(type: SignType): Promise<SampleRecord[]> {
    const dbClient = await getDB();
    const rows = await dbClient.getAllAsync<any>(
      "SELECT * FROM samples WHERE type = ? ORDER BY id",
      [type],
    );
    return rows.map((r) => ({
      id: r.id,
      label: r.label,
      type: r.type,
      landmarks: parseLandmarks(r.landmarks),
      createdAt: r.createdAt,
    }));
  },

  async getAllSamples(): Promise<SampleRecord[]> {
    const dbClient = await getDB();
    const rows = await dbClient.getAllAsync<any>("SELECT * FROM samples ORDER BY id");
    return rows.map((r) => ({
      id: r.id,
      label: r.label,
      type: r.type,
      landmarks: parseLandmarks(r.landmarks),
      createdAt: r.createdAt,
    }));
  },

  async getDistinctLabels(type: SignType): Promise<string[]> {
    const dbClient = await getDB();
    const rows = await dbClient.getAllAsync<{ label: string }>(
      "SELECT DISTINCT label FROM samples WHERE type = ? ORDER BY label",
      [type],
    );
    return rows.map((r) => r.label);
  },

  async countSamplesByLabel(label: string): Promise<number> {
    const dbClient = await getDB();
    const row = await dbClient.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM samples WHERE label = ?",
      [label],
    );
    return row?.count ?? 0;
  },

  async deleteSamplesByLabel(label: string): Promise<void> {
    const dbClient = await getDB();
    await dbClient.runAsync("DELETE FROM samples WHERE label = ?", [label]);
  },

  async clearSamples(): Promise<void> {
    const dbClient = await getDB();
    await dbClient.runAsync("DELETE FROM samples");
  },

  async saveModel(model: Omit<StoredModel, "createdAt">): Promise<void> {
    const dbClient = await getDB();
    await dbClient.runAsync(
      "INSERT OR REPLACE INTO models (id, type, data, classes, createdAt) VALUES (?, ?, ?, ?, ?)",
      [model.id, model.type, JSON.stringify(model.data), JSON.stringify(model.classes), Date.now()],
    );
  },

  async getModel(id: string): Promise<StoredModel | undefined> {
    const dbClient = await getDB();
    const row = await dbClient.getFirstAsync<any>(
      "SELECT * FROM models WHERE id = ?",
      [id],
    );
    if (!row) return undefined;
    return {
      id: row.id,
      type: row.type,
      data: JSON.parse(row.data),
      classes: parseClasses(row.classes),
      createdAt: row.createdAt,
    };
  },

  async getAllModels(): Promise<StoredModel[]> {
    const dbClient = await getDB();
    const rows = await dbClient.getAllAsync<any>("SELECT * FROM models");
    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      data: JSON.parse(r.data),
      classes: parseClasses(r.classes),
      createdAt: r.createdAt,
    }));
  },

  async deleteModel(id: string): Promise<void> {
    const dbClient = await getDB();
    await dbClient.runAsync("DELETE FROM models WHERE id = ?", [id]);
  },

  async clearModels(): Promise<void> {
    const dbClient = await getDB();
    await dbClient.runAsync("DELETE FROM models");
  },

  async getCachedCompletion(phrase: string): Promise<AiCacheRecord | undefined> {
    const dbClient = await getDB();
    const row = await dbClient.getFirstAsync<any>(
      "SELECT * FROM ai_cache WHERE phrase = ?",
      [phrase],
    );
    if (!row) return undefined;
    return {
      phrase: row.phrase,
      completed: row.completed,
      createdAt: row.createdAt,
    };
  },

  async saveCompletion(phrase: string, completed: string): Promise<void> {
    const dbClient = await getDB();
    await dbClient.runAsync(
      "INSERT OR REPLACE INTO ai_cache (phrase, completed, createdAt) VALUES (?, ?, ?)",
      [phrase, completed, Date.now()],
    );
  },

  async clearAiCache(): Promise<void> {
    const dbClient = await getDB();
    await dbClient.runAsync("DELETE FROM ai_cache");
  },

  async clearAll(): Promise<void> {
    const dbClient = await getDB();
    await dbClient.withTransactionAsync(async () => {
      await dbClient.runAsync("DELETE FROM samples");
      await dbClient.runAsync("DELETE FROM models");
      await dbClient.runAsync("DELETE FROM ai_cache");
    });
  },
};
