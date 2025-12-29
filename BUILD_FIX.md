# 🔧 Build Fix - Node.js Version Issue

## ❌ Error yang Terjadi

```
You are using Node.js 18.20.8. Vite requires Node.js version 20.19+ or 22.12+.
error during build: [vite:vue] crypto.hash is not a function
```

## ✅ Solusi

Masalah ini terjadi karena Vite 7.3.0 memerlukan Node.js 20.19+ atau 22.12+, tetapi Netlify menggunakan Node.js 18 secara default.

### File yang Sudah Diperbaiki:

1. **netlify.toml** - Menambahkan `NODE_VERSION = "20"`
2. **.nvmrc** - Diupdate ke `20`
3. **.node-version** - Diupdate ke `20`
4. **package.json** - Menambahkan `engines` field

### Langkah Selanjutnya:

1. **Commit dan push perubahan:**
   ```bash
   git add .
   git commit -m "Fix: Set Node.js version to 20 for Netlify build"
   git push
   ```

2. **Netlify akan otomatis rebuild** dengan Node.js 20

3. **Atau trigger manual rebuild:**
   - Buka Netlify dashboard
   - Pilih site Anda
   - Klik "Trigger deploy" → "Clear cache and deploy site"

## 🔍 Verifikasi

Setelah deploy, cek build logs untuk memastikan:
- Node.js version menunjukkan 20.x.x
- Build berhasil tanpa error `crypto.hash`

## 📝 Catatan

Jika masih ada masalah, pastikan:
- File `netlify.toml` sudah di-commit dan di-push
- Environment variable `NODE_VERSION` tidak di-override di Netlify dashboard
- Cache sudah di-clear (opsional tapi recommended)

