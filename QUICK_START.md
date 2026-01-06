# ⚡ Quick Start - Deploy ke Netlify

## 🚀 Langkah Cepat

### 1. Push ke GitHub
```bash
git init
git add .
git commit -m "Ready for Netlify deployment"
git remote add origin https://github.com/your-username/your-repo.git
git branch -M main
git push -u origin main
```

### 2. Deploy di Netlify
1. Login ke [Netlify](https://app.netlify.com)
2. Klik "Add new site" → "Import an existing project"
3. Pilih GitHub → Pilih repository Anda
4. **Build settings** (otomatis terdeteksi dari `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `dist`
5. **Environment variables** → Add variable:
   - Key: `VITE_API_URL`
   - Value: `http://103.164.99.2:1101` (atau URL API Anda)
6. Klik "Deploy site"

### 3. Selesai! 🎉
Setelah build selesai, aplikasi akan live di URL Netlify.

## 📋 Checklist

- [x] File `netlify.toml` sudah ada
- [x] File `public/_redirects` sudah ada
- [x] File `.env.example` sudah ada
- [x] `.gitignore` sudah mengabaikan `.env`
- [x] `vite.config.js` sudah dioptimalkan
- [ ] Repository sudah di-push ke GitHub
- [ ] Environment variable `VITE_API_URL` sudah diset di Netlify

## 📚 Dokumentasi Lengkap

Lihat `DEPLOYMENT.md` untuk panduan lengkap dan troubleshooting.

