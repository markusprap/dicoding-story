import { StoryDetailModel } from '../../data/api';
import { StoryDetailPresenter } from './detail-presenter';
import { parseActivePathname } from '../../routes/url-parser';

export default class DetailPage {
  async render() {
    return `
      <section class="container" id="detail-section">
        <div id="detail-loading" style="display:none;">Loading...</div>
        <div id="detail-error" style="display:none;"></div>
        <div id="story-detail"></div>
        <div id="leaflet-map" style="height: 350px; width: 100%; margin-top: 24px; border-radius: 16px; display:none;"></div>
      </section>
    `;
  }  async afterRender() {
    try {
      const errorEl = document.getElementById('detail-error');
      if (errorEl) {
        errorEl.style.display = 'none';
        errorEl.innerText = '';
      }
      
      const { id } = parseActivePathname();
      
      if (!id) {
        this.renderFailedMessage('ID cerita tidak ditemukan.');
        return;
      }
      
      const model = new StoryDetailModel();
      const presenter = new StoryDetailPresenter(model, this);
      await presenter.loadStoryDetail(id);
    } catch (error) {
      this.renderFailedMessage('Terjadi kesalahan saat memuat halaman detail.');
    }
  }  showLoading() {
    const loadingEl = document.getElementById('detail-loading');
    const errorEl = document.getElementById('detail-error');
    const storyEl = document.getElementById('story-detail');
    const mapEl = document.getElementById('leaflet-map');
    
    if (loadingEl) loadingEl.style.display = 'block';
    if (errorEl) {
      errorEl.style.display = 'none';
      errorEl.innerText = '';
    }
    if (storyEl) storyEl.innerHTML = '';
    if (mapEl) mapEl.style.display = 'none';
  }  renderStoryDetail(story) {
    const loadingEl = document.getElementById('detail-loading');
    const errorEl = document.getElementById('detail-error');
    const storyEl = document.getElementById('story-detail');
    
    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) {
      errorEl.style.display = 'none';
      errorEl.innerText = '';
    }
    
    if (!story || !story.name || !story.description) {
      this.renderFailedMessage('Data cerita tidak lengkap.');
      return;
    }
    
    if (storyEl) {
      
      const renderDetailWithSaveButton = async () => {
        if (!window.indexedDBManager) {
          window.indexedDBManager = new (await import('../../utils/indexeddb-manager.js')).default();
          await window.indexedDBManager.init();
        }
        const savedStories = await window.indexedDBManager.getAllStories();
        const isSaved = savedStories.some(s => s.id === story.id);
        storyEl.innerHTML = `
        <div class="story-detail-card" style="background: white; border-radius: 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.10); padding: 32px 24px; max-width: 700px; margin: 0 auto 32px auto;">
          <article class="story-detail-item" role="article" aria-labelledby="story-title">
            <img src="${story.photoUrl || ''}" alt="Foto cerita: ${story.name}" class="story-img" loading="lazy" style="max-width: 100%; border-radius: 12px; margin-bottom: 18px;" />
            <h2 id="story-title" style="font-size:2rem; font-weight:700; margin-bottom:12px; color:#333;">${story.name}</h2>
            <p aria-label="Deskripsi cerita" style="color:#555; font-size:1.1rem; margin-bottom:18px;">${story.description}</p>
            <button id="save-story-detail-btn" class="btn ${isSaved ? 'btn-success' : 'btn-secondary'}" style="margin-bottom:18px;" ${isSaved ? 'disabled' : ''}>
              ${isSaved ? 'Saved' : 'Save Story'}
            </button>
            <section class="location-card" role="region" aria-label="Informasi lokasi cerita">
              <div class="location-header">
                <span class="location-icon" aria-hidden="true">📍</span>
                <strong>Lokasi Cerita</strong>
              </div>
              <div class="location-coords" aria-label="Koordinat lokasi">
                <span>Latitude: ${story.lat ? parseFloat(story.lat).toFixed(6) : 'N/A'}</span>
                <span>Longitude: ${story.lon ? parseFloat(story.lon).toFixed(6) : 'N/A'}</span>
              </div>
              <div class="location-actions" role="group" aria-label="Aksi peta">
                <a href="https://www.google.com/maps?q=${story.lat || 0},${story.lon || 0}" target="_blank" class="map-link" rel="noopener" aria-label="Buka lokasi di Google Maps (tab baru)">
                  <span aria-hidden="true">🗺️</span> Buka di Google Maps
                </a>
                <a href="https://www.openstreetmap.org/?mlat=${story.lat || 0}&mlon=${story.lon || 0}&zoom=15" target="_blank" class="map-link" rel="noopener" aria-label="Buka lokasi di OpenStreetMap (tab baru)">
                  <span aria-hidden="true">🌍</span> Buka di OpenStreetMap
                </a>
              </div>
            </section>
            <div class="story-meta" style="margin-top:18px;">
              <p><strong>Tanggal:</strong> <time datetime="${story.createdAt || ''}">${story.createdAt ? new Date(story.createdAt).toLocaleString() : 'N/A'}</time></p>
            </div>
          </article>
        </div>
        `;
        // Event tombol save
        const saveBtn = document.getElementById('save-story-detail-btn');
        if (saveBtn && !isSaved) {
          saveBtn.addEventListener('click', async () => {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';
            try {
              await window.indexedDBManager.saveStory(story);
              saveBtn.textContent = 'Saved';
              saveBtn.classList.remove('btn-secondary');
              saveBtn.classList.add('btn-success');
              window.dispatchEvent(new Event('savedStoriesChanged'));
            } catch (err) {
              saveBtn.disabled = false;
              saveBtn.textContent = 'Save Story';
              alert('Gagal menyimpan story');
            }
          });
        }
        // Listen event agar tombol update jika dihapus dari Saved Stories
        window.addEventListener('savedStoriesChanged', async () => {
          await renderDetailWithSaveButton();
        });
      };
      renderDetailWithSaveButton();
    }
    
    if (story.lat && story.lon) {
      this._renderLeafletMap(story);
    } else {
      const mapEl = document.getElementById('leaflet-map');
      if (mapEl) {
        mapEl.style.display = 'block';
        mapEl.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Lokasi tidak tersedia untuk cerita ini</div>';
      }
    }
  }  _renderLeafletMap(story) {
    const mapDiv = document.getElementById('leaflet-map');
    if (!mapDiv) {
      return;
    }
    
    if (!story.lat || !story.lon || 
        isNaN(parseFloat(story.lat)) || isNaN(parseFloat(story.lon))) {
      mapDiv.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Koordinat lokasi tidak valid</div>';
      return;
    }
    
    const lat = parseFloat(story.lat);
    const lon = parseFloat(story.lon);
    
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      mapDiv.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Koordinat lokasi di luar jangkauan</div>';
      return;
    }
    
    mapDiv.style.display = 'block';
    
    if (typeof L === 'undefined') {
      mapDiv.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Peta tidak dapat dimuat</div>';
      return;
    }
    
    if (window.detailMapInstance) {
      try {
        window.detailMapInstance.remove();
        window.detailMapInstance = null;
      } catch (e) {
        
      }
    }
    
    mapDiv.innerHTML = '';
    
    try {
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
      
      setTimeout(() => {
        try {
          const map = L.map('leaflet-map', {
            center: [lat, lon],
            zoom: 15,
            zoomControl: true,
            attributionControl: true
          });
          
          window.detailMapInstance = map;
          
          const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
          });
          
          const carto = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            attribution: '© CartoDB'
          });
          
          const baseMaps = {
            'OpenStreetMap': osm,
            'Carto Light': carto
          };
          
          osm.addTo(map);
          L.control.layers(baseMaps).addTo(map);
          
          const marker = L.marker([lat, lon]).addTo(map);
          marker.bindPopup(`<b>${story.name}</b><br>${story.description}`).openPopup();
        } catch (error) {
          mapDiv.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Gagal menginisialisasi peta</div>';
        }
      }, 100);
      
    } catch (error) {
      mapDiv.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Terjadi kesalahan saat memuat peta</div>';
    }
  }renderFailedMessage(customMessage = null) {
    const loadingEl = document.getElementById('detail-loading');
    const errorEl = document.getElementById('detail-error');
    const mapEl = document.getElementById('leaflet-map');
    
    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.innerText = customMessage || 'Gagal memuat detail cerita.';
    }
    if (mapEl) mapEl.style.display = 'none';
  }
  cleanup() {
    if (window.detailMapInstance) {
      try {
        window.detailMapInstance.remove();
        window.detailMapInstance = null;
      } catch (error) {
        // Silent cleanup
      }
    }
  }
}
