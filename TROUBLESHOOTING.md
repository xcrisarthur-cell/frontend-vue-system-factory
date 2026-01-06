# Troubleshooting Guide

## 🔍 Masalah: Data Workers Tidak Muncul di Frontend

### Gejala
- Request `GET /workers` berhasil (terlihat di console/log)
- Data muncul di Postman
- Tapi tidak ada data yang ditampilkan di frontend

### Langkah Debugging

#### 1. Check Browser Console

Buka browser console (F12) dan cari log berikut:

```
🔧 API Configuration:
   Environment: LOCAL
   API URL: http://127.0.0.1:8000

📤 GET /workers
✅ 200 /workers
📦 Workers Response Data: [...]
📦 Is Array: true
📦 Data Length: 35

📥 Workers Response: {...}
📥 Workers Data: [...]
✅ Workers set to: [...]
✅ Workers count: 35
```

**Jika tidak ada log ini:**
- Pastikan dev server running: `npm run dev`
- Check apakah ada error di console
- Pastikan environment sudah benar: `npm run env:check`

#### 2. Check Network Tab

1. Buka Developer Tools → Network tab
2. Refresh halaman
3. Cari request ke `/workers`
4. Click request tersebut
5. Check:
   - **Status**: Harus `200 OK`
   - **Response**: Harus berisi array of workers
   - **Request URL**: Harus sesuai dengan environment (local atau production)

**Jika status bukan 200:**
- Check backend server running
- Check CORS settings
- Check API URL di `.env`

#### 3. Check Debug Info di Halaman

Di development mode, akan ada debug info box di atas tabel:

```
Debug Info:
Workers Count: 35
Workers Type: Array
First Worker ID: 75
First Worker Name: Slamet Purnomo
```

**Jika Workers Count = 0:**
- Data tidak ter-assign dengan benar
- Check console untuk error
- Check response structure

#### 4. Check Environment

```bash
# Check environment saat ini
npm run env:check

# Pastikan menggunakan local jika backend di local
npm run env:local

# Restart dev server
npm run dev
```

#### 5. Check Response Structure

Di console, check apakah response structure benar:

```javascript
// Response harus seperti ini:
{
  data: [
    {
      id: 75,
      name: "Slamet Purnomo",
      position_id: 15,
      department_id: 11,
      position: {...},
      department: {...}
    },
    ...
  ],
  status: 200,
  ...
}
```

**Jika struktur berbeda:**
- Check backend response format
- Check axios interceptor tidak mengubah response

### Solusi Umum

#### 1. Clear Cache dan Hard Refresh

```bash
# Di browser
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

#### 2. Restart Dev Server

```bash
# Stop server (Ctrl+C)
# Start lagi
npm run dev
```

#### 3. Check Backend Running

```bash
# Di terminal backend
cd backend-fastapi-system-factory
python -m uvicorn app.main:app --reload

# Check di browser
http://127.0.0.1:8000/health
```

#### 4. Check CORS

Pastikan backend mengizinkan origin frontend:
- Local: `http://localhost:5173`
- Check di backend console: `CORS Allowed Origins: [...]`

#### 5. Check .env File

```bash
# Check file .env
cat .env

# Harus berisi:
VITE_API_URL=http://127.0.0.1:8000
VITE_ENV=local
```

### Common Errors

#### Error: "Network Error"
- Backend tidak running
- URL salah di `.env`
- CORS issue

**Solusi:**
1. Start backend server
2. Check `.env` file
3. Check CORS settings di backend

#### Error: "404 Not Found"
- Endpoint salah
- Base URL salah

**Solusi:**
1. Check API URL di `.env`
2. Check endpoint path di `src/api/workers.js`

#### Error: "CORS policy"
- Backend tidak allow origin frontend

**Solusi:**
1. Check `ALLOWED_ORIGINS` di backend
2. Pastikan `http://localhost:5173` ada di list

#### Data Kosong Tapi Request Success
- Response structure berbeda
- Data tidak ter-assign dengan benar

**Solusi:**
1. Check console log untuk response structure
2. Check apakah `workers.value` ter-assign dengan benar
3. Check template rendering conditions

### Debug Checklist

- [ ] Backend server running
- [ ] Frontend dev server running
- [ ] Environment variable benar
- [ ] Network request success (200 OK)
- [ ] Response data adalah array
- [ ] `workers.value` ter-assign dengan benar
- [ ] Tidak ada error di console
- [ ] Template conditions benar (`v-else-if`)

### Still Not Working?

1. **Check semua console logs** - ada error atau warning?
2. **Check Network tab** - request berhasil?
3. **Check Response** - data ada di response?
4. **Check Vue DevTools** - `workers` ref berisi data?
5. **Check template** - kondisi rendering benar?

### Contact

Jika masih tidak berhasil setelah semua langkah di atas:
1. Screenshot console logs
2. Screenshot Network tab
3. Screenshot debug info box
4. Check file `.env`
5. Check backend logs

---

**Happy Debugging! 🐛**

