// shared-ui.js

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://dnyjsrlrfuhmnzuhzrux.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJITVI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRueWpzcmxyZnVobW56dWh6cnV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NDk0MjcsImV4cCI6MjA3MDIyNTQyN30.sK3BqfLMS36-N5lNuED3ehYZ6QbDgkdTpTngKPv20x8";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Fungsi ini mengambil data profil dari localStorage dan menampilkannya di top bar.
 * Panggil fungsi ini di setiap halaman yang memiliki top bar.
 */
export function populateTopbar() {
  // Ambil data profil yang tersimpan di localStorage
  const userProfileString = localStorage.getItem("userProfile");

  if (userProfileString) {
    try {
      const userProfile = JSON.parse(userProfileString);

      // Temukan elemen di top bar berdasarkan ID
      const topbarUserName = document.getElementById("topbar-user-name");
      const topbarUserRole = document.getElementById("topbar-user-role");
      const topbarUserAvatar = document.getElementById("topbar-user-avatar");

      // Perbarui elemen dengan data dari localStorage
      if (topbarUserName) {
        topbarUserName.textContent = userProfile.nama_lengkap || "Pengguna";
      }
      if (topbarUserRole) {
        topbarUserRole.textContent = userProfile.role || "Role"; // Asumsi ada field 'role'
      }
      if (topbarUserAvatar) {
        // Anda bisa menambahkan logika untuk avatar di sini jika ada
        // topbarUserAvatar.src = userProfile.avatar_url || 'default-avatar.png';
      }
    } catch (error) {
      console.error("Gagal mem-parsing data profil dari localStorage:", error);
      // Hapus data yang korup jika ada
      localStorage.removeItem("userProfile");
    }
  } else {
    console.warn("Data profil tidak ditemukan di localStorage. Pengguna mungkin perlu login ulang.");
  }
}

/**
 * Fungsi untuk menangani proses logout.
 * Menghapus session dari Supabase dan data dari localStorage.
 */
export async function handleLogout() {
  console.log("Logging out...");
  // Hapus data profil dari localStorage
  localStorage.removeItem("userProfile");

  // Logout dari Supabase
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error logging out:", error.message);
  }

  // Arahkan ke halaman login
  window.location.href = "../authentication.html?status=logout_success";
}

// Jalankan fungsi populateTopbar() saat halaman selesai dimuat
document.addEventListener("DOMContentLoaded", populateTopbar);
