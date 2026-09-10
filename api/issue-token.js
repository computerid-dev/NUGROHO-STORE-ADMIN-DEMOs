// =============================================================================
// api/issue-token.js — Vercel Serverless Function
//
// Ini pengganti server/index.js (Express) khusus untuk deploy di Vercel.
// Ditaruh di folder /api, Vercel otomatis mengenalinya sebagai endpoint:
//   POST https://<domain-vercel-kamu>/api/issue-token
//
// Karena file ini di-deploy SATU PROJECT bareng frontend (login.html, dkk),
// tidak perlu server terpisah lagi, dan tidak perlu urus CORS karena
// frontend & API-nya otomatis satu origin/domain yang sama.
// =============================================================================

import admin from "firebase-admin";

// Vercel serverless function bisa "dingin" (cold start) tiap saat, jadi kita
// pastikan Firebase Admin cuma di-inisialisasi SEKALI per instance function
// (bukan di tiap request), supaya lebih cepat & tidak error "app already exists".
function pastikanFirebaseAdminSiap() {
  if (admin.apps.length > 0) return;

  const jsonMentah = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!jsonMentah) {
    throw new Error(
      "Environment variable FIREBASE_SERVICE_ACCOUNT belum diset di Vercel Project Settings."
    );
  }

  const serviceAccount = JSON.parse(jsonMentah);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

// Rate-limit sangat sederhana per instance (cukup untuk testing; untuk
// production sungguhan pertimbangkan Vercel KV / Upstash Redis).
const percobaan = new Map();
function kelewatBatas(ip) {
  const sekarang = Date.now();
  const riwayat = (percobaan.get(ip) || []).filter((t) => sekarang - t < 60_000);
  riwayat.push(sekarang);
  percobaan.set(ip, riwayat);
  return riwayat.length > 20;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method tidak diizinkan, pakai POST." });
    return;
  }

  const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
  if (kelewatBatas(ip)) {
    res.status(429).json({ error: "Terlalu banyak percobaan, coba lagi sebentar." });
    return;
  }

  const { idToken } = req.body || {};
  if (!idToken) {
    res.status(400).json({ error: "idToken wajib dikirim" });
    return;
  }

  try {
    pastikanFirebaseAdminSiap();
    const decoded = await admin.auth().verifyIdToken(idToken);
    const customToken = await admin.auth().createCustomToken(decoded.uid);
    res.status(200).json({ customToken });
  } catch (err) {
    console.error("Gagal verifikasi/menerbitkan token:", err.message);
    res.status(401).json({ error: "Token tidak valid atau kedaluwarsa" });
  }
}
