import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { cryptoVault } from '../lib/cryptoVault';

const SyncContext = createContext(null);
const QUEUE_KEY = 'dcp_offline_queue';

// Synchronous fast-read for initial state, with fallback
export function getOfflineQueue() {
  try {
    const raw = localStorage.getItem(`dcp_vault_${QUEUE_KEY}`) || localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    if (!raw.startsWith('enc:')) {
      return JSON.parse(raw);
    }
    // Encrypted payloads are read asynchronously in provider
    return [];
  } catch {
    return [];
  }
}

export function SyncProvider({ children }) {
  const [offlineCount, setOfflineCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Load encrypted queue securely
  const loadVaultQueue = useCallback(async () => {
    try {
      const encryptedQueue = await cryptoVault.getItem(QUEUE_KEY);
      if (encryptedQueue && Array.isArray(encryptedQueue)) {
        setOfflineCount(encryptedQueue.length);
        return encryptedQueue;
      }
      // Migrate legacy plaintext queue if any
      const legacyRaw = localStorage.getItem(QUEUE_KEY);
      if (legacyRaw) {
        const parsed = JSON.parse(legacyRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          await cryptoVault.setItem(QUEUE_KEY, parsed);
          localStorage.removeItem(QUEUE_KEY);
          setOfflineCount(parsed.length);
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Error loading vault queue:", e);
    }
    return [];
  }, []);

  useEffect(() => {
    loadVaultQueue();
  }, [loadVaultQueue]);

  const syncOfflineQueue = useCallback(async () => {
    const queue = await loadVaultQueue();
    if (!queue.length || isSyncing || !navigator.onLine) return;
    
    setIsSyncing(true);
    let successCount = 0;
    const failed = [];
    
    for (const payload of queue) {
      await new Promise(r => setTimeout(r, 400));
      
      const { data, error } = await api.register(payload, payload.invite_token);
      if (!error && data && !data.offline) {
        successCount++;
      } else {
        failed.push(payload);
      }
    }

    if (failed.length === 0) {
      cryptoVault.removeItem(QUEUE_KEY);
      localStorage.removeItem(QUEUE_KEY);
    } else {
      await cryptoVault.setItem(QUEUE_KEY, failed);
    }
    
    setOfflineCount(failed.length);
    setIsSyncing(false);
    
    if (successCount > 0) {
      toast.success(`✅ Securely synced ${successCount} offline recruit${successCount !== 1 ? 's' : ''} to HQ!`);
    }
  }, [isSyncing, loadVaultQueue]);

  // Securely enqueue with AES-GCM encryption
  const enqueueOffline = useCallback(async (payload) => {
    const queue = await loadVaultQueue();
    queue.push({ ...payload, _queued_at: Date.now() });
    await cryptoVault.setItem(QUEUE_KEY, queue);
    setOfflineCount(queue.length);
    toast.info("💾 Record encrypted & saved locally until signal returns");
  }, [loadVaultQueue]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.onLine && offlineCount > 0) {
      syncOfflineQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOfflineQueue, offlineCount]);

  return (
    <SyncContext.Provider value={{ offlineCount, isSyncing, isOnline, syncOfflineQueue, enqueueOffline }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}
