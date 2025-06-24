import IndexedDBManager from './indexeddb-manager.js';

class OfflineManager {
  constructor() {
    this.dbManager = new IndexedDBManager();
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    this.init();
  }

  async init() {
    try {
      await this.dbManager.init();
      this.setupNetworkListeners();
      
      if (this.isOnline) {
        await this.processSyncQueue();
      }
    } catch (error) {
      // Initialization failed
    }
  }

  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.showNetworkStatus('Connected', 'success');
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.showNetworkStatus('Offline Mode', 'warning');
    });
  }

  showNetworkStatus(message, type = 'info') {
    const statusEl = document.createElement('div');
    statusEl.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'success' ? '#4caf50' : type === 'warning' ? '#ff9800' : '#2196f3'};
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      animation: slideInDown 0.3s ease;
    `;
    statusEl.textContent = message;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInDown {
        from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
      }
      @keyframes slideOutUp {
        from { transform: translateX(-50%) translateY(0); opacity: 1; }
        to { transform: translateX(-50%) translateY(-100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(statusEl);

    setTimeout(() => {
      statusEl.style.animation = 'slideOutUp 0.3s ease';
      setTimeout(() => statusEl.remove(), 300);
    }, 3000);
  }

  async getStories() {
    if (this.isOnline) {
      try {
        const response = await fetch('/api/stories', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const stories = data.listStory || [];
          
          await this.dbManager.saveStories(stories);
          return {
            data: { listStory: stories },
            error: false,
            message: 'Stories fetched successfully'
          };
        }
      } catch (error) {
        // API error - fall back to cache
      }
    }

    const cachedStories = await this.dbManager.getAllStories();
    if (cachedStories.length > 0) {
      return {
        data: { listStory: cachedStories },
        error: false,
        message: 'Stories loaded from cache'
      };
    }

    return {
      data: { listStory: [] },
      error: true,
      message: 'No stories available'
    };
  }

  async getStoryDetail(id) {
    if (this.isOnline) {
      try {
        const response = await fetch(`/api/stories/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const story = data.story;
          
          if (story) {
            await this.dbManager.saveStory(story);
          }
          
          return {
            data: { story },
            error: false,
            message: 'Story fetched successfully'
          };
        }
      } catch (error) {
        // API error - fall back to cache
      }
    }

    const cachedStory = await this.dbManager.getStory(id);
    if (cachedStory) {
      return {
        data: { story: cachedStory },
        error: false,
        message: 'Story loaded from cache'
      };
    }

    return {
      data: { story: null },
      error: true,
      message: 'Story not available'
    };
  }

  async addStory(storyData) {
    const pendingStory = {
      id: `temp_${Date.now()}`,
      ...storyData,
      timestamp: new Date().toISOString(),
      synced: false
    };

    await this.dbManager.saveStory(pendingStory);
    
    this.syncQueue.push({
      type: 'CREATE_STORY',
      data: storyData,
      tempId: pendingStory.id
    });

    if (this.isOnline) {
      await this.processSyncQueue();
    }

    return {
      data: { story: pendingStory },
      error: false,
      message: this.isOnline ? 'Story uploaded successfully' : 'Story saved for sync'
    };
  }

  async processSyncQueue() {
    if (!this.isOnline || this.syncQueue.length === 0) return;

    const queue = [...this.syncQueue];
    this.syncQueue = [];

    for (const item of queue) {
      try {
        if (item.type === 'CREATE_STORY') {
          const formData = new FormData();
          formData.append('description', item.data.description);
          if (item.data.photo) {
            formData.append('photo', item.data.photo);
          }
          if (item.data.lat && item.data.lon) {
            formData.append('lat', item.data.lat);
            formData.append('lon', item.data.lon);
          }

          const response = await fetch('/api/stories', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: formData
          });

          if (response.ok) {
            await this.dbManager.deleteStory(item.tempId);
          } else {
            this.syncQueue.push(item);
          }
        }
      } catch (error) {
        this.syncQueue.push(item);
      }
    }
  }

  async clearCache() {
    try {
      await this.dbManager.clearAllStories();
      this.syncQueue = [];
    } catch (error) {
      // Cache clear error
    }
  }

  isOffline() {
    return !this.isOnline;
  }

  getPendingOperations() {
    return this.syncQueue.length;
  }

  getStatus() {
    return {
      isOnline: this.isOnline,
      pendingOperations: this.syncQueue.length,
      hasCache: true
    };
  }
}

export default OfflineManager;
