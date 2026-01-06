# Environment Setup Guide

Panduan lengkap untuk mengatur dan switch antara environment local dan production dengan mudah.

## 📋 Daftar Isi

- [Quick Start](#quick-start)
- [Cara Setup Environment](#cara-setup-environment)
- [Switch Environment](#switch-environment)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

### Setup Awal

1. **Buat file `.env` di root folder frontend:**
   ```bash
   # Untuk local development
   VITE_API_URL=http://127.0.0.1:8000
   VITE_ENV=local
   ```

2. **Atau gunakan script untuk generate:**
   ```bash
   npm run env:local    # Switch ke local
   npm run env:prod     # Switch ke production
   ```

### Menjalankan dengan Environment Tertentu

```bash
# Development dengan local API
npm run dev:local

# Development dengan production API
npm run dev:prod

# Build untuk local
npm run build:local

# Build untuk production
npm run build:prod
```

## 🔧 Cara Setup Environment

### Metode 1: Manual (Recommended untuk pertama kali)

1. **Buat file `.env` di root folder `frontend-vue-system-factory/`:**

   **Untuk Local Development:**
   ```env
   VITE_API_URL=http://127.0.0.1:8000
   VITE_ENV=local
   ```

   **Untuk Production:**
   ```env
   VITE_API_URL=http://103.164.99.2:1101
   VITE_ENV=production
   ```

2. **Simpan file dan restart dev server:**
   ```bash
   npm run dev
   ```

### Metode 2: Menggunakan Script (Paling Mudah)

Script akan otomatis membuat/update file `.env`:

```bash
# Switch ke local
npm run env:local

# Switch ke production
npm run env:prod

# Check environment saat ini
npm run env:check
```

Setelah switch, restart dev server:
```bash
npm run dev
```

### Metode 3: Menggunakan NPM Scripts dengan Auto-Switch

Script ini akan switch environment dan langsung menjalankan dev server:

```bash
# Development dengan local API (auto-switch ke local)
npm run dev:local

# Development dengan production API (auto-switch ke production)
npm run dev:prod
```

## 🔄 Switch Environment

### Cara Cepat (Recommended)

```bash
# Switch ke local
npm run env:local

# Switch ke production
npm run env:prod

# Check environment saat ini
npm run env:check
```

### Cara Manual

1. Edit file `.env` di root folder
2. Update `VITE_API_URL` sesuai kebutuhan:
   - Local: `http://127.0.0.1:8000`
   - Production: `http://103.164.99.2:1101`
3. Update `VITE_ENV`:
   - Local: `local`
   - Production: `production`
4. Restart dev server

## 📝 Environment Variables

### Variables yang Tersedia

| Variable | Deskripsi | Local | Production |
|----------|-----------|-------|------------|
| `VITE_API_URL` | URL API backend | `http://127.0.0.1:8000` | `http://103.164.99.2:1101` |
| `VITE_ENV` | Environment identifier | `local` | `production` |

### Catatan Penting

- ✅ Semua variable harus dimulai dengan `VITE_` agar bisa diakses di client-side
- ✅ File `.env` sudah di-ignore oleh git (tidak akan di-commit)
- ✅ Environment variables di-load saat build time, bukan runtime
- ⚠️ Setelah mengubah `.env`, **restart dev server** agar perubahan ter-apply

## 🛠️ NPM Scripts

### Development Scripts

```bash
# Development default (menggunakan .env saat ini)
npm run dev

# Development dengan local API (auto-switch)
npm run dev:local

# Development dengan production API (auto-switch)
npm run dev:prod
```

### Build Scripts

```bash
# Build default (menggunakan .env saat ini)
npm run build

# Build untuk local
npm run build:local

# Build untuk production
npm run build:prod
```

### Environment Management Scripts

```bash
# Switch ke local environment
npm run env:local

# Switch ke production environment
npm run env:prod

# Check environment saat ini
npm run env:check
```

## 🔍 Verifikasi Environment

### 1. Check di Console Browser

Saat development, buka browser console. Anda akan melihat:

```
🔧 API Configuration:
   Environment: LOCAL
   API URL: http://127.0.0.1:8000
```

### 2. Check Request di Network Tab

- Buka Developer Tools → Network
- Lihat request API, pastikan URL sesuai dengan environment yang dipilih

### 3. Check File .env

```bash
# Di terminal
cat .env

# Atau buka file .env di editor
```

## 🐛 Troubleshooting

### Problem: Environment tidak berubah setelah switch

**Solusi:**
1. Pastikan dev server sudah di-restart
2. Hard refresh browser (Ctrl+Shift+R atau Cmd+Shift+R)
3. Clear browser cache
4. Check file `.env` sudah ter-update

### Problem: API request masih ke URL lama

**Solusi:**
1. Stop dev server (Ctrl+C)
2. Switch environment: `npm run env:local` atau `npm run env:prod`
3. Start dev server lagi: `npm run dev`
4. Hard refresh browser

### Problem: CORS Error saat menggunakan local API

**Solusi:**
1. Pastikan backend server sudah running di `http://127.0.0.1:8000`
2. Check CORS settings di backend (harus allow `http://localhost:5173`)
3. Pastikan URL di `.env` benar: `http://127.0.0.1:8000` (bukan `localhost`)

### Problem: Script tidak berjalan

**Solusi:**
1. Pastikan Node.js sudah terinstall (minimal v20.19.0)
2. Install dependencies: `npm install`
3. Check file `scripts/switch-env.js` ada
4. Run dengan: `node scripts/switch-env.js local`

### Problem: Environment variable tidak ter-load

**Solusi:**
1. Pastikan variable dimulai dengan `VITE_`
2. Pastikan file `.env` ada di root folder (sama level dengan `package.json`)
3. Restart dev server setelah mengubah `.env`
4. Untuk production build, pastikan environment variable sudah diset di hosting platform (Netlify, Vercel, dll)

## 📚 Best Practices

### 1. Gunakan Script untuk Switch

```bash
# ✅ Recommended
npm run env:local
npm run dev

# ❌ Tidak recommended (manual edit)
# Edit .env manually, mudah lupa format
```

### 2. Check Environment Sebelum Development

```bash
# Check environment saat ini
npm run env:check

# Pastikan sesuai dengan yang diinginkan
```

### 3. Gunakan Dev Scripts dengan Auto-Switch

```bash
# ✅ Recommended - Auto switch dan run
npm run dev:local

# ❌ Manual switch lalu run
npm run env:local
npm run dev
```

### 4. Commit .env.example

File `.env.example` berisi template yang bisa di-commit ke git:

```env
VITE_API_URL=http://127.0.0.1:8000
VITE_ENV=local
```

## 🎯 Workflow Recommended

### Development Local

```bash
# 1. Switch ke local
npm run env:local

# 2. Pastikan backend running di localhost:8000
cd ../backend-fastapi-system-factory
python -m uvicorn app.main:app --reload

# 3. Di terminal lain, run frontend
cd frontend-vue-system-factory
npm run dev
```

### Testing dengan Production API

```bash
# 1. Switch ke production
npm run env:prod

# 2. Run frontend (backend sudah di production)
npm run dev
```

### Build untuk Production

```bash
# 1. Switch ke production
npm run env:prod

# 2. Build
npm run build

# 3. Deploy folder dist/
```

## 📞 Support

Jika ada masalah dengan environment setup:

1. Check file `.env` sudah benar
2. Check console browser untuk error
3. Check network tab untuk request URL
4. Pastikan backend server running (untuk local)
5. Restart dev server setelah perubahan

---

**Happy Coding! 🚀**

