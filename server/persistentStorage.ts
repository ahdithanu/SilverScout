import fs from 'fs';
import path from 'path';

/**
 * PERSISTENT VOLUME STORAGE ENGINE FOR DOCKER & ENTERPRISE DEPLOYMENTS
 * 
 * Guarantees that ingested listings, leads, cryptographic audit ledgers,
 * and generated IC memos persist across container restarts and Docker volume lifecycles.
 */

const DATA_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), 'data');

// Ensure storage directories exist
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.mkdirSync(path.join(DATA_DIR, 'exports'), { recursive: true });
    fs.mkdirSync(path.join(DATA_DIR, 'ledger'), { recursive: true });
  } catch (err) {
    console.warn(`Could not create data directory at ${DATA_DIR}:`, err);
  }
}

export class PersistentStorage {
  private static baseDir = DATA_DIR;

  public static getStoragePath(fileName: string): string {
    return path.join(this.baseDir, fileName);
  }

  public static saveCollection<T>(collectionName: string, items: T[]): void {
    try {
      const filePath = path.join(this.baseDir, `${collectionName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(items, null, 2), 'utf-8');
    } catch (err) {
      console.error(`Failed to persist collection '${collectionName}':`, err);
    }
  }

  public static loadCollection<T>(collectionName: string, fallback: T[] = []): T[] {
    try {
      const filePath = path.join(this.baseDir, `${collectionName}.json`);
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn(`Could not read persisted collection '${collectionName}', using fallback:`, err);
    }
    return fallback;
  }

  public static saveObject<T>(key: string, data: T): void {
    try {
      const filePath = path.join(this.baseDir, `${key}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error(`Failed to persist object '${key}':`, err);
    }
  }

  public static loadObject<T>(key: string, fallback: T): T {
    try {
      const filePath = path.join(this.baseDir, `${key}.json`);
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn(`Could not read persisted object '${key}', using fallback:`, err);
    }
    return fallback;
  }

  public static getStorageMetrics(): {
    directory: string;
    files: Array<{ name: string; sizeBytes: number; modifiedAt: string }>;
    totalSizeBytes: number;
  } {
    const files: Array<{ name: string; sizeBytes: number; modifiedAt: string }> = [];
    let totalSizeBytes = 0;

    try {
      if (fs.existsSync(this.baseDir)) {
        const dirEntries = fs.readdirSync(this.baseDir);
        for (const entry of dirEntries) {
          const entryPath = path.join(this.baseDir, entry);
          const stat = fs.statSync(entryPath);
          if (stat.isFile()) {
            files.push({
              name: entry,
              sizeBytes: stat.size,
              modifiedAt: stat.mtime.toISOString()
            });
            totalSizeBytes += stat.size;
          }
        }
      }
    } catch (err) {
      console.warn('Error reading storage directory stats:', err);
    }

    return {
      directory: this.baseDir,
      files,
      totalSizeBytes
    };
  }
}
