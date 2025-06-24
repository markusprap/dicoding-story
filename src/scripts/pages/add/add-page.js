import { AddStoryModel } from '../../data/api';
import { AddStoryPresenter } from './add-presenter';

export default class AddPage {  constructor() {
    this.currentStream = null;
    this.capturedPhoto = null;
    this.map = null;
    this.marker = null;
  }
  async render() {
    return `
      <section class="container" id="add-section">
        <h1>Tambah Cerita Baru</h1>
        <form id="add-form" class="add-form" autocomplete="on" role="form" aria-label="Form tambah cerita baru">
          <div class="form-group">
            <label for="description">Deskripsi <span aria-label="wajib diisi">*</span></label>
            <textarea id="description" name="description" required placeholder="Tulis cerita Anda..." aria-describedby="description-help"></textarea>
            <small id="description-help" class="form-help">Ceritakan pengalaman atau momen yang ingin Anda bagikan</small>
          </div>
          
          <div class="form-group">
            <label for="photo">Foto <span aria-label="wajib diisi">*</span></label>
            <div class="photo-input-container" role="group" aria-label="Pilihan input foto">
              <div class="camera-controls">
                <button type="button" id="start-camera-btn" class="camera-btn" aria-describedby="camera-help">📷 Buka Kamera</button>
                <button type="button" id="capture-btn" class="camera-btn" style="display:none;" aria-label="Ambil foto dari kamera">📸 Ambil Foto</button>
                <button type="button" id="stop-camera-btn" class="camera-btn" style="display:none;" aria-label="Tutup kamera">❌ Tutup Kamera</button>
              </div>
              <small id="camera-help" class="form-help">Gunakan kamera untuk mengambil foto langsung atau pilih file dari perangkat</small>
              <video id="camera-preview" style="display:none; width:100%; max-width:400px; border-radius:12px; margin:12px 0;" aria-label="Preview kamera"></video>
              <canvas id="photo-canvas" style="display:none;" aria-hidden="true"></canvas>
              <div id="photo-preview" style="display:none; margin:12px 0;" role="img" aria-label="Preview foto yang diambil"></div>
              <input id="photo-file" name="photo" type="file" accept="image/*" style="margin-top:12px;" aria-label="Pilih file foto dari perangkat" />
            </div>
          </div>          <div class="form-group">
            <label for="location">Lokasi (opsional)</label>
            <div class="location-picker" role="group" aria-label="Pilihan lokasi cerita">
              <div class="location-picker-header">
                <span class="location-icon" aria-hidden="true">📍</span>
                <strong>Pilih Lokasi Cerita</strong>
              </div>
              
              <div class="location-picker-info">
                <p>Klik di peta, gunakan GPS, atau masukkan koordinat manual untuk memilih lokasi</p>
              </div>
              
              <div class="location-picker-actions">
                <button type="button" id="get-location-btn" class="location-btn">
                  <span class="icon">📍</span>
                  Gunakan GPS
                </button>
                <button type="button" id="manual-location-btn" class="location-btn">
                  <span class="icon">⌨️</span>
                  Input Manual
                </button>
                <button type="button" id="clear-location-btn" class="location-btn" style="background:#e74c3c;">
                  <span class="icon">🗑️</span>
                  Hapus Lokasi
                </button>
              </div>
              
              <div id="interactive-map" style="height: 300px; width: 100%; margin: 16px 0; border-radius: 12px; border: 2px solid #ddd;"></div>
              
              <div class="location-picker-help">
                <small class="help-item">Klik di peta untuk memilih lokasi</small>
                <small class="help-item">Gunakan GPS untuk lokasi saat ini</small>
                <small class="help-item">Input manual untuk koordinat spesifik</small>
              </div>
              
              <div id="location-result" style="display:none;" role="status" aria-live="polite"></div>
              <div id="manual-inputs" style="display:none;" role="group" aria-label="Input koordinat manual">
                <label for="manual-lat" class="sr-only">Latitude</label>
                <input type="number" id="manual-lat" placeholder="Latitude (contoh: -6.2088)" step="any" aria-label="Latitude koordinat">
                <label for="manual-lon" class="sr-only">Longitude</label>
                <input type="number" id="manual-lon" placeholder="Longitude (contoh: 106.8456)" step="any" aria-label="Longitude koordinat">
                <button type="button" id="confirm-manual-btn" class="location-btn" aria-label="Konfirmasi koordinat yang dimasukkan">✅ Konfirmasi Lokasi</button>
              </div>
            </div>
            <input type="hidden" id="lat" name="lat" />
            <input type="hidden" id="lon" name="lon" />
          </div>
          
          <button type="submit" id="add-btn" class="submit-btn" aria-describedby="submit-help">Tambah Cerita</button>
          <small id="submit-help" class="form-help">Pastikan semua informasi sudah benar sebelum mengirim</small>
        </form>
        <div id="add-loading" style="display:none;" role="status" aria-live="polite">Loading...</div>
        <div id="add-error" style="display:none;" role="alert" aria-live="assertive"></div>
        <div id="add-success" style="display:none;" role="status" aria-live="polite">Cerita berhasil ditambahkan!</div>
      </section>
    `;
  }
  async afterRender() {
    const model = new AddStoryModel();
    const presenter = new AddStoryPresenter(model, this);
    const form = document.getElementById('add-form');    this._setupCamera();
    this._setupLocationPicker();
    this._initializeMap();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const description = document.getElementById('description').value;
      let photo = this.capturedPhoto || document.getElementById('photo-file').files[0];
      const lat = document.getElementById('lat').value;
      const lon = document.getElementById('lon').value;
      
      if (!photo) {
        alert('Silakan ambil foto atau pilih file gambar');
        return;
      }
      
      if (!lat || !lon) {
        alert('Silakan pilih lokasi terlebih dahulu');
        return;
      }
      
      await presenter.submitStory({ description, photo, lat, lon });
      
      this._stopCamera();
    });
  }

  _setupCamera() {
    const startCameraBtn = document.getElementById('start-camera-btn');
    const captureBtn = document.getElementById('capture-btn');
    const stopCameraBtn = document.getElementById('stop-camera-btn');
    const video = document.getElementById('camera-preview');
    const canvas = document.getElementById('photo-canvas');
    const photoPreview = document.getElementById('photo-preview');

    startCameraBtn.addEventListener('click', () => this._startCamera());
    captureBtn.addEventListener('click', () => this._capturePhoto());
    stopCameraBtn.addEventListener('click', () => this._stopCamera());
  }

  async _startCamera() {
    try {
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment'
        }
      };

      this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
      const video = document.getElementById('camera-preview');
      video.srcObject = this.currentStream;
      video.play();

      document.getElementById('start-camera-btn').style.display = 'none';
      document.getElementById('capture-btn').style.display = 'inline-block';
      document.getElementById('stop-camera-btn').style.display = 'inline-block';
      video.style.display = 'block';
        } catch (error) {
      alert('Tidak dapat mengakses kamera. Silakan gunakan file picker.');
    }
  }

  _capturePhoto() {
    const video = document.getElementById('camera-preview');
    const canvas = document.getElementById('photo-canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    context.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      this.capturedPhoto = new File([blob], 'captured-photo.jpg', { type: 'image/jpeg' });
      
      const photoPreview = document.getElementById('photo-preview');
      photoPreview.innerHTML = `
        <img src="${canvas.toDataURL()}" style="max-width:100%; max-height:200px; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.1);" alt="Foto yang diambil" />
        <p style="margin-top:8px; color:#27ae60; font-weight:600;">✅ Foto berhasil diambil!</p>
      `;
      photoPreview.style.display = 'block';
      
      this._stopCamera();
    }, 'image/jpeg', 0.8);
  }

  _stopCamera() {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => track.stop());
      this.currentStream = null;
    }
    
    document.getElementById('start-camera-btn').style.display = 'inline-block';
    document.getElementById('capture-btn').style.display = 'none';
    document.getElementById('stop-camera-btn').style.display = 'none';
    document.getElementById('camera-preview').style.display = 'none';
  }
  _setupLocationPicker() {
    const getLocationBtn = document.getElementById('get-location-btn');
    const manualLocationBtn = document.getElementById('manual-location-btn');
    const confirmManualBtn = document.getElementById('confirm-manual-btn');
    const clearLocationBtn = document.getElementById('clear-location-btn');

    getLocationBtn.addEventListener('click', () => this._getCurrentLocation());
    manualLocationBtn.addEventListener('click', () => this._showManualInputs());
    confirmManualBtn.addEventListener('click', () => this._confirmManualLocation());
    clearLocationBtn.addEventListener('click', () => this._clearLocation());
  }  _initializeMap() {
    if (typeof L === 'undefined') {
      const mapDiv = document.getElementById('interactive-map');
      if (mapDiv) {
        mapDiv.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Peta tidak dapat dimuat</div>';
      }
      return;
    }
    
    if (this.map) {
      this.map.remove();
    }
    
    this.map = L.map('interactive-map').setView([-6.2088, 106.8456], 10);
    
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
    
    osm.addTo(this.map);
    L.control.layers(baseMaps).addTo(this.map);
    
    this.map.on('click', (e) => {
      this._setLocationFromMap(e.latlng.lat, e.latlng.lng);
    });
  }

  _setLocationFromMap(lat, lon) {
    document.getElementById('lat').value = lat;
    document.getElementById('lon').value = lon;
    
    if (this.marker) {
      this.marker.remove();
    }
    
    this.marker = L.marker([lat, lon]).addTo(this.map);
    this.marker.bindPopup(`<b>Lokasi Dipilih</b><br>Lat: ${lat.toFixed(6)}<br>Lon: ${lon.toFixed(6)}`).openPopup();
    
    const resultDiv = document.getElementById('location-result');
    resultDiv.innerHTML = `
      <div style="background: #e8f5e8; color: #27ae60; padding: 12px; border-radius: 8px;">
        ✅ <strong>Lokasi berhasil dipilih dari peta!</strong><br>
        <small>Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)}</small>
      </div>
    `;
    resultDiv.style.display = 'block';
    document.getElementById('manual-inputs').style.display = 'none';
  }

  _clearLocation() {
    document.getElementById('lat').value = '';
    document.getElementById('lon').value = '';
    
    if (this.marker) {
      this.marker.remove();
      this.marker = null;
    }
    
    document.getElementById('location-result').style.display = 'none';
    document.getElementById('manual-inputs').style.display = 'none';
  }
  _getCurrentLocation() {
    const resultDiv = document.getElementById('location-result');
    
    if (!navigator.geolocation) {
      resultDiv.innerHTML = '<div style="color: #e74c3c; padding: 12px;">❌ Geolocation tidak didukung browser ini</div>';
      resultDiv.style.display = 'block';
      return;
    }

    resultDiv.innerHTML = '<div style="color: #667eea; padding: 12px;">📍 Mendapatkan lokasi...</div>';
    resultDiv.style.display = 'block';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        this._setLocationFromMap(lat, lon);
        this.map.setView([lat, lon], 15);
      },
      (error) => {
        let errorMsg = '❌ Gagal mendapatkan lokasi';
        if (error.code === 1) errorMsg += ' - Akses lokasi ditolak';
        else if (error.code === 2) errorMsg += ' - Lokasi tidak tersedia';
        else if (error.code === 3) errorMsg += ' - Timeout';
        
        resultDiv.innerHTML = `<div style="color: #e74c3c; padding: 12px;">${errorMsg}</div>`;
      }
    );
  }

  _showManualInputs() {
    document.getElementById('manual-inputs').style.display = 'block';
    document.getElementById('location-result').style.display = 'none';
  }

  _confirmManualLocation() {
    const lat = document.getElementById('manual-lat').value;
    const lon = document.getElementById('manual-lon').value;
    
    if (!lat || !lon) {
      alert('Silakan isi latitude dan longitude');
      return;
    }
    
    if (isNaN(lat) || isNaN(lon)) {
      alert('Latitude dan longitude harus berupa angka');
      return;
    }
    
    document.getElementById('lat').value = lat;
    document.getElementById('lon').value = lon;
    
    const resultDiv = document.getElementById('location-result');
    resultDiv.innerHTML = `
      <div style="background: #e8f5e8; color: #27ae60; padding: 12px; border-radius: 8px;">
        ✅ <strong>Lokasi manual berhasil diset!</strong><br>
        <small>Lat: ${parseFloat(lat).toFixed(6)}, Lon: ${parseFloat(lon).toFixed(6)}</small>
      </div>
    `;
    resultDiv.style.display = 'block';
    document.getElementById('manual-inputs').style.display = 'none';
  }

  showLoading() {
    document.getElementById('add-loading').style.display = 'block';
    document.getElementById('add-error').style.display = 'none';
    document.getElementById('add-success').style.display = 'none';
  }

  renderSuccess() {
    document.getElementById('add-loading').style.display = 'none';
    document.getElementById('add-error').style.display = 'none';
    document.getElementById('add-success').style.display = 'block';
    document.getElementById('add-form').reset();
    document.getElementById('photo-preview').style.display = 'none';
    this.capturedPhoto = null;
    this._stopCamera();
  }

  renderError(message) {
    document.getElementById('add-loading').style.display = 'none';
    document.getElementById('add-success').style.display = 'none';
    const errorDiv = document.getElementById('add-error');
    errorDiv.style.display = 'block';
    errorDiv.innerText = message || 'Gagal menambah cerita.';
  }
}
