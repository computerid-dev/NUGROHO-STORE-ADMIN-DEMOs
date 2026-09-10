// =============================================================================
// server/index.js — Auth Bridge API
//
// Tugas satu-satunya server kecil ini: menukar ID token Firebase (hasil login
// di Admin Auth System) menjadi "custom token" yang bisa dipakai Nugroho Store
// untuk login otomatis di domain yang berbeda.
//
// Kenapa perlu server? Karena admin.auth().createCustomToken() HANYA bisa
// dipanggil oleh Firebase Admin SDK, yang butuh service account key (secret).
// Kunci itu tidak boleh pernah ada di kode frontend/browser.
//
// Alur:
//   1. Browser (Admin Auth System) login dengan email/password lewat Firebase
//      Client SDK, dapat ID token.
//   2. Browser kirim ID token ke endpoint POST /api/issue-token di server ini.
//   3. Server verifikasi ID token itu asli (admin.auth().verifyIdToken).
//   4. Kalau valid, server terbitkan custom token baru untuk uid yang sama.
//   5. Browser redirect ke Nugroho Store membawa custom token itu di URL.
//   6. Nugroho Store menukar custom token itu jadi sesi login asli di
//      domainnya sendiri lewat signInWithCustomToken().
// =============================================================================

import "dotenv/config";
import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import { readFileSync } from "fs";

const app = express();
app.use(express.json());

// CORS: hanya izinkan domain Admin Auth System yang boleh memanggil API ini.
const ORIGIN_DIIZINKAN = (process.env.ALLOWED_ORIGIN || "http://localhost:5500").split(",");
app.use(cors({ origin: ORIGIN_DIIZINKAN }));

// --- Inisialisasi Firebase Admin SDK ---
// PENTING: file service-account.json TIDAK BOLEH di-commit ke repo publik.
// Cukup taruh path-nya di environment variable GOOGLE_APPLICATION_CREDENTIALS,
// atau tempel isi JSON-nya ke env var FIREBASE_SERVICE_ACCOUNT (lihat .env.example).
let credential;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const serviceAccount = JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8"));
  credential = admin.credential.cert(serviceAccount);
} else {
  throw new Error(
    "Service account belum diset. Isi FIREBASE_SERVICE_ACCOUNT atau GOOGLE_APPLICATION_CREDENTIALS di .env"
  );
}

admin.initializeApp({ credential });

// Rate-limit sangat sederhana per IP (untuk produksi, ganti dengan middleware
// seperti express-rate-limit + Redis).
const percobaan = new Map();
function batasiPercobaan(req, res, next) {
  const ip = req.ip;
  const sekarang = Date.now();
  const riwayat = (percobaan.get(ip) || []).filter((t) => sekarang - t < 60_000);
  if (riwayat.length >= 20) {
    return res.status(429).json({ error: "Terlalu banyak percobaan, coba lagi sebentar." });
  }
  riwayat.push(sekarang);
  percobaan.set(ip, riwayat);
  next();
}

app.post("/api/issue-token", batasiPercobaan, async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ error: "idToken wajib dikirim" });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const customToken = await admin.auth().createCustomToken(decoded.uid);
    res.json({ customToken });
  } catch (err) {
    console.error("Gagal verifikasi/menerbitkan token:", err.message);
    res.status(401).json({ error: "Token tidak valid atau kedaluwarsa" });
  }
});

app.get("/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Auth Bridge API jalan di port ${PORT}`));
