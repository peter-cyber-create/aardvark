'use client';

import { useState, useEffect } from 'react';
import { FiWifi, FiWifiOff } from 'react-icons/fi';

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Initial check
    updateOnlineStatus();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
      isOnline 
        ? 'bg-green-100 text-green-800 border border-green-200' 
        : 'bg-red-100 text-red-800 border border-red-200'
    }`}>
      {isOnline ? (
        <>
          <FiWifi className="w-4 h-4" />
          <span>Online</span>
        </>
      ) : (
        <>
          <FiWifiOff className="w-4 h-4" />
          <span>Offline</span>
        </>
      )}
    </div>
  );
}
