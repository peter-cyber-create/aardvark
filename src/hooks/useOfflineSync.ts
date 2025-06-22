'use client';

import { useState, useEffect } from 'react';
import { addToSyncQueue, processSyncQueue, getOfflineData } from '@/lib/sync-service';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncData();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial status check
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncData = async () => {
    if (!navigator.onLine) return;

    setSyncStatus('syncing');
    try {
      await processSyncQueue();
      setSyncStatus('idle');
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
    }
  };

  const saveOffline = async (model: string, data: any, operation: 'CREATE' | 'UPDATE' | 'DELETE' = 'CREATE') => {
    try {
      await addToSyncQueue(operation, model, data);
      
      // If online, try to sync immediately
      if (isOnline) {
        await syncData();
      }
    } catch (error) {
      console.error('Failed to save offline data:', error);
      throw error;
    }
  };

  const getOfflineRecords = async (model: string) => {
    try {
      return await getOfflineData(model);
    } catch (error) {
      console.error('Failed to get offline data:', error);
      return [];
    }
  };

  return {
    isOnline,
    syncStatus,
    saveOffline,
    getOfflineRecords,
    syncData,
  };
}
