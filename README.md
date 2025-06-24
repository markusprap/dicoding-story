# Dicoding Story Web - Progressive Web App

Progressive Web App untuk berbagi cerita dengan fitur offline, push notifications, dan geolocation. Dikembangkan untuk submission Dicoding Web Intermediate.

## 🚀 Features

- 📱 **Progressive Web App (PWA)** - Installable & offline-ready
- 🔔 **Push Notifications** - Real-time notifications dari Dicoding API
- 💾 **Offline Storage** - IndexedDB untuk data offline
- 🗺️ **Interactive Maps** - Geolocation dengan OpenStreetMap
- 🎨 **Modern UI/UX** - Responsive design dengan smooth transitions
- ⚡ **Performance** - Workbox untuk advanced caching

## 🛠️ Technology Stack

- **Frontend**: JavaScript ES6+, CSS3, HTML5
- **Build Tool**: Webpack 5 dengan optimizations
- **PWA**: Workbox + Custom Service Worker
- **Storage**: IndexedDB + localStorage
- **API**: Dicoding Story REST API
- **Maps**: Leaflet + OpenStreetMap
- **Notifications**: Web Push API dengan VAPID

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (versi 16 atau lebih tinggi)
- [npm](https://www.npmjs.com/) (Node package manager)

## ⚙️ Installation

1. Clone repository:
   ```bash
   git clone https://github.com/markusprap/dicoding-story.git
   cd dicoding-story
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## 🔧 Scripts

- **Build for Production:**
  ```bash
  npm run build
  ```
  Menjalankan webpack dalam mode production dan menghasilkan file build ke direktori `dist`.

- **Start Development Server:**
  ```bash
  npm run start-dev
  ```
  Menjalankan server pengembangan dengan live reload dan hot module replacement.

- **Serve Production Build:**
  ```bash
  npm run serve
  ```
  Menyajikan konten dari direktori `dist` menggunakan http-server.

## 📁 Project Structure

```text
dicoding-story/
├── dist/                      # Compiled files for production
├── src/                       # Source project files
│   ├── public/                # Public assets
│   │   ├── favicon.png
│   │   └── images/
│   │       └── logo.png
│   ├── scripts/               # JavaScript modules
│   │   ├── components/        # UI components
│   │   ├── data/             # API models
│   │   ├── pages/            # Page components
│   │   ├── routes/           # Routing system
│   │   ├── utils/            # Utility modules
│   │   ├── config.js         # App configuration
│   │   └── index.js          # Main entry point
│   ├── styles/               # CSS files
│   │   └── styles.css        # Main stylesheet
│   ├── index.html            # Main HTML template
│   ├── manifest.json         # PWA manifest
│   └── sw-push.js           # Push notification handler
├── netlify.toml              # Netlify configuration
├── package.json              # Project metadata
├── STUDENT.txt               # Deployment URL
├── webpack.common.js         # Webpack common config
├── webpack.dev.js           # Webpack development config
└── webpack.prod.js          # Webpack production config
```

## 🌐 Live Demo

**Production URL**: [https://dicodingstory-project.netlify.app](https://dicodingstory-project.netlify.app)

## 📱 PWA Features

### Installation
- Aplikasi dapat diinstall ke homescreen
- Icon dan metadata tersedia di web app manifest
- Shortcuts ke halaman "Add Story"

### Offline Capability
- Workbox untuk smart caching strategies
- IndexedDB untuk storage offline
- Service Worker untuk background sync

### Push Notifications
- Terintegrasi dengan Dicoding API
- VAPID keys untuk secure messaging
- Custom notification actions

## 🔑 API Integration

Aplikasi menggunakan [Dicoding Story API](https://story-api.dicoding.dev) dengan endpoints:
- `POST /login` - User authentication
- `POST /register` - User registration
- `GET /stories` - Fetch stories
- `POST /stories` - Create new story
- `POST /notifications/subscribe` - Push notification subscription

## 🏗️ Development

### Local Development
1. Jalankan development server:
   ```bash
   npm run start-dev
   ```
2. Buka browser di `http://localhost:8080`

### Production Build
1. Build aplikasi:
   ```bash
   npm run build
   ```
2. Test production build:
   ```bash
   npm run serve
   ```

### Deployment
Aplikasi otomatis deploy ke Netlify melalui GitHub integration dengan konfigurasi:
- Build command: `npm run build`
- Publish directory: `dist`
- Redirects: SPA routing support

## 📊 Performance

- ⚡ Lighthouse Score: 90+ PWA
- 📦 Bundle size optimization dengan code splitting
- 🔄 Smart caching dengan Workbox
- 🖼️ Image optimization dan lazy loading

## 🎯 Submission Compliance

### Kriteria Wajib ✅
1. **API Integration** - Dicoding Story API
2. **SPA Architecture** - Hash routing dengan smooth transitions
3. **Data Display & Add** - Stories list dan form tambah
4. **Accessibility** - ARIA labels, semantic HTML
5. **Push Notifications** - Sesuai dokumentasi Dicoding
6. **PWA (Installable & Offline)** - Service Worker + Manifest
7. **IndexedDB** - Storage, display, delete offline data
8. **Public Deployment** - Netlify hosting

### Kriteria Opsional ✅
1. **Manifest Shortcuts & Screenshots** - PWA enhancements
2. **Workbox** - Advanced offline capability
3. **Not Found Page** - 404 handling

## 👥 Credits

- **Developer**: Levina
- **Project Manager**: Markus
- **Course**: Dicoding Web Intermediate
- **Institution**: DBS Foundation Coding Camp 2025

## 📄 License

This project is created for educational purposes as part of Dicoding submission.

---

*Made with ❤️ for Dicoding Web Intermediate Submission*
