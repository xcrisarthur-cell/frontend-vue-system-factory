# 🚀 Deployment Guide - Vercel

Panduan lengkap untuk deploy aplikasi ini ke Vercel melalui GitHub.

## 📋 Prerequisites

1. Akun GitHub
2. Akun Vercel (gratis)
3. Repository GitHub untuk project ini

## 🔧 Setup Awal

### 1. Inisialisasi Git (jika belum)

```bash
cd frontend-vue-system-factory
git init
git add .
git commit -m "Ready for Vercel deployment"
```

### 2. Push ke GitHub

```bash
# Buat repository baru di GitHub, lalu:
git remote add origin https://github.com/your-username/your-repo-name.git
git branch -M main
git push -u origin main
```

## 🌐 Deploy ke Vercel

### Metode 1: Melalui GitHub (Recommended)

1. **Login ke Vercel**
   - Buka [https://vercel.com](https://vercel.com)
   - Login dengan GitHub account

2. **Import Project**
   - Klik "Add New..." → "Project"
   - Pilih "Import Git Repository"
   - Pilih repository Anda dari GitHub

3. **Konfigurasi Project**
   - Vercel akan otomatis mendeteksi konfigurasi dari `vercel.json`:
     - **Framework Preset**: Vite
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
     - **Install Command**: `npm install`
   - Jika tidak terdeteksi, isi manual:
     - Framework Preset: Vite
     - Build Command: `npm run build`
     - Output Directory: `dist`

4. **Environment Variables (Penting!)**
   - Klik "Environment Variables"
   - Tambahkan:
     - **Key**: `VITE_API_URL`
     - **Value**: URL backend API Anda (contoh: `http://103.164.99.2:1101`)
     - **Environment**: Production, Preview, Development (pilih sesuai kebutuhan)
   - Klik "Deploy"

5. **Tunggu Build Selesai**
   - Vercel akan otomatis build dan deploy
   - Setelah selesai, Anda akan mendapat URL seperti: `https://your-site-name.vercel.app`

### Metode 2: Melalui Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Production Deploy**
   ```bash
   vercel --prod
   ```

## ⚙️ Konfigurasi Environment Variables

### Di Vercel Dashboard:

1. Buka project Anda di Vercel
2. Go to **Settings** → **Environment Variables**
3. Tambahkan variable:
   - `VITE_API_URL` = URL backend API Anda
   - Pilih environment: Production, Preview, Development

### Variable yang Tersedia:

- `VITE_API_URL` - Base URL untuk API backend (required)

## 🔄 Continuous Deployment

Setelah setup pertama, setiap push ke branch `main` akan otomatis trigger build dan deploy baru.

### Branch Deploys

- **Production**: Deploy dari branch `main`
- **Preview**: Deploy dari branch lain (otomatis dibuat preview URL)

## 🛠️ Troubleshooting

### Build Fails

**Error: terser not found**
```bash
# Sudah diperbaiki dengan mengubah minify ke 'esbuild' di vite.config.js
# Jika masih error, pastikan vite.config.js sudah di-commit
```

**Error: Module not found**
```bash
# Pastikan semua dependencies ada di package.json
npm install
```

### Routing tidak bekerja

- File `vercel.json` sudah dikonfigurasi dengan rewrites untuk SPA
- Pastikan `vercel.json` sudah di-commit

### API tidak terhubung

1. Cek environment variable `VITE_API_URL` sudah diset di Vercel
2. Pastikan API URL menggunakan HTTPS
3. Cek CORS settings di backend API
4. Cek browser console untuk error details

### Build terlalu lama

- Vercel free tier: Unlimited build minutes
- Pastikan tidak ada dependency yang tidak perlu
- Vercel menggunakan caching untuk mempercepat build

## 📝 Custom Domain (Optional)

1. Di Vercel dashboard, buka **Settings** → **Domains**
2. Klik "Add Domain"
3. Ikuti instruksi untuk setup DNS

## 🔐 Security Headers

File `vercel.json` sudah dikonfigurasi dengan security headers:
- X-Frame-Options
- X-XSS-Protection
- X-Content-Type-Options
- Referrer-Policy

## 📊 Monitoring

- **Deploy logs**: Lihat di Vercel dashboard → Deployments
- **Analytics**: Aktifkan di Settings → Analytics
- **Real-time logs**: Tersedia di setiap deployment

## 🎯 Best Practices

1. **Environment Variables**: Jangan commit `.env` file, gunakan Vercel environment variables
2. **Build Optimization**: Vite sudah dikonfigurasi dengan esbuild untuk minification (lebih cepat)
3. **Cache**: Vercel otomatis cache dependencies untuk build lebih cepat
4. **Testing**: Test build lokal sebelum push: `npm run build && npm run preview`

## 🔄 Perbedaan dengan Netlify

- **Vercel**: Lebih cepat untuk Next.js/Vite, unlimited build minutes
- **Netlify**: Lebih fleksibel untuk berbagai framework
- Keduanya mendukung automatic deployments dari GitHub

## 📞 Support

Jika ada masalah:
1. Cek Vercel build logs
2. Cek browser console untuk error
3. Pastikan semua file konfigurasi sudah benar
4. Cek dokumentasi Vercel: [https://vercel.com/docs](https://vercel.com/docs)

