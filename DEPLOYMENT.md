# 🚀 Deployment Guide - Netlify

Panduan lengkap untuk deploy aplikasi ini ke Netlify melalui GitHub.

## 📋 Prerequisites

1. Akun GitHub
2. Akun Netlify (gratis)
3. Repository GitHub untuk project ini

## 🔧 Setup Awal

### 1. Inisialisasi Git (jika belum)

```bash
cd frontend-vue-system-factory
git init
git add .
git commit -m "Initial commit: Ready for Netlify deployment"
```

### 2. Push ke GitHub

```bash
# Buat repository baru di GitHub, lalu:
git remote add origin https://github.com/your-username/your-repo-name.git
git branch -M main
git push -u origin main
```

## 🌐 Deploy ke Netlify

### Metode 1: Melalui GitHub (Recommended)

1. **Login ke Netlify**
   - Buka [https://app.netlify.com](https://app.netlify.com)
   - Login dengan GitHub account

2. **Import Project**
   - Klik "Add new site" → "Import an existing project"
   - Pilih "GitHub" dan authorize Netlify
   - Pilih repository Anda

3. **Konfigurasi Build**
   - Netlify akan otomatis mendeteksi konfigurasi dari `netlify.toml`:
     - **Build command**: `npm run build`
     - **Publish directory**: `dist`
   - Jika tidak terdeteksi, isi manual:
     - Build command: `npm run build`
     - Publish directory: `dist`

4. **Environment Variables (Penting!)**
   - Klik "Show advanced" → "New variable"
   - Tambahkan:
     - **Key**: `VITE_API_URL`
     - **Value**: URL backend API Anda (contoh: `https://backend-fastapi-system-factory.fly.dev`)
   - Klik "Deploy site"

5. **Tunggu Build Selesai**
   - Netlify akan otomatis build dan deploy
   - Setelah selesai, Anda akan mendapat URL seperti: `https://your-site-name.netlify.app`

### Metode 2: Manual Deploy (Drag & Drop)

1. **Build Lokal**
   ```bash
   npm install
   npm run build
   ```

2. **Deploy**
   - Buka [https://app.netlify.com/drop](https://app.netlify.com/drop)
   - Drag & drop folder `dist/` ke halaman tersebut
   - Tunggu hingga deploy selesai

## ⚙️ Konfigurasi Environment Variables

### Di Netlify Dashboard:

1. Buka site Anda di Netlify
2. Go to **Site settings** → **Environment variables**
3. Tambahkan variable:
   - `VITE_API_URL` = URL backend API Anda

### Variable yang Tersedia:

- `VITE_API_URL` - Base URL untuk API backend (required)

## 🔄 Continuous Deployment

Setelah setup pertama, setiap push ke branch `main` akan otomatis trigger build dan deploy baru.

### Branch Deploys

- **Production**: Deploy dari branch `main`
- **Preview**: Deploy dari branch lain (otomatis dibuat preview URL)

## 🛠️ Troubleshooting

### Build Fails

**Error: Command not found**
```bash
# Pastikan Node.js version sesuai
# Di Netlify: Site settings → Build & deploy → Environment
# Set Node version: 18 atau 20
```

**Error: Module not found**
```bash
# Pastikan semua dependencies ada di package.json
npm install
```

### Routing tidak bekerja

- Pastikan file `public/_redirects` ada dan berisi: `/*    /index.html   200`
- Pastikan `netlify.toml` sudah ada dengan redirect configuration

### API tidak terhubung

1. Cek environment variable `VITE_API_URL` sudah diset di Netlify
2. Pastikan API URL menggunakan HTTPS
3. Cek CORS settings di backend API
4. Cek browser console untuk error details

### Build terlalu lama

- Netlify free tier: 300 build minutes/month
- Pastikan tidak ada dependency yang tidak perlu
- Gunakan `.npmrc` untuk cache optimization

## 📝 Custom Domain (Optional)

1. Di Netlify dashboard, buka **Domain settings**
2. Klik **Add custom domain**
3. Ikuti instruksi untuk setup DNS

## 🔐 Security Headers

File `netlify.toml` sudah dikonfigurasi dengan security headers:
- X-Frame-Options
- X-XSS-Protection
- X-Content-Type-Options
- Referrer-Policy

## 📊 Monitoring

- **Deploy logs**: Lihat di Netlify dashboard → Deploys
- **Function logs**: Jika menggunakan Netlify Functions
- **Analytics**: Aktifkan di Site settings → Analytics

## 🎯 Best Practices

1. **Environment Variables**: Jangan commit `.env` file, gunakan Netlify environment variables
2. **Build Optimization**: Pastikan build size tidak terlalu besar
3. **Cache**: File static sudah dikonfigurasi untuk cache di `netlify.toml`
4. **Testing**: Test build lokal sebelum push: `npm run build && npm run preview`

## 📞 Support

Jika ada masalah:
1. Cek Netlify build logs
2. Cek browser console untuk error
3. Pastikan semua file konfigurasi sudah benar
4. Cek dokumentasi Netlify: [https://docs.netlify.com](https://docs.netlify.com)

