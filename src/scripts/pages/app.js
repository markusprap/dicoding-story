import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';

function isAuthenticated() {
  return !!localStorage.getItem('token');
}

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;
  #lastRenderedRoute = null;
  #lastAuthState = null;
  #renderAttempts = 0;
  #redirectCount = 0;
  #lastRedirectTime = 0;
  #offlineManager = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;
    this._setupDrawer();
    this._setupLogout();
    this._setupAuthListener();
    this._updateNavigation();
    if (window.offlineManager) {
      this.#offlineManager = window.offlineManager;
      this._injectOfflineManager();
    }
  }
  _injectOfflineManager() {}

  _setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      const isOpen = this.#navigationDrawer.classList.toggle('open');
      this.#drawerButton.setAttribute('aria-expanded', isOpen.toString());
      if (isOpen) {
        this.#navigationDrawer.querySelector('a').focus();
      }
    });
    this.#drawerButton.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.#drawerButton.click();
      }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.#navigationDrawer.classList.contains('open')) {
        this.#navigationDrawer.classList.remove('open');
        this.#drawerButton.setAttribute('aria-expanded', 'false');
        this.#drawerButton.focus();
      }
    });
    document.body.addEventListener('click', (event) => {
      if (!this.#navigationDrawer.contains(event.target) && !this.#drawerButton.contains(event.target)) {
        this.#navigationDrawer.classList.remove('open');
        this.#drawerButton.setAttribute('aria-expanded', 'false');
      }
      this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
          this.#navigationDrawer.classList.remove('open');
          this.#drawerButton.setAttribute('aria-expanded', 'false');
        });
      });
    });
  }

  _setupLogout() {
    document.addEventListener('click', (event) => {
      if (event.target.id === 'logout-btn') {
        event.preventDefault();
        localStorage.removeItem('token');
        window.location.hash = '#/login';
        this._updateNavigation();
      }
    });
  }
  _setupAuthListener() {
    window.addEventListener('storage', (event) => {
      if (event.key === 'token') {
        this._updateNavigation();
        // Re-render page if auth state changed
        this.renderPage();
      }
    });

    // Listen for custom auth state change events
    window.addEventListener('authStateChanged', (event) => {
      this._updateNavigation();
      // Small delay to ensure token is stored
      setTimeout(() => {
        this.renderPage();
      }, 100);
    });
  }

  _updateNavigation() {
    const navList = document.getElementById('nav-list');
    const authenticated = isAuthenticated();
    if (authenticated) {
      navList.innerHTML = `
        <li><a href="#/" aria-label="Halaman beranda">Beranda</a></li>
        <li><a href="#/add" aria-label="Tambah cerita baru">Tambah Cerita</a></li>
        <li><a href="#/saved" aria-label="Stories yang disimpan">Saved Stories</a></li>
        <li><a href="#/about" aria-label="Tentang aplikasi">About</a></li>
        <li><button id="logout-btn" class="logout-btn" aria-label="Keluar dari aplikasi">Logout</button></li>
      `;
    } else {
      navList.innerHTML = `
        <li><a href="#/login" aria-label="Masuk ke aplikasi">Login/Register</a></li>
        <li><a href="#/about" aria-label="Tentang aplikasi">About</a></li>
      `;
    }
  }

  _safeRedirect(hash) {
    const now = Date.now();
    if (now - this.#lastRedirectTime > 5000) {
      this.#redirectCount = 0;
    }
    if (this.#redirectCount > 3) {
      this.#content.innerHTML = `
        <div class="error-container">
          <h2>Navigation Error</h2>
          <p>Terlalu banyak redirect. Silakan refresh halaman.</p>
          <p>Last redirect: ${hash}</p>
          <button onclick="window.location.reload()">Refresh</button>
        </div>
      `;
      return false;
    }
    this.#redirectCount++;
    this.#lastRedirectTime = now;
    window.location.hash = hash;
    return true;
  }

  async renderPage() {
    try {
      const url = getActiveRoute();
      const currentHash = window.location.hash;
      const authenticated = isAuthenticated();
      if (window.currentPageInstance && typeof window.currentPageInstance.cleanup === 'function') {
        try {
          window.currentPageInstance.cleanup();
        } catch (error) {}
        window.currentPageInstance = null;
      }
      if (url !== this.#lastRenderedRoute || authenticated !== this.#lastAuthState) {
        this.#renderAttempts = 0;
      }
      if (this.#renderAttempts > 3) {
        this.#content.innerHTML = `
          <div class="error-container">
            <h2>Terjadi Error</h2>
            <p>Aplikasi terdeteksi mengalami loop reload.</p>
            <p>Route: ${url}, Auth: ${authenticated}</p>
            <button onclick="localStorage.clear(); window.location.hash='#/';">Reset Aplikasi</button>
          </div>
        `;
        return;
      }
      this.#renderAttempts++;
      this.#lastRenderedRoute = url;
      this.#lastAuthState = authenticated;
      if (url === '/about') {
        const page = routes[url];
        if (page) {
          this.#content.innerHTML = await page.render();
          await page.afterRender();
          this.#renderAttempts = 0;
        }
        this._updateNavigation();
        return;
      }      // Handle empty hash or root path
      if (!currentHash || currentHash === '#' || currentHash === '#/') {
        if (authenticated) {
          const page = routes['/'];
          if (page) {
            this.#content.innerHTML = await page.render();
            await page.afterRender();
            this.#renderAttempts = 0;
          }
        } else {
          // Redirect to login if not authenticated
          if (currentHash !== '#/login' && this.#redirectCount < 2) {
            this._safeRedirect('/login');
            return;
          } else {
            const page = routes['/login'];
            if (page) {
              this.#content.innerHTML = await page.render();
              await page.afterRender();
              this.#renderAttempts = 0;
            }
          }
        }
        this._updateNavigation();
        return;
      }

      // Handle explicit login route
      if (url === '/login') {
        if (authenticated) {
          // If already authenticated, redirect to home
          this._safeRedirect('/');
          return;
        } else {
          // Show login page
          const page = routes['/login'];
          if (page) {
            this.#content.innerHTML = await page.render();
            await page.afterRender();
            this.#renderAttempts = 0;
          }
          this._updateNavigation();
          return;
        }
      }
      const protectedRoutes = ['/', '/add', '/detail/:id'];
      const isProtectedRoute = protectedRoutes.some(route => {
        if (route.includes(':')) {
          const routePattern = route.replace(':id', '[^/]+');
          const regex = new RegExp(`^${routePattern}$`);
          return regex.test(url);
        }
        return route === url;
      });
      if (!authenticated && isProtectedRoute) {
        if (currentHash !== '#/login') {
          this._safeRedirect('/login');
        } else {
          const page = routes['/login'];
          if (page) {
            this.#content.innerHTML = await page.render();
            await page.afterRender();
            this.#renderAttempts = 0;
          }
        }        this._updateNavigation();
        return;
      }

      
      this._updateNavigation();      const page = routes[url];
      if (!page) {
        const notFoundPage = routes['/404'];
        if (notFoundPage) {
          this.#content.innerHTML = await notFoundPage.render();
          await notFoundPage.afterRender();
        } else {
          this.#content.innerHTML = `
            <div class="error-container">
              <h2>404 - Halaman Tidak Ditemukan</h2>
              <p>Halaman yang Anda cari tidak ada.</p>
              <p>Route: ${url}</p>
              <a href="#/">Kembali ke Beranda</a>
            </div>
          `;
        }
        this.#renderAttempts = 0;
        return;
      }
      this.#content.innerHTML = await page.render();
      if (typeof page.afterRender === 'function') {
        await page.afterRender();
      }
      if (typeof page.getInstance === 'function') {
        window.currentPageInstance = page.getInstance();
      }
      this.#renderAttempts = 0;
    } catch (err) {
      this.#content.innerHTML = `
        <div class="error-container">
          <h2>Error</h2>
          <p>Terjadi kesalahan saat memuat halaman.</p>
          <p class="error-message">${err.message}</p>
          <button onclick="window.location.reload()">Refresh</button>
        </div>
      `;
    }
  }
}

export default App;
