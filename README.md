# Admin Auth System

Project **terpisah** dari Nugroho Store: menangani registrasi, login, setup profil, dan Customer Service. Terhubung ke Nugroho Store lewat Firebase project yang sama + backend jembatan token.

## Struktur folder

```
admin-auth-system/
├── login.html
├── register.html
├── setup-profile.html
├── cs-help.html
├── assets/
│   ├── styles/               # sama persis dengan Nugroho Store (design system)
│   └── scripts/
│       ├── firebase-config.js
│       ├── auth-client.js
│       └── ui.js
├── server/                   # backend Node.js/Express — auth bridge
│   ├── index.js
│   ├── package.json
│   └── .env.example
├── firestore.rules           # sama dengan Nugroho Store (satu project Firebase)
├── firestore.indexes.json
└── storage.rules
```

## Kenapa butuh backend (`server/`)?

Frontend tidak boleh dan tidak bisa menerbitkan Firebase **custom token** sendiri — itu wewenang Firebase Admin SDK yang butuh *service account key* rahasia. Maka dibuat backend Express kecil yang tugasnya cuma satu: terima ID token hasil login, verifikasi keasliannya, lalu terbitkan custom token baru untuk dibawa pengguna ke Nugroho Store.

**Service account key JANGAN PERNAH**:
- ditaruh di kode frontend/browser,
- di-commit ke repository publik.

Cukup taruh sebagai environment variable di layanan hosting backend kamu (Render/Railway/Cloud Run/VPS).

## Deploy ke Vercel (disarankan, paling simpel)

Folder ini sekarang siap dideploy sebagai **satu project Vercel**: frontend statis (`login.html`, dll) dan API jembatan token (`api/issue-token.js`) jalan di domain yang sama — jadi tidak perlu server terpisah, dan tidak perlu urus CORS sama sekali.

1. Push folder `admin-auth-system/` ke sebuah repo Git (GitHub/GitLab/Bitbucket). **Pastikan `service-account.json` dan `.env` tidak ikut ter-commit** (sudah di-`.gitignore`, tapi cek ulang dengan `git status` sebelum push pertama kali).
2. Di [vercel.com](https://vercel.com) → **Add New Project** → import repo tadi.
3. Masuk ke **Project Settings → Environment Variables**, tambahkan:
   - **Key**: `FIREBASE_SERVICE_ACCOUNT`
   - **Value**: isi JSON service account kamu dalam **satu baris, TANPA tanda kutip pembungkus di awal/akhir** (beda dengan format `.env` yang butuh kutip — kolom Vercel langsung menyimpan apa adanya yang kamu paste). Kalau kamu masih pegang file JSON aslinya, minta aku compress-kan lagi jadi satu baris kapan saja.
   - **Environment**: centang Production, Preview, dan Development sekalian biar konsisten.
4. Deploy. Setelah selesai, kamu dapat domain seperti `admin-auth-system.vercel.app` (atau custom domain kalau sudah dipasang).
5. Update `assets/scripts/firebase-config.js` → pastikan `AUTH_BRIDGE_API = ""` (string kosong) karena API-nya sudah satu domain dengan frontend.
6. Di project **Nugroho Store**, update `ADMIN_AUTH_URL` supaya menunjuk ke domain Vercel ini.

> Catatan: folder `/server` (Express) tetap disediakan sebagai alternatif kalau suatu saat kamu mau pindah ke hosting Node biasa (Render/Railway/VPS) — tapi kalau pakai Vercel, folder itu **tidak dipakai**, cukup `/api/issue-token.js`.

## Menjalankan backend secara lokal (alternatif: Express, folder /server)

```bash
cd server
npm install
cp .env.example .env
# isi .env: ALLOWED_ORIGIN, dan salah satu dari FIREBASE_SERVICE_ACCOUNT / GOOGLE_APPLICATION_CREDENTIALS
npm run dev
```

Cara mendapatkan service account key: Firebase Console → Project Settings → Service Accounts → **Generate new private key**.

## Menjalankan frontend secara lokal

```bash
npx serve .
```

Lalu buka `login.html` atau `register.html`. Set `AUTH_BRIDGE_API` di `assets/scripts/firebase-config.js` ke `http://localhost:4000` saat development.

## Deploy

- **Frontend**: Firebase Hosting (subdomain berbeda dari Nugroho Store, misal `auth.nugroho.store`), Vercel, atau Netlify — bebas, karena murni file statis.
- **Backend** (`server/`): Render, Railway, Fly.io, Cloud Run, atau VPS mana pun yang bisa jalankan Node.js.

Setelah deploy, update:
- `ALLOWED_ORIGIN` di `.env` backend → domain frontend Admin Auth System.
- `AUTH_BRIDGE_API` di `assets/scripts/firebase-config.js` → URL backend yang sudah live.
- `STORE_URL` → domain Nugroho Store.
- `ADMIN_AUTH_URL` di project Nugroho Store → domain Admin Auth System ini.

## Alur lengkap registrasi → masuk ke Nugroho Store

1. `register.html` → `createUserWithEmailAndPassword` (Firebase Client SDK).
2. Redirect ke `setup-profile.html` → isi nama, bio, avatar, no HP → tersimpan ke `users/{uid}` di Firestore (project yang sama dengan Nugroho Store).
3. Minta custom token ke backend (`/api/issue-token`), lalu redirect ke Nugroho Store dengan `?authToken=...`.
4. Login berikutnya cukup lewat `login.html` (skip langsung ke langkah 3 kalau profil sudah lengkap).

## Firestore Rules & Indexes

File `firestore.rules`, `firestore.indexes.json`, dan `storage.rules` di sini **identik** dengan yang ada di project Nugroho Store — karena keduanya men-deploy ke **satu project Firebase yang sama** (`store-6d392`). Cukup deploy dari salah satu folder saja; kedua salinan disediakan supaya masing-masing repo tetap lengkap/self-contained.
