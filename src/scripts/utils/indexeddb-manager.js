class IndexedDBManager {
  constructor() {
    this.dbName = 'DicodingStoryDB';
    this.dbVersion = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        this.db = event.target.result;
        this.createObjectStores();
      };
    });
  }

  createObjectStores() {
    if (!this.db.objectStoreNames.contains('stories')) {
      const storiesStore = this.db.createObjectStore('stories', { 
        keyPath: 'id' 
      });
      storiesStore.createIndex('createdAt', 'createdAt', { unique: false });
      storiesStore.createIndex('synced', 'synced', { unique: false });
    }

    if (!this.db.objectStoreNames.contains('syncQueue')) {
      this.db.createObjectStore('syncQueue', { 
        keyPath: 'id', 
        autoIncrement: true 
      });
    }
  }

  async saveStory(story) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['stories'], 'readwrite');
      const store = transaction.objectStore('stories');
      
      const storyWithTimestamp = {
        ...story,
        cachedAt: new Date().toISOString(),
        synced: story.synced !== false
      };

      const request = store.put(storyWithTimestamp);

      request.onsuccess = () => {
        resolve(story);
      };

      request.onerror = () => {
        reject(new Error('Failed to save story'));
      };
    });
  }

  async saveStories(stories) {
    const transaction = this.db.transaction(['stories'], 'readwrite');
    const store = transaction.objectStore('stories');
    
    const promises = stories.map(story => {
      return new Promise((resolve, reject) => {
        const storyWithTimestamp = {
          ...story,
          cachedAt: new Date().toISOString(),
          synced: true
        };

        const request = store.put(storyWithTimestamp);
        request.onsuccess = () => resolve();
        request.onerror = () => reject();
      });
    });

    await Promise.allSettled(promises);
    return stories;
  }

  async getStory(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['stories'], 'readonly');
      const store = transaction.objectStore('stories');
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error('Failed to get story'));
      };
    });
  }

  async getAllStories() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['stories'], 'readonly');
      const store = transaction.objectStore('stories');
      const request = store.getAll();

      request.onsuccess = () => {
        const stories = request.result || [];
        stories.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        resolve(stories);
      };

      request.onerror = () => {
        reject(new Error('Failed to get stories'));
      };
    });
  }

  async deleteStory(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['stories'], 'readwrite');
      const store = transaction.objectStore('stories');
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to delete story'));
      };
    });
  }

  async clearAllStories() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['stories'], 'readwrite');
      const store = transaction.objectStore('stories');
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to clear stories'));
      };
    });
  }

  async getUnsyncedStories() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['stories'], 'readonly');
      const store = transaction.objectStore('stories');
      const index = store.index('synced');
      const request = index.getAll(false);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new Error('Failed to get unsynced stories'));
      };
    });
  }

  async getStorageUsage() {
    const stories = await this.getAllStories();
    const sizeInBytes = new Blob([JSON.stringify(stories)]).size;
    
    return {
      stories: stories.length,
      sizeInMB: (sizeInBytes / (1024 * 1024)).toFixed(2),
      sizeInBytes
    };
  }
}

export default IndexedDBManager;
