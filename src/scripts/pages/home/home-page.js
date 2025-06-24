import { StoryModel } from '../../data/api';
import { HomePresenter } from './home-presenter';

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
      <article class="story-item" tabindex="0" role="button" aria-label="Cerita ${story.name}. Klik untuk melihat detail." data-id="${story.id}">
        <img src="${story.photoUrl}" alt="Foto cerita: ${story.name}" class="story-img" loading="lazy" />
        <h2>${story.name}</h2>
        <p aria-label="Deskripsi cerita">${story.description}</p>
        <div class="story-meta" aria-label="Informasi lokasi">
          <p><strong>Lokasi:</strong> ${story.lat}, ${story.lon}</p>
        </div>
      </article>
    `).join('');
    container.querySelectorAll('.story-item').forEach(item => {
      item.addEventListener('click', () => {
        const storyId = item.dataset.id;
        window.location.hash = `#/detail/${storyId}`;
      });
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const storyId = item.dataset.id;
          window.location.hash = `#/detail/${storyId}`;
        }
      });
    });
  }

  renderFailedMessage(message) {
    document.getElementById('loading-message').style.display = 'none';
    document.getElementById('error-message').style.display = 'block';
    document.getElementById('error-message').innerText = message || 'Gagal memuat data cerita.';
  }
}
