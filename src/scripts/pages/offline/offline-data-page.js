import IndexedDBManager from '../../utils/indexeddb-manager.js';

export default class SavedStoriesPage {
  async render() {
    
    if (!document.getElementById('custom-confirm-dialog')) {
      const dialog = document.createElement('div');
      dialog.id = 'custom-confirm-dialog';
      dialog.className = 'custom-confirm-dialog hidden';
      dialog.innerHTML = `
        <div class="dialog-backdrop"></div>
        <div class="dialog-content">
          <div class="dialog-message"></div>
          <div class="dialog-actions">
            <button class="btn btn-danger dialog-confirm">Ya</button>
            <button class="btn btn-secondary dialog-cancel">Batal</button>
          </div>
        </div>
      `;
      document.body.appendChild(dialog);
    }
    return `
      <section class="saved-stories-container">
        <div class="page-header" style="display:flex; flex-direction:column; align-items:center; justify-content:center; margin-bottom:1.5em;">
          <h1 style="margin-bottom:0.2em; font-size:3rem; font-weight:800; text-align:center;">Saved Stories</h1>
          <p style="margin-top:0; font-size:1.3rem; color:#666; text-align:center;">Kelola stories yang telah Anda simpan</p>
        </div>

        <div class="saved-controls" style="display:flex; flex-direction:column; align-items:center;">
          <div class="control-group">
            <button id="refresh-saved-data" class="btn btn-primary">
              Refresh
            </button>
            <button id="clear-all-saved" class="btn btn-danger">
              Hapus Semua
            </button>
          </div>
        </div>

        <div class="saved-stats">
          <div class="stat-card">
            <h3 id="saved-count">0</h3>
            <p>Stories Tersimpan</p>
          </div>
          <div class="stat-card">
            <h3 id="storage-size">0 KB</h3>
            <p>Storage Digunakan</p>
          </div>
        </div>

        <div class="saved-stories-container">
          <h2>Your Saved Stories</h2>
          <div id="saved-stories-list" class="stories-grid">
            <div class="loading-placeholder">
              <div class="loading-spinner"></div>
              <p>Memuat saved stories...</p>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    await this._loadSavedData();
    this._setupEventListeners();
  }

  async _loadSavedData() {
    try {
      if (!window.indexedDBManager) {
        window.indexedDBManager = new IndexedDBManager();
        await window.indexedDBManager.init();
      }
      const stories = await window.indexedDBManager.getAllStories();
      await this._renderSavedStories(stories);
      this._updateStats(stories);
    } catch (error) {
      console.error('Error loading saved data:', error);
      this._showError('Gagal memuat saved stories');
    }
  }

  async _renderSavedStories(stories) {
    const container = document.getElementById('saved-stories-list');
    
    if (!stories || stories.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>Belum Ada Stories Tersimpan</h3>
          <p>Kembali ke halaman utama dan simpan stories favorit Anda</p>
          <a href="#/" class="btn btn-primary">
            Kembali ke Beranda
          </a>
        </div>
      `;
      return;
    }

    const storiesHTML = stories.map(story => `
      <div class="story-card saved-story" data-story-id="${story.id}">
        <div class="story-image">
          <img src="${story.photoUrl || '/images/logo.png'}" 
               alt="${story.name || 'Story image'}" 
               loading="lazy"
               onerror="this.src='/images/logo.png'">
          <div class="saved-badge">SAVED</div>
        </div>
        <div class="story-content">
          <h3 class="story-title">${story.name || 'Untitled Story'}</h3>
          <p class="story-description">${story.description || 'No description'}</p>
          <div class="story-meta">
            <span class="story-date">
              Disimpan: ${story.createdAt ? new Date(story.createdAt).toLocaleDateString('id-ID') : 'No date'}
            </span>
          </div>
          <div class="story-actions">
            <button class="btn btn-sm btn-primary view-saved-story" data-id="${story.id}">
              Lihat Detail
            </button>
            <button class="btn btn-sm btn-danger delete-saved-story" data-id="${story.id}">
              Hapus
            </button>
          </div>
        </div>
      </div>
    `).join('');

    container.innerHTML = storiesHTML;
    this._setupStoryEventListeners();
  }

  _updateStats(stories) {
    const countElement = document.getElementById('saved-count');
    const sizeElement = document.getElementById('storage-size');
    
    if (countElement) {
      countElement.textContent = stories.length;
    }
    
    if (sizeElement) {
      
      const dataSize = JSON.stringify(stories).length;
      const sizeInKB = Math.round(dataSize / 1024);
      sizeElement.textContent = `${sizeInKB} KB`;
    }
  }

  _setupEventListeners() {
    const refreshBtn = document.getElementById('refresh-saved-data');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = 'Loading...';
        await this._loadSavedData();
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = 'Refresh';
        this._showSuccess('Data berhasil di-refresh');
      });
    }

    const clearBtn = document.getElementById('clear-all-saved');
    if (clearBtn) {
      clearBtn.addEventListener('click', async () => {
        const confirmed = await SavedStoriesPage.showConfirmDialog('Apakah Anda yakin ingin menghapus semua saved stories? Tindakan ini tidak dapat dibatalkan.');
        if (confirmed) {
          await this._clearAllData();
        }
      });
    }
  }

  _setupStoryEventListeners() {
    
    const viewButtons = document.querySelectorAll('.view-saved-story');
    viewButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const storyId = e.target.closest('.view-saved-story').dataset.id;
        window.location.hash = `#/detail/${storyId}`;
      });
    });

    const deleteButtons = document.querySelectorAll('.delete-saved-story');
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const storyId = e.target.closest('.delete-saved-story').dataset.id;
        const confirmed = await SavedStoriesPage.showConfirmDialog('Hapus story ini dari saved stories?');
        if (confirmed) {
          await this._deleteStory(storyId);
        }
      });
    });
  }

  static showConfirmDialog(message) {
    return new Promise((resolve) => {
      const dialog = document.getElementById('custom-confirm-dialog');
      if (!dialog) return resolve(window.confirm(message));
      dialog.classList.remove('hidden');
      dialog.querySelector('.dialog-message').textContent = message;
      const onConfirm = () => {
        cleanup();
        resolve(true);
      };
      const onCancel = () => {
        cleanup();
        resolve(false);
      };
      function cleanup() {
        dialog.classList.add('hidden');
        confirmBtn.removeEventListener('click', onConfirm);
        cancelBtn.removeEventListener('click', onCancel);
        dialog.querySelector('.dialog-backdrop').removeEventListener('click', onCancel);
      }
      const confirmBtn = dialog.querySelector('.dialog-confirm');
      const cancelBtn = dialog.querySelector('.dialog-cancel');
      confirmBtn.addEventListener('click', onConfirm);
      cancelBtn.addEventListener('click', onCancel);
      dialog.querySelector('.dialog-backdrop').addEventListener('click', onCancel);
    });
  }

  async _clearAllData() {
    const clearBtn = document.getElementById('clear-all-saved');
    try {
      if (clearBtn) {
        clearBtn.disabled = true;
        clearBtn.innerHTML = 'Menghapus...';
      }
      if (!window.indexedDBManager) {
        window.indexedDBManager = new IndexedDBManager();
        await window.indexedDBManager.init();
      }
      await window.indexedDBManager.clearAllStories();
      await this._loadSavedData();
      this._showSuccess('Semua saved stories berhasil dihapus');
    } catch (error) {
      this._showError('Gagal menghapus saved stories');
      alert('Terjadi kesalahan saat menghapus semua data: ' + (error && error.message ? error.message : error));
    } finally {
      if (clearBtn) {
        clearBtn.disabled = false;
        clearBtn.innerHTML = 'Hapus Semua';
      }
    }
  }

  async _deleteStory(storyId) {
    try {
      if (!window.indexedDBManager) {
        window.indexedDBManager = new IndexedDBManager();
        await window.indexedDBManager.init();
      }
      await window.indexedDBManager.deleteStory(storyId);
      await this._loadSavedData();
      this._showSuccess('Story berhasil dihapus dari saved stories');
      // Trigger event agar home page update tombol
      window.dispatchEvent(new Event('savedStoriesChanged'));
    } catch (error) {
      console.error('Error deleting story:', error);
      this._showError('Gagal menghapus story');
    }
  }

  _showSuccess(message) {
    this._showNotification(message, 'success');
  }

  _showError(message) {
    this._showNotification(message, 'error');
  }

  _showInfo(message) {
    this._showNotification(message, 'info');
  }

  _showNotification(message, type) {
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <span class="notification-message">${message}</span>
    `;

    
    document.body.appendChild(notification);

    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
}
