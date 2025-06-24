export default class NotFoundPage {
  async render() {
    return `
      <section class="not-found-container">
        <div class="not-found-content">
          <div class="not-found-icon">
            <span class="error-code">404</span>
          </div>
          <h1>Halaman Tidak Ditemukan</h1>
          <p>Maaf, halaman yang Anda cari tidak dapat ditemukan. Halaman mungkin telah dipindahkan atau tidak ada.</p>
          <div class="not-found-actions">
            <a href="#/" class="btn btn-primary">
              <span class="btn-icon">🏠</span>
              Kembali ke Beranda
            </a>
            <a href="#/add" class="btn btn-secondary">
              <span class="btn-icon">➕</span>
              Tambah Story
            </a>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this._setupNavigation();
  }

  _setupNavigation() {
    const homeBtn = document.querySelector('a[href="#/"]');
    const addBtn = document.querySelector('a[href="#/add"]');
    
    if (homeBtn) {
      homeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.hash = '#/';
      });
    }

    if (addBtn) {
      addBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.hash = '#/add';
      });
    }
  }
}
