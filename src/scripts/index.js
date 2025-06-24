import '../styles/styles.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Workbox } from 'workbox-window';
import App from './pages/app';
import PushNotificationUI from './components/push-notification-ui';
import PushNotificationManager from './utils/push-notification-manager';
import PWAInstallManager from './utils/pwa-install-manager';
import OfflineManager from './utils/offline-manager';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

window.L = L;
let isHandlingHashChange = false;
function animatePageTransition(callback) {
  if ('startViewTransition' in document) {
    document.startViewTransition(callback);
  } else {
    const main = document.getElementById('main-content');
    if (!main || !window.animate) {
      callback();
      return;
    }
    main.animate([
      { opacity: 1, transform: 'translateY(0px)' },
      { opacity: 0, transform: 'translateY(30px)' }
    ], { duration: 180, fill: 'forwards' }).onfinish = () => {
      callback();
      main.animate([
        { opacity: 0, transform: 'translateY(30px)' },
        { opacity: 1, transform: 'translateY(0px)' }
      ], { duration: 220, fill: 'forwards' });
    };
  }
}
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const mainContent = document.querySelector('#main-content');
    const skipLink = document.querySelector('.skip-link');
    
    if (skipLink && mainContent) {
      skipLink.addEventListener('click', function (event) {
        event.preventDefault();
        skipLink.blur();
        
        mainContent.focus();
        mainContent.scrollIntoView({ behavior: 'smooth' });
      });
    }

    window.addEventListener('error', function(event) {
      if (event.error && event.error.message && 
          (event.error.message.includes('Cannot read properties of undefined') ||
           event.error.message.includes('leaflet'))) {
        return;
      }
    });

    // Initialize app
    const app = new App({
      content: document.querySelector('#main-content'),
      drawerButton: document.querySelector('#drawer-button'),
      navigationDrawer: document.querySelector('#navigation-drawer'),
    });
    await app.renderPage();

    // Register Workbox Service Worker
    if ('serviceWorker' in navigator) {
      const wb = new Workbox('/sw.js');
      
      wb.addEventListener('installed', (event) => {
        if (event.isUpdate) {
          // Show update available notification
          if (confirm('App update available. Reload to get the latest version?')) {
            window.location.reload();
          }
        }
      });

      wb.addEventListener('waiting', (event) => {
        // Show user a prompt to refresh/reload the page
        if (confirm('New version available. Reload to update?')) {
          wb.messageSkipWaiting();
          window.location.reload();
        }
      });

      try {
        await wb.register();
      } catch (error) {
        console.log('SW registration failed');
      }
    }

    // Initialize Push Notifications after app is ready
    try {
      const pushNotificationUI = new PushNotificationUI();
      await pushNotificationUI.initialize();
      
      window.pushNotificationUI = pushNotificationUI;
      window.checkPushSupport = () => {
        return PushNotificationManager.checkBrowserSupport();
      };
    } catch (error) {
      // Silent fail
    }
    try {
      const offlineManager = new OfflineManager();
      window.offlineManager = offlineManager;
    } catch (error) {}
    try {
      const pwaInstallManager = new PWAInstallManager();
      window.pwaManager = pwaInstallManager;
    } catch (error) {}

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'NAVIGATE_TO_STORY' && event.data.storyId) {
        const newHash = `#/detail/${event.data.storyId}`;
        if (window.location.hash !== newHash) {
          window.location.hash = newHash;
        }
      }
    });

    let hashChangeTimeout;
    let lastProcessedHash = window.location.hash;
    
    window.addEventListener('hashchange', async (event) => {
      const currentHash = window.location.hash;
      if (currentHash === lastProcessedHash || isHandlingHashChange) {
        return;
      }
      if (hashChangeTimeout) {
        clearTimeout(hashChangeTimeout);
      }
      hashChangeTimeout = setTimeout(async () => {
        isHandlingHashChange = true;
        lastProcessedHash = currentHash;
        
        try {
          animatePageTransition(async () => {
            await app.renderPage();
          });
        } catch (err) {
          try {
            await app.renderPage();
          } catch (fallbackErr) {}
        } finally {
          isHandlingHashChange = false;
        }
      }, 100);
    });
  } catch (error) {
    document.querySelector('#main-content').innerHTML = `
      <div class="error-container">
        <h2>Application Error</h2>
        <p>Gagal menginisialisasi aplikasi. Silakan muat ulang halaman.</p>
        <p class="error-message">${error.message}</p>
        <button onclick="window.location.reload()">Muat Ulang</button>
      </div>
    `;
  }
});
