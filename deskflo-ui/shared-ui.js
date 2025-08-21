// shared-ui.js

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://dnyjsrlrfuhmnzuhzrux.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRueWpzcmxyZnVobW56dWh6cnV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NDk0MjcsImV4cCI6MjA3MDIyNTQyN30.sK3BqfLMS36-N5lNuED3ehYZ6QbDgkdTpTngKPv20x8";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Fungsi ini mengambil data profil dari localStorage dan menampilkannya di top bar.
 */
export function populateTopbar() {
  const userProfileString = localStorage.getItem("userProfile");
  if (userProfileString) {
    try {
      const userProfile = JSON.parse(userProfileString);
      const topbarUserName = document.getElementById("topbar-user-name");
      const topbarUserRole = document.getElementById("topbar-user-role");
      const topbarUserAvatar = document.getElementById("topbar-user-avatar"); // Ambil elemen avatar

      if (topbarUserName) topbarUserName.textContent = userProfile.nama_lengkap || "Pengguna";
      if (topbarUserRole) topbarUserRole.textContent = userProfile.role || "Role";

      // --- PERUBAHAN UNTUK AVATAR ---
      if (topbarUserAvatar && userProfile.nama_lengkap) {
        const initial = userProfile.nama_lengkap.charAt(0).toUpperCase();
        topbarUserAvatar.src = `https://placehold.co/100x100/6366f1/ffffff?text=${initial}`;
      }
      // --- AKHIR PERUBAHAN ---
    } catch (error) {
      console.error("Gagal mem-parsing data profil dari localStorage:", error);
      localStorage.removeItem("userProfile");
    }
  }
}

/**
 * --- FUNGSI BARU ---
 * Fungsi ini mengambil jumlah pengajuan akun dan memperbarui notifikasi di sidebar.
 */
export async function updateApprovalNotification() {
  const approvalBadge = document.getElementById("approval-count-badge");
  if (!approvalBadge) return; // Keluar jika elemen tidak ada di halaman

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return; // Tidak melakukan apa-apa jika tidak login

    const response = await fetch(`${SUPABASE_URL}/functions/v1/requests`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (!response.ok) throw new Error("Gagal mengambil data pengajuan.");

    const requests = await response.json();
    const count = requests.length;

    if (count > 0) {
      approvalBadge.textContent = count;
      approvalBadge.classList.remove("hidden");
    } else {
      approvalBadge.classList.add("hidden");
    }
  } catch (error) {
    console.error("Gagal memperbarui notifikasi persetujuan:", error);
    approvalBadge.classList.add("hidden"); // Sembunyikan jika ada error
  }
}

/**
 * Fungsi untuk menangani proses logout.
 */
export async function handleLogout() {
  console.log("Logging out...");
  localStorage.removeItem("userProfile");
  await supabase.auth.signOut();
  window.location.href = "../authentication.html?status=logout_success";
}

// Jalankan fungsi-fungsi ini saat halaman selesai dimuat
document.addEventListener("DOMContentLoaded", () => {
  populateTopbar();
  updateApprovalNotification(); // Panggil fungsi notifikasi baru
});
