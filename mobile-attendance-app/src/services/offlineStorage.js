import AsyncStorage from '@react-native-async-storage/async-storage';

const OFFLINE_QUEUE_KEY = 'attendance_offline_queue';

// Shared memory fallback
const memoryStorage = new Map();

class OfflineStorage {
  // Helper for safe storage access
  async _safeGetItem(key) {
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      return memoryStorage.get(key) || null;
    }
  }

  async _safeSetItem(key, value) {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      memoryStorage.set(key, value);
    }
  }

  async _safeRemoveItem(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      memoryStorage.delete(key);
    }
  }

  // Save a scan to the offline queue
  async addToQueue(scanData) {
    try {
      const existing = await this.getQueue();
      existing.push({
        ...scanData,
        queuedAt: new Date().toISOString(),
        synced: false,
      });
      await this._safeSetItem(OFFLINE_QUEUE_KEY, JSON.stringify(existing));
      return true;
    } catch (e) {
      console.warn('Failed to add to offline queue:', e.message);
      return false;
    }
  }

  // Get all items in the queue
  async getQueue() {
    try {
      const data = await this._safeGetItem(OFFLINE_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Failed to get offline queue:', e.message);
      return [];
    }
  }

  // Get only unsynced items
  async getUnsyncedQueue() {
    const queue = await this.getQueue();
    return queue.filter(item => !item.synced);
  }

  // Mark items as synced
  async markSynced(indices) {
    try {
      const queue = await this.getQueue();
      indices.forEach(idx => {
        if (queue[idx]) queue[idx].synced = true;
      });
      await this._safeSetItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.warn('Failed to mark items synced:', e.message);
    }
  }

  // Clear synced items (housekeeping)
  async clearSynced() {
    try {
      const queue = await this.getQueue();
      const unsynced = queue.filter(item => !item.synced);
      await this._safeSetItem(OFFLINE_QUEUE_KEY, JSON.stringify(unsynced));
    } catch (e) {
      console.warn('Failed to clear synced items:', e.message);
    }
  }

  // Clear entire queue
  async clearQueue() {
    try {
      await this._safeRemoveItem(OFFLINE_QUEUE_KEY);
    } catch (e) {
      console.warn('Failed to clear queue:', e.message);
    }
  }

  // Get count of pending items
  async getPendingCount() {
    const unsynced = await this.getUnsyncedQueue();
    return unsynced.length;
  }
}

export default new OfflineStorage();
