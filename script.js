const { Client, Storage, ID } = Appwrite;
const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject("694afcf8003aa2b09216");
const storage = new Storage(client);
const BUCKET_ID = "694afd1800182ce31a42";

let currentTab = "file";
let filesToUpload = [];
let uploadedFileUrl = "";
let uploadedFileId = "";
const MAX_FILE_SIZE = 50 * 1024 * 1024;

let uploadCount = 0;
let uploadResetTime = Date.now() + 10 * 60 * 1000; // Reset setiap 10 menit
const MAX_UPLOADS_PER_MINUTE = 10;

let historyPage = 0;
const ITEMS_PER_PAGE = 5;
let allHistory = [];

let selectedFiles = new Set();

window.addEventListener("DOMContentLoaded", () => {
  loadHistory();
  loadDarkMode();
  initMobileOptimizations();
  requestNotificationPermission();
  initPasteFromClipboard();
  startExpiryTimers();
  initDragAndDrop();
});

// Initialize drag and drop
function initDragAndDrop() {
  const dropZone = document.getElementById("dropZone");
  if (!dropZone) return;
  
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(
      eventName,
      (e) => {
        e.preventDefault();
        e.stopPropagation();
      },
      false
    );
  });
  dropZone.addEventListener("dragover", () => dropZone.classList.add("dragover"));
  dropZone.addEventListener("dragleave", () =>
    dropZone.classList.remove("dragover")
  );
  dropZone.addEventListener("drop", (e) => {
    dropZone.classList.remove("dragover");
    processFiles(Array.from(e.dataTransfer.files));
  });
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.log("Browser tidak support notifikasi");
    return;
  }

  const banner = document.getElementById("notificationBanner");

  if (Notification.permission === "granted") {
    console.log("✅ Notifikasi sudah diizinkan");
    banner.style.display = "none";
    return;
  }

  if (Notification.permission === "denied") {
    banner.style.display = "block";
    document.getElementById("notificationInstructions").style.display = "block";
    return;
  }

  if (Notification.permission === "default") {
    setTimeout(() => {
      banner.style.display = "block";
    }, 3000);
  }
}

async function requestNotificationPermissionFromBanner() {
  if (!("Notification" in window)) {
    // alert('Browser Anda tidak mendukung notifikasi');
    showToast("Error", "Browser Anda tidak mendukung notifikasi", "error");
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    const banner = document.getElementById("notificationBanner");
    const instructions = document.getElementById("notificationInstructions");

    if (permission === "granted") {
      console.log("✅ Notifikasi diizinkan");
      banner.style.display = "none";

      showNotification("Cloud Storage siap! 🎉", {
        body: "Anda akan menerima notifikasi saat upload selesai",
        icon: "https://raw.githubusercontent.com/soraxpl/soraxpl.github.io/refs/heads/master/favicon.ico",
      });

      vibrate([200, 100, 200]);
    } else if (permission === "denied") {
      console.log("❌ Notifikasi ditolak");
      instructions.style.display = "block";
      // alert('❌ Notifikasi ditolak. Lihat instruksi di bawah untuk mengaktifkan secara manual.');
      showToast(
        "Error",
        "Notifikasi ditolak. Lihat instruksi di bawah untuk mengaktifkan secara manual.",
        "error"
      );
    } else {
      console.log("⚠️ Notifikasi diabaikan");
    }
  } catch (error) {
    console.error("Error requesting notification:", error);
    // alert('Gagal meminta izin notifikasi. Coba lagi nanti.');
    showToast(
      "Error",
      "Gagal meminta izin notifikasi. Coba lagi nanti.",
      "error"
    );
  }
}

function showNotification(title, options = {}) {
  if (Notification.permission === "granted") {
    try {
      const notification = new Notification(title, {
        icon: "https://raw.githubusercontent.com/soraxpl/soraxpl.github.io/refs/heads/master/favicon.ico",
        badge:
          "https://raw.githubusercontent.com/soraxpl/soraxpl.github.io/refs/heads/master/favicon.ico",
        vibrate: [200, 100, 200],
        ...options,
      });

      notification.onclick = function () {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error("Error showing notification:", error);
    }
  }
}

function initMobileOptimizations() {
  const inputs = document.querySelectorAll("input, textarea");
  inputs.forEach((input) => {
    input.addEventListener("focus", () => {
      if (window.innerWidth < 768) {
        document
          .querySelector('meta[name="viewport"]')
          .setAttribute(
            "content",
            "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
          );
      }
    });

    input.addEventListener("blur", () => {
      document
        .querySelector('meta[name="viewport"]')
        .setAttribute(
          "content",
          "width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover"
        );
    });
  });

  document.getElementById("btnUpload").addEventListener("click", () => {
    if (document.activeElement) {
      document.activeElement.blur();
    }
  });
}

function switchTab(tab) {
  currentTab = tab;
  document
    .querySelectorAll(".tab-btn")
    .forEach((btn) => btn.classList.remove("active"));
  document
    .querySelectorAll(".tab-content")
    .forEach((content) => content.classList.remove("active"));

  if (tab === "file") {
    document
      .querySelector("button[onclick=\"switchTab('file')\"]")
      .classList.add("active");
    document.getElementById("fileTab").classList.add("active");
  } else {
    document
      .querySelector("button[onclick=\"switchTab('url')\"]")
      .classList.add("active");
    document.getElementById("urlTab").classList.add("active");
  }
}

function handleFileSelect() {
  const fileInput = document.getElementById("uploader");
  processFiles(Array.from(fileInput.files));
}

function processFiles(files) {
  filesToUpload = files;
  const selectedFileDiv = document.getElementById("selectedFileName");
  const multipleInfo = document.getElementById("multipleInfo");
  const warning = document.getElementById("fileSizeWarning");

  if (files.length === 0) return;

  const oversized = files.filter((f) => f.size > MAX_FILE_SIZE);
  warning.style.display = oversized.length > 0 ? "block" : "none";

  selectedFileDiv.style.display = "block";
  if (files.length === 1) {
    selectedFileDiv.textContent = `📁 ${sanitizeText(files[0].name)}`;
    multipleInfo.style.display = "none";
  } else {
    selectedFileDiv.textContent = `📁 ${files.length} file dipilih`;
    multipleInfo.textContent = files
      .map((f) => sanitizeText(f.name))
      .join(", ");
    multipleInfo.style.display = "block";
  }
}

async function urlToFile(url) {
  try {
    const cleanInput = url.trim();

    let urlObj;
    try {
      urlObj = new URL(cleanInput);
    } catch (err) {
      throw new Error(
        "Format URL tidak valid (Contoh benar: https://google.com)"
      );
    }

    if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
      throw new Error("URL wajib menggunakan HTTP atau HTTPS");
    }

    const workerUrl = "https://my-cors-proxy.xnuvers.workers.dev";

    const proxyUrl = `${workerUrl}/?url=${encodeURIComponent(cleanInput)}`;

    const response = await fetch(proxyUrl);

    if (!response.ok) {
      throw new Error(`Gagal download (Status: ${response.status})`);
    }

    const blob = await response.blob();

    const cleanUrlPart = cleanInput.split("?")[0];
    const filename = sanitizeFilename(
      cleanUrlPart.split("/").pop() || "download-Xnuvers007.jpg"
    );

    return new File([blob], filename, { type: blob.type });
  } catch (e) {
    throw new Error(e.message);
  }
}

async function uploadFile() {
  const statusDiv = document.getElementById("status");
  const btn = document.getElementById("btnUpload");
  const btnText = document.getElementById("btnText");
  const progressBar = document.getElementById("progressBar");
  const previewContainer = document.getElementById("previewContainer");

  if (Date.now() > uploadResetTime) {
    uploadCount = 0;
    uploadResetTime = Date.now() + 10 * 60 * 1000;
  }

  if (uploadCount >= MAX_UPLOADS_PER_MINUTE) {
    statusDiv.innerHTML =
      '<span class="error-text">⚠️ Terlalu banyak upload! Tunggu 1 menit.</span>';
    return;
  }

  statusDiv.innerHTML = "";
  previewContainer.style.display = "none";
  progressBar.style.display = "block";
  document.querySelector(".progress-bar-fill").style.width = "0%";

  let finalFiles = [];
  if (currentTab === "file") {
    if (filesToUpload.length === 0) {
      statusDiv.innerHTML =
        '<span class="error-text">⚠️ Pilih file dulu!</span>';
      progressBar.style.display = "none";
      return;
    }
    finalFiles = filesToUpload;
  } else {
    const url = document.getElementById("imageUrl").value.trim();
    if (!url) {
      statusDiv.innerHTML = '<span class="error-text">⚠️ Masukkan URL!</span>';
      progressBar.style.display = "none";
      return;
    }
    if (!isValidURL(url)) {
      statusDiv.innerHTML =
        '<span class="error-text">⚠️ URL tidak valid! Gunakan HTTP/HTTPS.</span>';
      progressBar.style.display = "none";
      return;
    }
    try {
      btnText.innerText = "Mengunduh gambar...";
      const fileFromUrl = await urlToFile(url);
      finalFiles = [fileFromUrl];
    } catch (err) {
      statusDiv.innerHTML = `<span class="error-text">❌ ${sanitizeText(
        err.message
      )}</span>`;
      progressBar.style.display = "none";
      btnText.innerText = "Upload Sekarang";
      return;
    }
  }

  btn.disabled = true;
  let successCount = 0;
  let lastResult = null;

  try {
    for (let i = 0; i < finalFiles.length; i++) {
      const file = finalFiles[i];
      btnText.innerText = `Mengupload (${i + 1}/${finalFiles.length})...`;

      const response = await uploadWithRetry(file, 3);

      const resultUrl = storage.getFileView(BUCKET_ID, response.$id);

      lastResult = {
        name: sanitizeText(file.name),
        url: resultUrl,
        fileId: response.$id,
        date: new Date().toISOString(),
      };

      saveToHistory(lastResult);
      successCount++;
      uploadCount++;

      const percent = ((i + 1) / finalFiles.length) * 100;
      document.querySelector(".progress-bar-fill").style.width = `${percent}%`;
    }

    statusDiv.innerHTML = `<span class="success-text">✅ Berhasil mengupload ${successCount} file!</span>`;

    uploadedFileUrl = lastResult.url;
    uploadedFileId = lastResult.fileId;
    document.getElementById("uploadedImage").src = lastResult.url;
    const linkElem = document.getElementById("fileUrl");
    linkElem.href = lastResult.url;
    linkElem.textContent = lastResult.url;
    previewContainer.style.display = "block";
    loadHistory();

    showToast(
      "Upload Berhasil!",
      `${successCount} file berhasil diupload`,
      "success"
    );

    showNotification("Upload Berhasil! ✅", {
      body: `${successCount} file berhasil diupload`,
      icon: "https://raw.githubusercontent.com/soraxpl/soraxpl.github.io/refs/heads/master/favicon.ico",
    });
  } catch (error) {
    console.error(error);
    statusDiv.innerHTML = `<span class="error-text">❌ Error: ${sanitizeText(
      error.message
    )}</span>`;
    showToast("Upload Gagal", error.message, "error");
  } finally {
    btn.disabled = false;
    btnText.innerText = "Upload Sekarang";
    setTimeout(() => {
      progressBar.style.display = "none";
    }, 1000);
  }
}

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(uploadedFileUrl);
    const btn = document.querySelector(".copy-btn");
    const originalText = btn.innerText;
    btn.innerText = "✅ Tersalin!";
    setTimeout(() => (btn.innerText = originalText), 2000);
    showToast(
      "Tersalin!",
      "Link berhasil disalin ke clipboard",
      "success",
      2000
    );
  } catch (err) {
    showToast("Gagal", "Gagal menyalin link", "error");
  }
}

function toggleQRCode() {
  const container = document.getElementById("qrCodeContainer");
  if (container.style.display === "block") {
    container.style.display = "none";
  } else {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
      uploadedFileUrl
    )}`;
    document.getElementById("qrCodeImage").src = qrUrl;
    container.style.display = "block";
  }
}

function shareToWhatsApp() {
  window.open(
    `https://wa.me/?text=${encodeURIComponent(uploadedFileUrl)}`,
    "_blank"
  );
}
function shareToTelegram() {
  window.open(
    `https://t.me/share/url?url=${encodeURIComponent(uploadedFileUrl)}`,
    "_blank"
  );
}

function downloadFile() {
  if (!uploadedFileId) {
    // alert('Tidak ada file untuk didownload!');
    showToast("Error", "Tidak ada file untuk didownload!", "error");
    return;
  }

  try {
    const downloadUrl = storage.getFileDownload(BUCKET_ID, uploadedFileId);

    window.open(downloadUrl, "_blank");

    // Atau bisa juga menggunakan createElement untuk auto download:
    // const link = document.createElement('a');
    // link.href = downloadUrl;
    // link.download = ''; // Browser akan gunakan nama file asli
    // link.click();
  } catch (error) {
    console.error("Download error:", error);
    // alert('Gagal mendownload file!');
    showToast("Error", "Gagal mendownload file!", "error");
  }
}

function saveToHistory(item) {
  let history = JSON.parse(localStorage.getItem("uploadHistory") || "[]");
  history.unshift(item);
  if (history.length > 50) history.pop();
  localStorage.setItem("uploadHistory", JSON.stringify(history));
}

function loadHistory() {
  allHistory = JSON.parse(localStorage.getItem("uploadHistory") || "[]");
  historyPage = 0;
  selectedFiles.clear();
  renderHistory();
}

function clearHistory() {
  if (confirm("Hapus semua riwayat?")) {
    localStorage.removeItem("uploadHistory");
    allHistory = [];
    selectedFiles.clear();
    loadHistory();
    showToast("Riwayat Dihapus", "Semua riwayat berhasil dihapus", "success");
    loadHistory();
  }
}

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  localStorage.setItem("darkMode", isDark);
  updateDarkIcon(isDark);
}

function loadDarkMode() {
  const isDark = localStorage.getItem("darkMode") === "true";
  if (isDark) document.body.classList.add("dark-mode");
  updateDarkIcon(isDark);
}

function updateDarkIcon(isDark) {
  const icon = document.getElementById("darkModeIcon");
  if (isDark) {
    icon.innerHTML =
      '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
  } else {
    icon.innerHTML =
      '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
  }
}

function sanitizeText(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function sanitizeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 255);
}

function isValidURL(string) {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
}

function detectMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

function isTouchDevice() {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
}

function vibrate(pattern = 10) {
  if ("vibrate" in navigator && isTouchDevice()) {
    navigator.vibrate(pattern);
  }
}

const originalCopyToClipboard = window.copyToClipboard;
window.copyToClipboard = function () {
  if (typeof originalCopyToClipboard === "function") {
    originalCopyToClipboard();
    vibrate(10);
  } else {
    const url = document.getElementById("fileUrl").href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          // alert('✅ Link berhasil disalin!');
          showToast(
            "Tersalin!",
            "Link berhasil disalin ke clipboard",
            "success",
            2000
          );
          vibrate(10);
          if (typeof showToast === "function") {
            showToast(
              "Tersalin!",
              "Link berhasil disalin ke clipboard",
              "success",
              2000
            );
          }
        })
        .catch((err) => {
          console.error("Copy failed:", err);
          // alert('❌ Gagal menyalin. Izin clipboard ditolak.'+err);
          showToast("Gagal", "Gagal menyalin link", "error");
          if (typeof showToast === "function") {
            showToast("Gagal", "Gagal menyalin link", "error");
          }
        });
    } else if (document.execCommand) {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        // alert('✅ Link berhasil disalin!');
        showToast(
          "Tersalin!",
          "Link berhasil disalin ke clipboard",
          "success",
          2000
        );
        vibrate(10);
      } catch (err) {
        // alert('❌ Gagal menyalin link');
        showToast("Gagal", "Gagal menyalin link", "error");
      }
      document.body.removeChild(textArea);
    } else {
      prompt("Browser tidak support auto-copy. Silakan salin manual:", url);
    }
  }
};

function scrollToHistory() {
  const historySection = document.getElementById("historySection");
  if (historySection && historySection.style.display !== "none") {
    historySection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function scrollToPreview() {
  const previewArea = document.getElementById("previewContainer");
  if (previewArea && previewArea.style.display !== "none") {
    setTimeout(() => {
      previewArea.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  }
}

function optimizeImagePreview(img) {
  if (detectMobile() && img.naturalWidth > 800) {
    img.style.maxWidth = "100%";
    img.style.height = "auto";
    img.loading = "lazy";
  }
}

let lastOrientation = window.orientation || 0;
window.addEventListener("orientationchange", function () {
  const currentOrientation = window.orientation || 0;
  if (currentOrientation !== lastOrientation) {
    lastOrientation = currentOrientation;
    document.body.style.display = "none";
    document.body.offsetHeight;
    document.body.style.display = "";
  }
});

let lastTouchEnd = 0;
document.addEventListener(
  "touchend",
  function (event) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  },
  { passive: false }
);

window.addEventListener("online", () => {
  console.log("✅ Koneksi internet tersambung");
  showToast("Online", "Koneksi internet tersambung", "success");
});

window.addEventListener("offline", () => {
  console.log("⚠️ Tidak ada koneksi internet");
  showToast("Offline", "Tidak ada koneksi internet", "warning");
});

if (detectMobile()) {
  console.log("📱 Mobile Device Detected");
  console.log("Screen:", window.screen.width + "x" + window.screen.height);
  console.log("Viewport:", window.innerWidth + "x" + window.innerHeight);
  console.log("Touch:", isTouchDevice() ? "Yes" : "No");
}

function showToast(title, message, type = "info", duration = 4000) {
  const container = document.getElementById("toastContainer");

  const icons = {
    success: "✅",
    error: "❌",
    warning: "⚠️",
    info: "ℹ️",
  };

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
                <div class="toast-icon">${icons[type] || icons.info}</div>
                <div class="toast-content">
                    <div class="toast-title">${sanitizeText(title)}</div>
                    <div class="toast-message">${sanitizeText(message)}</div>
                </div>
                <button class="toast-close" onclick="this.parentElement.remove()">×</button>
            `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("hiding");
    setTimeout(() => toast.remove(), 300);
  }, duration);

  vibrate(10);
}

function initPasteFromClipboard() {
  document.addEventListener("paste", async (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
      return;
    }

    const items = e.clipboardData?.items;
    if (!items) return;

    const files = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          const ext = blob.type.split("/")[1] || "png";
          const file = new File([blob], `screenshot-${timestamp}.${ext}`, {
            type: blob.type,
          });
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      switchTab("file");

      filesToUpload = files;
      processFiles(files);

      showToast(
        "Clipboard",
        `${files.length} gambar dari clipboard siap diupload`,
        "success"
      );
      vibrate([100, 50, 100]);
    }
  });

  console.log("📋 Paste from clipboard enabled (Ctrl+V)");
}

function calculateTimeRemaining(uploadDate) {
  const uploaded = new Date(uploadDate);
  const expiry = new Date(uploaded.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 hari
  const now = new Date();
  const diff = expiry - now;

  if (diff <= 0) {
    return "Expired";
  }

  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

  if (days > 0) {
    return `⏱️ ${days}h ${hours}j lagi`;
  } else if (hours > 0) {
    return `⏱️ ${hours}j ${minutes}m lagi`;
  } else {
    return `⏱️ ${minutes}m lagi`;
  }
}

function startExpiryTimers() {
  setInterval(() => {
    const timerElements = document.querySelectorAll(".expiry-timer");
    timerElements.forEach((elem) => {
      const uploadDate = elem.getAttribute("data-date");
      if (uploadDate) {
        elem.textContent = calculateTimeRemaining(uploadDate);
      }
    });
  }, 60000);
}

async function uploadWithRetry(file, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `📤 Upload attempt ${attempt}/${maxRetries} for ${file.name}`
      );

      const sanitizedFile = new File([file], sanitizeFilename(file.name), {
        type: file.type,
      });
      const response = await storage.createFile(
        BUCKET_ID,
        ID.unique(),
        sanitizedFile
      );

      console.log(`✅ Upload success on attempt ${attempt}`);
      showToast(
        "Upload Sukses",
        `File "${sanitizeText(file.name)}" berhasil diupload`,
        "success",
        2500
      );
      return response;
    } catch (error) {
      lastError = error;
      console.warn(`❌ Upload attempt ${attempt} failed:`, error.message);

      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`⏳ Retrying in ${delay}ms...`);

        showToast(
          "Retry",
          `Mencoba ulang (${attempt}/${maxRetries})...`,
          "warning",
          2000
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

function loadMoreHistory() {
  historyPage++;
  renderHistory();
}

function renderHistory() {
  const list = document.getElementById("historyList");
  const section = document.getElementById("historySection");
  const loadMoreBtn = document.getElementById("loadMoreHistory");
  const batchControls = document.getElementById("batchControls");

  if (allHistory.length === 0) {
    section.style.display = "none";
    return;
  }

  section.style.display = "block";
  batchControls.style.display = "flex";

  const startIdx = 0;
  const endIdx = (historyPage + 1) * ITEMS_PER_PAGE;
  const itemsToShow = allHistory.slice(startIdx, endIdx);

  list.innerHTML = itemsToShow
    .map((item, idx) => {
      const safeName = sanitizeText(item.name);
      const safeDate = sanitizeText(new Date(item.date).toLocaleString());
      const timeRemaining = calculateTimeRemaining(item.date);
      const isSelected = selectedFiles.has(idx);

      return `
                <div class="history-item">
                    <input type="checkbox" class="history-item-checkbox" 
                           onchange="toggleFileSelection(${idx})" 
                           ${isSelected ? "checked" : ""}
                           id="checkbox-${idx}">
                    <div class="history-item-info">
                        <div><b>${safeName.substring(0, 20)}${
        safeName.length > 20 ? "..." : ""
      }</b></div>
                        <div class="history-item-date">${safeDate}</div>
                        <div class="expiry-timer" data-date="${
                          item.date
                        }">${timeRemaining}</div>
                    </div>
                    <div style="display: flex; gap: 5px;">
                        <a href="${
                          item.url
                        }" target="_blank" rel="noopener noreferrer" class="history-item-link">Lihat</a>
                        ${
                          item.fileId
                            ? `<a href="${storage.getFileDownload(
                                BUCKET_ID,
                                item.fileId
                              )}" target="_blank" rel="noopener noreferrer" class="history-item-link" style="background: #10b981;">⬇️</a>`
                            : ""
                        }
                    </div>
                </div>
            `;
    })
    .join("");

  if (endIdx < allHistory.length) {
    loadMoreBtn.style.display = "block";
  } else {
    loadMoreBtn.style.display = "none";
  }
}

function toggleFileSelection(index) {
  if (selectedFiles.has(index)) {
    selectedFiles.delete(index);
  } else {
    selectedFiles.add(index);
  }
  updateBatchDownloadButton();
}

function toggleSelectAll() {
  const checkboxes = document.querySelectorAll(".history-item-checkbox");
  const allChecked = Array.from(checkboxes).every((cb) => cb.checked);

  if (allChecked) {
    selectedFiles.clear();
    checkboxes.forEach((cb) => (cb.checked = false));
  } else {
    checkboxes.forEach((cb, idx) => {
      cb.checked = true;
      selectedFiles.add(idx);
    });
  }

  updateBatchDownloadButton();
}

function updateBatchDownloadButton() {
  const btn = document.getElementById("batchDownloadBtn");
  const selectBtn = document.getElementById("selectAllBtn");

  if (selectedFiles.size > 0) {
    btn.textContent = `📦 Download ${selectedFiles.size} File (ZIP)`;
    btn.disabled = false;
    selectBtn.textContent = "❌ Batal Pilih";
  } else {
    btn.textContent = "📦 Download ZIP";
    btn.disabled = true;
    selectBtn.textContent = "☑️ Pilih Semua";
  }
}

async function batchDownload() {
  if (selectedFiles.size === 0) {
    showToast("Error", "Pilih file terlebih dahulu", "warning");
    return;
  }

  if (!window.JSZip) {
    showToast("Error", "JSZip library not loaded", "error");
    return;
  }

  showToast("Download", `Memproses ${selectedFiles.size} file...`, "info");

  try {
    const zip = new JSZip();
    let completed = 0;

    for (const idx of selectedFiles) {
      const item = allHistory[idx];
      if (!item.fileId) continue;

      try {
        const downloadUrl = storage.getFileDownload(BUCKET_ID, item.fileId);
        const response = await fetch(downloadUrl);
        const blob = await response.blob();

        zip.file(sanitizeFilename(item.name), blob);
        completed++;

        console.log(
          `✅ Added to ZIP: ${item.name} (${completed}/${selectedFiles.size})`
        );
      } catch (err) {
        console.error(`❌ Failed to download: ${item.name}`, err);
      }
    }

    if (completed === 0) {
      showToast("Error", "Gagal mendownload file", "error");
      return;
    }

    showToast("Generating ZIP", "Membuat file ZIP...", "info");

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    // a.download = `cloud-storage-${Date.now()}.zip`;
    // waktu berdasarkan browser user agar sesuai zona waktu
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    a.download = `${year}${month}${day}-${hours}${minutes}-cloud-storage-Xnuvers007.zip`;
    a.click();

    URL.revokeObjectURL(url);

    showToast("Success", `${completed} file berhasil didownload!`, "success");
    vibrate([200, 100, 200]);

    selectedFiles.clear();
    renderHistory();
  } catch (error) {
    console.error("Batch download error:", error);
    showToast("Error", "Gagal membuat ZIP: " + error.message, "error");
  }
}
