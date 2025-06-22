// Sync service for offline functionality
import { openDB, IDBPDatabase } from 'idb';

interface SyncData {
  id: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  model: string;
  data: any;
  timestamp: number;
}

let db: IDBPDatabase | null = null;

export async function initializeOfflineDB(): Promise<IDBPDatabase> {
  if (db) return db;

  db = await openDB('AardvarkLodgeDB', 1, {
    upgrade(db) {
      // Create stores for offline data
      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
        syncStore.createIndex('timestamp', 'timestamp');
      }

      if (!db.objectStoreNames.contains('checkins')) {
        db.createObjectStore('checkins', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('accommodations')) {
        db.createObjectStore('accommodations', { keyPath: 'id' });
      }
    },
  });

  return db;
}

export async function getOfflineData(model: string): Promise<any[]> {
  const database = await initializeOfflineDB();
  const tx = database.transaction(model, 'readonly');
  const store = tx.objectStore(model);
  return await store.getAll();
}

export async function saveOfflineData(model: string, data: any): Promise<void> {
  const database = await initializeOfflineDB();
  const tx = database.transaction(model, 'readwrite');
  const store = tx.objectStore(model);
  await store.put(data);
}

export async function addToSyncQueue(operation: string, model: string, data: any): Promise<void> {
  const database = await initializeOfflineDB();
  const syncData: SyncData = {
    id: `${model}_${Date.now()}_${Math.random()}`,
    operation: operation as 'CREATE' | 'UPDATE' | 'DELETE',
    model,
    data,
    timestamp: Date.now(),
  };

  const tx = database.transaction('syncQueue', 'readwrite');
  const store = tx.objectStore('syncQueue');
  await store.add(syncData);
}

export async function processSyncQueue(): Promise<void> {
  if (!navigator.onLine) return;

  const database = await initializeOfflineDB();
  const tx = database.transaction('syncQueue', 'readonly');
  const store = tx.objectStore('syncQueue');
  const queueItems = await store.getAll();

  for (const item of queueItems) {
    try {
      await syncToServer(item);
      // Remove from queue after successful sync
      const deleteTx = database.transaction('syncQueue', 'readwrite');
      const deleteStore = deleteTx.objectStore('syncQueue');
      await deleteStore.delete(item.id);
    } catch (error) {
      console.error('Failed to sync item:', item, error);
    }
  }
}

async function syncToServer(item: SyncData): Promise<void> {
  const endpoint = `/api/${item.model}`;
  const method = item.operation === 'CREATE' ? 'POST' : 
                 item.operation === 'UPDATE' ? 'PUT' : 'DELETE';

  const response = await fetch(endpoint, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(item.data),
  });

  if (!response.ok) {
    throw new Error(`Sync failed: ${response.statusText}`);
  }
}

export function initNetworkMonitoring(): void {
  window.addEventListener('online', () => {
    console.log('Connection restored, processing sync queue...');
    processSyncQueue();
  });

  window.addEventListener('offline', () => {
    console.log('Connection lost, switching to offline mode...');
  });

  // Process sync queue on initialization if online
  if (navigator.onLine) {
    processSyncQueue();
  }
}
