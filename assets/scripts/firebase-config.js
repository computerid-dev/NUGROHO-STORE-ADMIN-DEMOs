// =============================================================================
// firebase-config.js — Admin Auth System
// Project Firebase SAMA dengan Nugroho Store (store-6d392), tapi ini adalah
// codebase yang benar-benar terpisah, di-deploy ke domain/subdomain sendiri
// (misal auth.nugroho.store).
// =============================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDNs7sx1rcgWorhwWP2YYiH7LFj5S_dZAk",
  authDomain: "store-6d392.firebaseapp.com",
  projectId: "store-6d392",
  storageBucket: "store-6d392.firebasestorage.app",
  messagingSenderId: "975874685807",
  appId: "1:975874685807:web:d1c674a94dfd4061fa469a",
  measurementId: "G-MCSLCTW4FV",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// URL backend yang tugasnya menukar login jadi "custom token" untuk dibawa
// balik ke Nugroho Store.
//
// - Kalau kamu deploy folder ini sebagai SATU project Vercel (frontend statis
//   + /api/issue-token.js jadi serverless function di domain yang sama),
//   biarkan ini string kosong "" — fetch otomatis pakai path relatif
//   "/api/issue-token" di domain yang sama, tanpa perlu urus CORS sama sekali.
// - Kalau kamu pakai backend Express terpisah (folder /server, di-deploy ke
//   Render/Railway/VPS/dst), isi dengan URL lengkapnya, misal:
//   "https://auth-api.nugroho.store"
export const AUTH_BRIDGE_API = "";

// URL default Nugroho Store, dipakai kalau tidak ada parameter ?redirect=
export const STORE_URL = "https://nugroho.store";
