import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const DB_NAME = 'DailyViewDB';
const DB_VERSION = 1;

/**
 * StorageAdapter interface providing unified key-value and object storage across Web (IndexedDB/localStorage) and Native (AsyncStorage).
 */
export interface IStorageAdapter {
  getItem<T>(key: string): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

// Web IndexedDB helper with fallback
class WebIndexedDbStorage implements IStorageAdapter {
  private dbPromise: Promise<IDBDatabase | null> | null = null;

  private getDB(): Promise<IDBDatabase | null> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.resolve(null);
    }
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve) => {
        try {
          const req = window.indexedDB.open(DB_NAME, DB_VERSION);
          req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains('keyval')) {
              db.createObjectStore('keyval');
            }
          };
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => {
            console.warn('IndexedDB failed to open, using AsyncStorage/localStorage fallback');
            resolve(null);
          };
        } catch (e) {
          console.warn('IndexedDB init error:', e);
          resolve(null);
        }
      });
    }
    return this.dbPromise;
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const db = await this.getDB();
      if (!db) {
        const val = await AsyncStorage.getItem(key);
        return val ? JSON.parse(val) : null;
      }
      return new Promise((resolve) => {
        try {
          const tx = db.transaction('keyval', 'readonly');
          const store = tx.objectStore('keyval');
          const req = store.get(key);
          req.onsuccess = () => resolve(req.result !== undefined ? req.result : null);
          req.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      });
    } catch {
      return null;
    }
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const db = await this.getDB();
      if (!db) {
        await AsyncStorage.setItem(key, JSON.stringify(value));
        return;
      }
      return new Promise((resolve, reject) => {
        try {
          const tx = db.transaction('keyval', 'readwrite');
          const store = tx.objectStore('keyval');
          const req = store.put(value, key);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        } catch (e) {
          reject(e);
        }
      });
    } catch {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      const db = await this.getDB();
      if (!db) {
        await AsyncStorage.removeItem(key);
        return;
      }
      return new Promise((resolve, reject) => {
        try {
          const tx = db.transaction('keyval', 'readwrite');
          const store = tx.objectStore('keyval');
          const req = store.delete(key);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        } catch (e) {
          reject(e);
        }
      });
    } catch {
      await AsyncStorage.removeItem(key);
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.getDB();
      if (!db) {
        await AsyncStorage.clear();
        return;
      }
      return new Promise((resolve, reject) => {
        try {
          const tx = db.transaction('keyval', 'readwrite');
          const store = tx.objectStore('keyval');
          const req = store.clear();
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        } catch (e) {
          reject(e);
        }
      });
    } catch {
      await AsyncStorage.clear();
    }
  }
}

class NativeAsyncStorageAdapter implements IStorageAdapter {
  async getItem<T>(key: string): Promise<T | null> {
    const val = await AsyncStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  }
  async setItem<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  }
  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }
  async clear(): Promise<void> {
    await AsyncStorage.clear();
  }
}

export const appStorage: IStorageAdapter =
  Platform.OS === 'web' ? new WebIndexedDbStorage() : new NativeAsyncStorageAdapter();
