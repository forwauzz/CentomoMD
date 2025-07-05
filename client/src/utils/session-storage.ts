// IndexedDB-based session recovery for voice dictation
// Provides crash-resistant storage for long dictation sessions

interface DictationSession {
  id: string;
  startTime: number;
  lastUpdate: number;
  sectionId: string;
  language: string;
  chunks: {
    index: number;
    transcript: string;
    startTime: number;
    endTime: number;
    processed: boolean;
  }[];
  totalDuration: number;
  isActive: boolean;
}

class DictationSessionManager {
  private dbName = 'CentomoMD_Sessions';
  private dbVersion = 1;
  private storeName = 'dictation_sessions';
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('isActive', 'isActive', { unique: false });
          store.createIndex('lastUpdate', 'lastUpdate', { unique: false });
        }
      };
    });
  }

  async saveSession(session: DictationSession): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.put({
        ...session,
        lastUpdate: Date.now()
      });
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getActiveSession(): Promise<DictationSession | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('isActive');
      
      const request = index.getAll();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const sessions = request.result.filter((session: DictationSession) => session.isActive);
        resolve(sessions.length > 0 ? sessions[0] : null);
      };
    });
  }

  async markSessionComplete(sessionId: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const getRequest = store.get(sessionId);
      getRequest.onsuccess = () => {
        const session = getRequest.result;
        if (session) {
          session.isActive = false;
          session.lastUpdate = Date.now();
          
          const putRequest = store.put(session);
          putRequest.onerror = () => reject(putRequest.error);
          putRequest.onsuccess = () => resolve();
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async cleanupOldSessions(maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
    if (!this.db) await this.init();
    
    const cutoffTime = Date.now() - maxAge;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('lastUpdate');
      
      const range = IDBKeyRange.upperBound(cutoffTime);
      const request = index.openCursor(range);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const session = cursor.value as DictationSession;
          if (!session.isActive) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
    });
  }
}

export const sessionManager = new DictationSessionManager();

// Utility functions for session recovery
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function isSessionRecoverable(session: DictationSession | null): boolean {
  if (!session) return false;
  
  const maxAge = 2 * 60 * 60 * 1000; // 2 hours
  const isRecent = (Date.now() - session.lastUpdate) < maxAge;
  const hasContent = session.chunks.length > 0;
  
  return isRecent && hasContent && session.isActive;
}