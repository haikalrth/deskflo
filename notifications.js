// notifications.js

// CSS disuntikkan langsung agar tidak perlu mengubah setiap file HTML
const styles = `
.toast-notification {
    position: fixed;
    bottom: 1.25rem;
    right: 1.25rem;
    padding: 1rem 1.5rem;
    border-radius: 0.5rem;
    color: white;
    font-family: "Inter", sans-serif;
    display: flex;
    align-items: center;
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    
    /* PERBAIKAN ANIMASI DI SINI */
    opacity: 0;
    transform: translateY(50px); /* Posisi awal: di bawah dan transparan */
    transition: all 0.5s ease-in-out;
    z-index: 1000;
}
.toast-notification.show {
    opacity: 1;
    transform: translateY(0); /* Posisi akhir: kembali ke posisi normal dan terlihat */
}
/* AKHIR PERBAIKAN ANIMASI */

.toast-notification.success {
    background-color: #10B981; /* bg-emerald-500 */
}
.toast-notification.error {
    background-color: #EF4444; /* bg-rose-500 */
}
.toast-icon {
    width: 1.5rem;
    height: 1.5rem;
    margin-right: 0.75rem;
}
`;

// Fungsi untuk menyuntikkan style ke dalam <head>
function injectStyles() {
  if (document.getElementById("toast-styles")) return;
  const styleSheet = document.createElement("style");
  styleSheet.id = "toast-styles";
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

// Panggil fungsi inject style sekali
injectStyles();

let currentToast = null;

// Fungsi utama untuk menampilkan notifikasi
export function showNotification(message, type = "success", duration = 4000) {
  // Hapus notifikasi sebelumnya jika ada
  if (currentToast) {
    currentToast.remove();
  }

  const toast = document.createElement("div");
  toast.className = `toast-notification ${type}`;

  const iconSvg =
    type === "success"
      ? `<svg xmlns="http://www.w3.org/2000/svg" class="toast-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" class="toast-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;

  toast.innerHTML = `${iconSvg}<span>${message}</span>`;

  document.body.appendChild(toast);
  currentToast = toast;

  // Tampilkan notifikasi
  setTimeout(() => {
    toast.classList.add("show");
  }, 100); // delay kecil untuk memastikan transisi berjalan

  // Sembunyikan dan hapus notifikasi setelah durasi tertentu
  setTimeout(() => {
    toast.classList.remove("show");
    toast.addEventListener("transitionend", () => {
      toast.remove();
      if (currentToast === toast) {
        currentToast = null;
      }
    });
  }, duration);
}
