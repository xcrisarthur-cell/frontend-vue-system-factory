# Changelog - Environment Setup

## ✅ Perubahan yang Dibuat

### 1. Script untuk Switch Environment
- ✅ `scripts/switch-env.js` - Node.js script untuk switch environment (ES modules)
- ✅ `scripts/switch-env.ps1` - PowerShell script untuk Windows users

### 2. NPM Scripts Baru
Ditambahkan ke `package.json`:
- `npm run env:local` - Switch ke local environment
- `npm run env:prod` - Switch ke production environment
- `npm run env:check` - Check environment saat ini
- `npm run dev:local` - Switch ke local + run dev server
- `npm run dev:prod` - Switch ke production + run dev server
- `npm run build:local` - Build dengan local API
- `npm run build:prod` - Build dengan production API

### 3. File Template
- ✅ `env.template` - Template untuk file .env (bisa di-commit ke git)

### 4. Dokumentasi
- ✅ `ENVIRONMENT_SETUP.md` - Panduan lengkap environment setup
- ✅ `QUICK_ENV_GUIDE.md` - Quick reference guide
- ✅ `README.md` - Updated dengan informasi environment

### 5. Perbaikan http.js
- ✅ Menambahkan logging environment di development mode
- ✅ Menambahkan request/response interceptors untuk debugging
- ✅ Menampilkan environment info di console browser

## 🎯 Cara Menggunakan

### Quick Start
```bash
# Switch ke local
npm run env:local

# Switch ke production
npm run env:prod

# Development dengan auto-switch
npm run dev:local
npm run dev:prod
```

### File yang Dibuat
1. `.env` - Environment configuration (auto-generated oleh script, di-ignore oleh git)
2. `env.template` - Template untuk .env (bisa di-commit)

## 📝 Environment Variables

| Variable | Local | Production |
|----------|-------|------------|
| `VITE_API_URL` | `http://127.0.0.1:8000` | `http://103.164.99.2:1101` |
| `VITE_ENV` | `local` | `production` |

## 🔍 Verifikasi

Setelah switch environment, buka browser console. Anda akan melihat:
```
🔧 API Configuration:
   Environment: LOCAL (atau PRODUCTION)
   API URL: http://127.0.0.1:8000 (atau production URL)
```

## 📚 Dokumentasi

- **Quick Guide**: [QUICK_ENV_GUIDE.md](./QUICK_ENV_GUIDE.md)
- **Full Guide**: [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)
- **Main README**: [README.md](./README.md)

---

**Setup selesai! 🎉**

