# Quick Environment Guide 🚀

Panduan cepat untuk switch environment antara local dan production.

## ⚡ Quick Commands

```bash
# Switch ke local
npm run env:local

# Switch ke production
npm run env:prod

# Check environment saat ini
npm run env:check

# Development dengan local API
npm run dev:local

# Development dengan production API
npm run dev:prod
```

## 📝 Setup Pertama Kali

1. **Buat file `.env` di root folder:**
   ```bash
   npm run env:local
   ```

2. **Atau manual, copy dari `env.template`:**
   ```bash
   cp env.template .env
   ```

3. **Edit `.env` sesuai kebutuhan:**
   ```env
   VITE_API_URL=http://127.0.0.1:8000
   VITE_ENV=local
   ```

## 🔄 Switch Environment

### Cara 1: Menggunakan Script (Recommended)
```bash
npm run env:local    # Switch ke local
npm run env:prod     # Switch ke production
```

### Cara 2: Auto-Switch + Run
```bash
npm run dev:local    # Switch ke local + run dev
npm run dev:prod     # Switch ke production + run dev
```

### Cara 3: Manual Edit
Edit file `.env`:
```env
# Local
VITE_API_URL=http://127.0.0.1:8000
VITE_ENV=local

# Production
VITE_API_URL=http://103.164.99.2:1101
VITE_ENV=production
```

**⚠️ Jangan lupa restart dev server setelah edit manual!**

## ✅ Verifikasi

Setelah switch, buka browser console. Anda akan melihat:
```
🔧 API Configuration:
   Environment: LOCAL (atau PRODUCTION)
   API URL: http://127.0.0.1:8000 (atau production URL)
```

## 🎯 Common Workflows

### Development dengan Backend Local
```bash
# 1. Pastikan backend running
cd ../backend-fastapi-system-factory
python -m uvicorn app.main:app --reload

# 2. Switch frontend ke local
cd ../frontend-vue-system-factory
npm run env:local
npm run dev
```

### Testing dengan Production API
```bash
# Switch ke production
npm run env:prod
npm run dev
```

### Build untuk Deploy
```bash
# Switch ke production
npm run env:prod

# Build
npm run build

# Deploy folder dist/
```

## 🐛 Troubleshooting

**Environment tidak berubah?**
1. Restart dev server (Ctrl+C lalu `npm run dev`)
2. Hard refresh browser (Ctrl+Shift+R)

**CORS Error?**
- Pastikan backend running (untuk local)
- Check URL di `.env` benar

**Script tidak jalan?**
- Pastikan Node.js terinstall
- Run: `node scripts/switch-env.js local`

---

**📖 Untuk panduan lengkap, lihat [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)**

