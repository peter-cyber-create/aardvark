import { initializeOfflineDB, initNetworkMonitoring } from './sync-service';

export async function initializeApp() {
  if (typeof window !== 'undefined') {
    try {
      await initializeOfflineDB();
      initNetworkMonitoring();
      console.log('Offline storage initialized');
    } catch (error) {
      console.error('Failed to initialize offline storage:', error);
    }
  }
}
