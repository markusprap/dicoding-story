import PushNotificationManager from '../utils/push-notification-manager';

class PushNotificationUI {
  constructor() {
    this.pushManager = new PushNotificationManager();
    this.container = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    const isSupported = await this.pushManager.initialize();
    if (!isSupported) return;
    this.createUI();
    this.bindEvents();
    this.updateUI();
    this.initialized = true;
  }
  createUI() {
    this.container = document.createElement('div');
    this.container.className = 'push-notification-toggle';
    this.container.innerHTML = `
      <div class="notification-toggle-content">
        <div class="toggle-info">
          <div class="toggle-icon">🔔</div>
          <div class="toggle-text">
            <div class="toggle-title">Notifikasi Story</div>
            <div class="toggle-subtitle">Dapatkan notifikasi cerita terbaru</div>
          </div>
        </div>        <div class="toggle-controls">
          <button id="notification-toggle-btn" class="toggle-btn" aria-label="Toggle notifications">
            <span class="toggle-state">Subscribe</span>
            <span class="toggle-loading hidden">⟳</span>
          </button>
        </div>
      </div>
      <div class="notification-message hidden"></div>
    `;

    const header = document.querySelector('header');
    if (header) {
      header.insertAdjacentElement('afterend', this.container);
    } else {
      document.body.insertAdjacentElement('afterbegin', this.container);
    }
  }  async updateUI() {
    if (!this.container) return;

    const toggleBtn = this.container.querySelector('#notification-toggle-btn');
    const stateSpan = toggleBtn.querySelector('.toggle-state');
    const toggleIcon = this.container.querySelector('.toggle-icon');

    const permission = Notification.permission;
    const isSubscribed = await this.pushManager.isSubscribed();

    if (permission === 'granted' && isSubscribed) {
      toggleBtn.classList.add('subscribed');
      toggleBtn.classList.remove('denied');
      stateSpan.textContent = 'Unsubscribe';
      toggleIcon.textContent = '🔕';
      toggleBtn.disabled = false;
      this.container.classList.remove('error');
      this.container.classList.add('success');
      this.showMessage('Anda akan menerima notifikasi cerita terbaru', 'success');
    } else if (permission === 'denied') {
      toggleBtn.classList.remove('subscribed');
      toggleBtn.classList.add('denied');
      stateSpan.textContent = 'Diblokir';
      toggleIcon.textContent = '🚫';
      toggleBtn.disabled = true;
      this.container.classList.remove('success');
      this.container.classList.add('error');
      this.showMessage('Notifikasi diblokir. Aktifkan di pengaturan browser.', 'error');
    } else {
      toggleBtn.classList.remove('subscribed', 'denied');
      stateSpan.textContent = 'Subscribe';
      toggleIcon.textContent = '🔔';
      toggleBtn.disabled = false;
      this.container.classList.remove('success', 'error');
      this.hideMessage();
    }
  }

  showMessage(text, type = 'info') {
    const messageEl = this.container.querySelector('.notification-message');
    messageEl.textContent = text;
    messageEl.className = `notification-message ${type}`;
    messageEl.classList.remove('hidden');
  }

  hideMessage() {
    const messageEl = this.container.querySelector('.notification-message');
    messageEl.classList.add('hidden');
  }  bindEvents() {
    if (!this.container) return;
    const toggleBtn = this.container.querySelector('#notification-toggle-btn');
    
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.handleToggleClick());
    }
  }  async handleToggleClick() {
    if (!this.container) return;

    const toggleBtn = this.container.querySelector('#notification-toggle-btn');
    const stateSpan = toggleBtn.querySelector('.toggle-state');
    const loadingSpan = toggleBtn.querySelector('.toggle-loading');

    toggleBtn.disabled = true;
    stateSpan.classList.add('hidden');
    loadingSpan.classList.remove('hidden');

    try {
      const isSubscribed = await this.pushManager.isSubscribed();
      if (isSubscribed) {
        await this.pushManager.unsubscribe();
        this.showMessage('Berhasil berhenti berlangganan notifikasi', 'success');
      } else {
        const token = localStorage.getItem('token');
        if (!token) {
          this.showMessage('Harap login terlebih dahulu untuk mengaktifkan notifikasi', 'error');
          return;
        }
        await this.pushManager.subscribe();
        this.showMessage('Berhasil berlangganan notifikasi!', 'success');
      }
      await this.updateUI();
    } catch (error) {
      if (error.message.includes('Permission not granted')) {
        this.showMessage('Izin notifikasi ditolak. Aktifkan di pengaturan browser.', 'error');
      } else if (error.message.includes('No authentication token')) {
        this.showMessage('Harap login terlebih dahulu untuk mengaktifkan notifikasi', 'error');
      } else {
        this.showMessage('Gagal: ' + error.message, 'error');
      }
    }

    stateSpan.classList.remove('hidden');
    loadingSpan.classList.add('hidden');
    toggleBtn.disabled = false;
  }async notifyNewStory(storyData) {
    if (Notification.permission !== 'granted') {
      return;
    }

    try {
      await this.pushManager.sendNotification(
        '🎉 Story Berhasil Ditambahkan!',
        `"${storyData.description}" telah berhasil dipublikasikan.`,
        {
          tag: 'new-story-' + storyData.id,
          data: {
            type: 'new-story',
            storyId: storyData.id,
            url: storyData.id ? `#/detail/${storyData.id}` : '#/'
          },
          autoCloseTime: 8000
        }
      );

      this.showMessage('✅ Notifikasi story baru telah dikirim!', 'success');
      
      setTimeout(() => {
        this.hideMessage();
      }, 3000);
      
    } catch (error) {
      this.showMessage('⚠️ Gagal mengirim notifikasi: ' + error.message, 'error');
    }
  }  async triggerNewStoryPush(storyData) {
    try {
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default PushNotificationUI;
