// =============================================================================
// auth-client.js — Admin Auth System
// =============================================================================

import { auth, db, AUTH_BRIDGE_API } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

export async function daftarAkun(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function masukAkun(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function profilSudahLengkap(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists();
}

/**
 * Minta backend (server/) menukar sesi login saat ini jadi "custom token"
 * yang bisa dipakai Nugroho Store untuk login otomatis di domain lain.
 * Backend memverifikasi idToken pakai Firebase Admin SDK sebelum menerbitkan
 * custom token baru — jadi tidak ada token yang dipercaya mentah-mentah.
 */
export async function mintaCustomTokenUntukStore() {
  const user = auth.currentUser;
  if (!user) throw new Error("Belum login");
  const idToken = await user.getIdToken();

  const res = await fetch(`${AUTH_BRIDGE_API}/api/issue-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) throw new Error("Gagal menukar token dari server auth bridge");
  const data = await res.json();
  return data.customToken;
}

/** Ambil URL redirect tujuan (default ke Nugroho Store) dari query string. */
export function ambilTujuanRedirect(defaultUrl) {
  const params = new URLSearchParams(window.location.search);
  return params.get("redirect") || defaultUrl;
}

export function pesanErrorFirebase(kode) {
  const peta = {
    "auth/email-already-in-use": "Email ini sudah terdaftar. Coba masuk saja.",
    "auth/invalid-email": "Format email tidak valid.",
    "auth/weak-password": "Password minimal 6 karakter.",
    "auth/invalid-credential": "Email atau password salah.",
    "auth/user-not-found": "Akun dengan email ini tidak ditemukan.",
    "auth/wrong-password": "Password salah.",
    "auth/too-many-requests": "Terlalu banyak percobaan. Coba lagi sebentar lagi.",
  };
  return peta[kode] || "Terjadi kesalahan. Coba lagi.";
}
