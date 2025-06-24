export default class AboutPage {
  async render() {
    return `
      <section class="container about-page">
        <div class="about-header">
          <h1 class="about-title">Tentang Dicoding Stories</h1>
          <div class="about-subtitle">Platform berbagi cerita dengan foto dan lokasi</div>
        </div>
        
        <div class="about-content">
          <div class="about-section">
            <h2>Tentang Aplikasi</h2>
            <p>
              Dicoding Stories adalah platform berbagi cerita yang memungkinkan pengguna untuk membagikan pengalaman mereka
              melalui foto dan lokasi. Dibuat sebagai submission untuk kelas Web Intermediate Dicoding, aplikasi ini
              menampilkan implementasi aplikasi web modern dengan arsitektur SPA (Single Page Application).
            </p>
            <p>
              Aplikasi ini dibangun dengan menggunakan JavaScript murni, tanpa framework, yang menunjukkan
              kemampuan untuk mengorganisir kode dengan pola Model-View-Presenter (MVP) dalam aplikasi skala menengah.
            </p>
          </div>

          <div class="about-section">
            <h2>Fitur Utama</h2>
            <ul class="about-features">
              <li>
                <span class="feature-icon">🔐</span>
                <div class="feature-text">
                  <strong>Autentikasi</strong>
                  <p>Login dan register dengan aman melalui API Dicoding</p>
                </div>
              </li>
              <li>
                <span class="feature-icon">📷</span>
                <div class="feature-text">
                  <strong>Unggah Foto</strong>
                  <p>Berbagi cerita dengan foto langsung dari kamera atau galeri</p>
                </div>
              </li>
              <li>
                <span class="feature-icon">🗺️</span>
                <div class="feature-text">
                  <strong>Lokasi</strong>
                  <p>Tambahkan lokasi Anda saat mengunggah cerita</p>
                </div>
              </li>
              <li>
                <span class="feature-icon">🔍</span>
                <div class="feature-text">
                  <strong>Detail Cerita</strong>
                  <p>Lihat cerita pengguna lain lengkap dengan lokasi di peta</p>
                </div>
              </li>
              <li>
                <span class="feature-icon">📱</span>
                <div class="feature-text">
                  <strong>Responsif</strong>
                  <p>Tampilan yang menyesuaikan dengan berbagai ukuran layar</p>
                </div>
              </li>
            </ul>
          </div>

          <div class="about-section">
            <h2>Teknologi</h2>
            <p>
              Aplikasi ini dibangun dengan:
            </p>
            <div class="tech-stack">
              <span class="tech-badge">HTML5</span>
              <span class="tech-badge">CSS3</span>
              <span class="tech-badge">JavaScript</span>
              <span class="tech-badge">Webpack</span>
              <span class="tech-badge">View Transition API</span>
              <span class="tech-badge">Geolocation API</span>
              <span class="tech-badge">MediaDevices API</span>
              <span class="tech-badge">Leaflet Maps</span>
            </div>
          </div>

          <div class="about-section">
            <h2>Kredit</h2>
            <p>
              Dibuat oleh <strong>Markus Prap Kurniawan</strong> untuk Submission Kelas Membangun Aplikasi Web Intermediete - Dicoding Indonesia.
              Data cerita disediakan oleh Dicoding Story API.
            </p>
            <p>
              © ${new Date().getFullYear()} Dicoding Stories. Hak cipta dilindungi.
            </p>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    document.title = "About | Dicoding Stories";
  }
}
