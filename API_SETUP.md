# API Configuration Setup

## Overview
Frontend aplikasi dikonfigurasi untuk menggunakan API backend yang sudah di-deploy di fly.io.

## API URL
- **Production**: `https://backend-fastapi-system-factory.fly.dev`
- **Development (Local)**: `http://127.0.0.1:8000`

## Setup Environment Variables

### Untuk Development (Local Backend)

1. Buat file `.env.local` di root folder `frontend-vue-system-factory`:
```env
VITE_API_URL=http://127.0.0.1:8000
```

### Untuk Production (Fly.io Backend)

File `.env.local` tidak perlu dibuat, karena default sudah menggunakan production URL:
```env
VITE_API_URL=https://backend-fastapi-system-factory.fly.dev
```

Atau buat file `.env.production`:
```env
VITE_API_URL=https://backend-fastapi-system-factory.fly.dev
```

## Cara Menggunakan

### Development Mode
```bash
npm run dev
```
Frontend akan menggunakan API dari `.env.local` jika ada, atau default ke production URL.

### Production Build
```bash
npm run build
```
Build akan menggunakan `.env.production` jika ada, atau default ke production URL.

## File Konfigurasi

- `src/api/http.js` - Konfigurasi axios dengan baseURL dari environment variable
- `.env.local` - Untuk development (tidak di-commit ke git)
- `.env.production` - Untuk production build

## CORS Configuration

Backend sudah dikonfigurasi untuk allow CORS dari:
- `http://localhost:5173` (Vite default)
- `http://127.0.0.1:5173`
- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `http://localhost:8080`
- `http://127.0.0.1:8080`

Untuk production, set environment variable di fly.io:
```bash
fly secrets set ALLOWED_ORIGINS=https://your-frontend-domain.com
```

## Testing

Setelah setup, test dengan:
1. Buka browser console
2. Cek network tab untuk memastikan request ke API URL yang benar
3. Pastikan tidak ada CORS error


