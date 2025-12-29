# Frontend Vue System Factory

Aplikasi frontend untuk sistem factory management menggunakan Vue 3 + Vite.

## 🚀 Teknologi

- **Vue 3** - Progressive JavaScript Framework
- **Vite** - Next Generation Frontend Tooling
- **Vue Router** - Official router for Vue.js
- **Pinia** - State management
- **Chart.js** - Data visualization
- **Axios** - HTTP client

## 📦 Instalasi

```bash
# Install dependencies
npm install
```

## 🛠️ Development

```bash
# Run development server
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5173`

## 🏗️ Build untuk Production

```bash
# Build untuk production
npm run build
```

Build output akan berada di folder `dist/`

## 📤 Deploy ke Netlify

### Melalui GitHub (Recommended)

1. **Push ke GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/your-username/your-repo-name.git
   git push -u origin main
   ```

2. **Setup di Netlify**
   - Login ke [Netlify](https://www.netlify.com/)
   - Klik "Add new site" → "Import an existing project"
   - Pilih "GitHub" dan pilih repository Anda
   - Netlify akan otomatis mendeteksi konfigurasi dari `netlify.toml`:
     - **Build command**: `npm run build`
     - **Publish directory**: `dist`
   - Klik "Deploy site"

3. **Environment Variables (jika diperlukan)**
   - Di Netlify dashboard, buka Site settings → Environment variables
   - Tambahkan environment variables jika aplikasi memerlukan:
     - `VITE_API_URL` (atau nama variable sesuai kebutuhan)

### Manual Deploy

1. Build aplikasi:
   ```bash
   npm run build
   ```

2. Drag & drop folder `dist/` ke Netlify Drop

## ⚙️ Konfigurasi

### Environment Variables

Buat file `.env` untuk development:
```env
VITE_API_URL=https://your-api-url.com
```

Untuk production, set environment variables di Netlify dashboard.

### File Konfigurasi

- `netlify.toml` - Konfigurasi build dan deploy untuk Netlify
- `public/_redirects` - Redirect rules untuk SPA routing
- `vite.config.js` - Konfigurasi Vite

## 📁 Struktur Project

```
frontend-vue-system-factory/
├── public/          # Static assets
├── src/
│   ├── api/         # API services
│   ├── components/  # Vue components
│   ├── pages/       # Page components
│   ├── router/      # Vue Router config
│   ├── store/       # Pinia stores
│   └── main.js      # Entry point
├── netlify.toml     # Netlify configuration
└── package.json
```

## 🔧 Troubleshooting

### Build Error di Netlify

1. Pastikan Node.js version sesuai (cek di `package.json` atau set di Netlify)
2. Pastikan semua dependencies terinstall: `npm install`
3. Cek build command: `npm run build`

### Routing tidak bekerja di Netlify

- File `public/_redirects` sudah ada dan berisi `/*    /index.html   200`
- File `netlify.toml` sudah dikonfigurasi dengan redirect rules

### API tidak terhubung

- Pastikan environment variable `VITE_API_URL` sudah diset di Netlify
- Cek CORS settings di backend API
- Pastikan API URL menggunakan HTTPS di production

## 📝 License

MIT
