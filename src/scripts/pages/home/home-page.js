import { StoryModel } from '../../data/api';
import { HomePresenter } from './home-presenter';
import IndexedDBManager from '../../utils/indexeddb-manager.js';

export default class HomePage {
  async render() {
    return `
      <section class="container" id="story-list-section">
        <h1>Daftar Cerita</h1>
        <div id="story-list" role="feed" aria-label="Daftar cerita dari pengguna"></div>
        <div id="loading-message" style="display:none;" role="status" aria-live="polite">Loading...</div>
        <div id="error-message" style="display:none;" role="alert" aria-live="assertive"></div>
      </section>
    `;
  }

  async afterRender() {
    document.title = "Home | Dicoding Stories";
    
    const model = new StoryModel();
    const presenter = new HomePresenter(model, this);
    
    await presenter.loadStories();
  }

  showLoading() {
    document.getElementById('loading-message').style.display = 'block';
    document.getElementById('error-message').style.display = 'none';
    document.getElementById('story-list').innerHTML = '';
  }

  renderStories(stories) {
    document.getElementById('loading-message').style.display = 'none';
    document.getElementById('error-message').style.display = 'none';
    const container = document.getElementById('story-list');
    container.innerHTML = stories.map(story => `
      <article class="story-item" data-id="${story.id}">
        <div class="story-content" tabindex="0" role="button" aria-label="Cerita ${story.name}. Klik untuk melihat detail.">
          <img src="${story.photoUrl}" alt="Foto cerita: ${story.name}" class="story-img" loading="lazy" />
          <h2>${story.name}</h2>
          <p aria-label="Deskripsi cerita">${story.description}</p>
          <div class="story-meta" aria-label="Informasi lokasi">
            <p><strong>Lokasi:</strong> ${story.lat}, ${story.lon}</p>
          </div>
        </div>
        <div class="story-actions">
          <button class="btn btn-primary view-story" data-id="${story.id}">
            Lihat Detail
          </button>
          <button class="btn btn-secondary save-story" data-id="${story.id}">
            Save Story
          </button>
        </div>
      </article>
    `).join('');
    
    this._setupStoryEventListeners();
  }

  _setupStoryEventListeners() {
    const container = document.getElementById('story-list');
    
    
    container.querySelectorAll('.story-content').forEach(item => {
      item.addEventListener('click', () => {
        const storyId = item.closest('.story-item').dataset.id;
        window.location.hash = `#/detail/${storyId}`;
      });
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const storyId = item.closest('.story-item').dataset.id;
          window.location.hash = `#/detail/${storyId}`;
        }
      });
    });

    
    container.querySelectorAll('.view-story').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const storyId = btn.dataset.id;
        window.location.hash = `#/detail/${storyId}`;
      });
    });

    
    container.querySelectorAll('.save-story').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const storyId = btn.dataset.id;
        await this._saveStory(storyId, btn);
      });
    });
  }

  async _saveStory(storyId, buttonElement) {
    try {
      
      buttonElement.disabled = true;
      buttonElement.textContent = 'Saving...';

      
      const storyModel = window.storyModel;
      if (!storyModel) {
        throw new Error('Story model tidak tersedia');
      }

      
      const stories = await storyModel.getStories();
      const story = Array.isArray(stories) ? stories.find(s => s.id === storyId) : null;
      if (!story) {
        throw new Error('Story tidak ditemukan');
      }

      
      if (!window.indexedDBManager) {
        window.indexedDBManager = new IndexedDBManager();
        await window.indexedDBManager.init();
      }
      await window.indexedDBManager.saveStory(story);

      
      buttonElement.textContent = 'Saved';
      buttonElement.classList.remove('btn-secondary');
      buttonElement.classList.add('btn-success');
      
      this._showNotification('Story berhasil disimpan', 'success');

      
      setTimeout(() => {
        buttonElement.disabled = false;
        buttonElement.textContent = 'Save Story';
        buttonElement.classList.remove('btn-success');
        buttonElement.classList.add('btn-secondary');
      }, 2000);

    } catch (error) {
      console.error('Error saving story:', error);
      buttonElement.disabled = false;
      buttonElement.textContent = 'Save Story';
      this._showNotification('Gagal menyimpan story', 'error');
    }
  }

  _showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `<span class="notification-message">${message}</span>`;
    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  renderFailedMessage(message) {
    document.getElementById('loading-message').style.display = 'none';
    document.getElementById('error-message').style.display = 'block';
    document.getElementById('error-message').innerText = message || 'Gagal memuat data cerita.';
  }
}
