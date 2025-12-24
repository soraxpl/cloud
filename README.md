<div align="center">

# ☁️ Cloud Storage by Xnuvers007

### 🚀 Upload & Share Files dengan Mudah, Cepat, dan Aman

[![GitHub](https://img.shields.io/badge/GitHub-Xnuvers007-181717?style=for-the-badge&logo=github)](https://github.com/Xnuvers007)
[![Live Demo](https://img.shields.io/badge/Live-Demo-667eea?style=for-the-badge&logo=vercel)](https://soraxpl.github.io/cloud/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](https://github.com/soraxpl/cloud/pulls)

<p align="center">
  <img src="https://raw.githubusercontent.com/soraxpl/soraxpl.github.io/refs/heads/master/favicon.ico" alt="Cloud Storage Logo" width="120"/>
</p>

**Progressive Web App (PWA)** dengan fitur offline, installable, dan responsive untuk semua device!

[🌐 Live Demo](https://soraxpl.github.io/cloud/) • [📖 Documentation](#-fitur-utama) • [🐛 Report Bug](https://github.com/soraxpl/cloud/issues) • [✨ Request Feature](https://github.com/soraxpl/cloud/issues)

</div>

---

## 📋 Daftar Isi

- [✨ Fitur Utama](#-fitur-utama)
- [🎯 Demo](#-demo)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Quick Start](#-quick-start)
- [📱 PWA Installation](#-pwa-installation)
- [🎨 Screenshots](#-screenshots)
- [⚙️ Konfigurasi](#️-konfigurasi)
- [🔒 Security](#-security)
- [📊 Browser Support](#-browser-support)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [👨‍💻 Author](#-author)
- [🙏 Acknowledgments](#-acknowledgments)
- [📞 Support](#-support)
- [✨ Our Contributors](#Contributors)
- [⭐ Star This Repository](#-star-this-repository)
---

## ✨ Fitur Utama

### 🎯 Core Features
- 📤 **Multiple File Upload** - Upload hingga 10 file sekaligus (max 50MB per file)
- 🔗 **URL Upload** - Upload file langsung dari URL eksternal dengan CORS proxy
- 🌓 **Dark Mode** - Toggle dark/light mode dengan smooth transition
- 📜 **Upload History** - Simpan dan akses riwayat upload terakhir (max 10 items)
- 📱 **QR Code Generator** - Generate QR code untuk sharing file dengan mudah
- 💬 **Social Sharing** - Share ke WhatsApp dan Telegram dengan satu klik

### 🚀 Progressive Web App (PWA)
- ⚡ **Offline Support** - Tetap bisa diakses tanpa internet connection
- 📲 **Installable** - Install sebagai aplikasi native di device Anda
- 🔄 **Auto Update** - Service worker dengan auto-update detection
- 🔔 **Push Notifications** - Notifikasi saat upload berhasil
- 📱 **Responsive Design** - Optimized untuk mobile, tablet, dan desktop

### 🎨 User Experience
- 🖱️ **Drag & Drop** - Upload file dengan drag and drop
- ⌨️ **Keyboard Shortcuts** - Navigasi cepat dengan keyboard
- 📳 **Haptic Feedback** - Vibration feedback untuk touch interaction (mobile)
- 🎭 **Smooth Animations** - GPU-accelerated animations untuk performa maksimal
- 🌈 **Beautiful UI** - Modern gradient design dengan glassmorphism effect

### 🔒 Security & Performance
- 🛡️ **Content Security Policy** - Proteksi dari XSS dan injection attacks
- 🔐 **Secure Upload** - File disimpan di Appwrite cloud dengan enkripsi
- ⚡ **Rate Limiting** - Max 10 uploads per 10 menit untuk prevent abuse
- 🗑️ **Auto Deletion** - File otomatis terhapus setelah 5 hari
- 📊 **File Validation** - Validasi ukuran dan format file sebelum upload

---

## 🎯 Demo

🌐 **Live Demo:** [https://soraxpl.github.io/cloud/](https://soraxpl.github.io/cloud/)

### Quick Try:
1. Buka link demo di atas
2. Klik atau drag & drop file untuk upload
3. Dapatkan link untuk sharing
4. Download, copy link, atau share via social media!

---

## 🛠️ Tech Stack

<div align="center">

| Technology | Purpose | Version |
|------------|---------|---------|
| ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white) | Structure | 5 |
| ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white) | Styling | 3 |
| ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black) | Logic | ES6+ |
| ![Appwrite](https://img.shields.io/badge/Appwrite-F02E65?style=flat&logo=appwrite&logoColor=white) | Backend | 21.5.0 |
| ![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=flat&logo=pwa&logoColor=white) | Progressive Web App | - |
| ![Service Worker](https://img.shields.io/badge/Service_Worker-4285F4?style=flat&logo=google-chrome&logoColor=white) | Offline Support | - |

</div>

### 📦 Dependencies
- **[Appwrite SDK](https://appwrite.io/)** v21.5.0 - Backend as a Service untuk storage
- **[QR Server API](https://goqr.me/api/)** - Generate QR codes
- **Service Worker API** - PWA offline functionality
- **Notification API** - Push notifications
- **Vibration API** - Haptic feedback

---

## 🚀 Quick Start

### Prerequisites
- Web browser modern (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Internet connection untuk upload file
- (Optional) Git untuk clone repository

### Installation

#### 1️⃣ Clone Repository
```bash
git clone https://github.com/soraxpl/cloud.git
cd cloud
```

#### 2️⃣ Local Development
```bash
# Menggunakan Python Simple HTTP Server
python -m http.server 5000

# Atau menggunakan PHP
php -S localhost:5000

# Atau menggunakan Node.js http-server
npx http-server -p 5000
```

#### 3️⃣ Open Browser
```
http://localhost:5000
```

### 🔧 Konfigurasi Appwrite (Optional)

Jika ingin menggunakan Appwrite instance sendiri:

1. Buat project di [Appwrite Cloud](https://cloud.appwrite.io/)
2. Buat storage bucket dengan permissions public
3. Update konfigurasi di `script.js`:

```javascript
const client = new Client()
    .setEndpoint('YOUR_APPWRITE_ENDPOINT')
    .setProject('YOUR_PROJECT_ID');

const BUCKET_ID = 'YOUR_BUCKET_ID';
```

---

## 📱 PWA Installation

### 📱 Android (Chrome/Edge)
1. Buka website di Chrome atau Edge
2. Tap menu **⋮** di pojok kanan atas
3. Pilih **"Add to Home screen"** atau **"Install app"**
4. Konfirmasi dengan tap **"Install"**

### 🍎 iOS (Safari)
1. Buka website di Safari
2. Tap tombol **Share** (⬆️) di toolbar bawah
3. Scroll dan tap **"Add to Home Screen"**
4. Tap **"Add"** di pojok kanan atas

### 💻 Desktop (Chrome/Edge/Brave)
1. Buka website di browser
2. Klik icon **Install** (➕) di address bar
3. Atau klik menu **⋮** → **"Install Cloud Storage"**
4. Konfirmasi instalasi

### ✨ Benefits Setelah Install:
- ⚡ Akses lebih cepat (tanpa browser UI)
- 📱 Icon di home screen seperti app native
- 🔔 Push notifications
- 💾 Offline mode dengan cache
- 🎨 Full screen experience

---

## 🎨 Screenshots

<div align="center">

### 🖥️ Desktop View
*Coming soon - Add your screenshots here*

### 📱 Mobile View
*Coming soon - Add your screenshots here*

### 🌓 Dark Mode
*Coming soon - Add your screenshots here*

</div>

---

## ⚙️ Konfigurasi

### Environment Variables

Tidak ada environment variables yang diperlukan karena menggunakan Appwrite Cloud public endpoint.

### Service Worker Cache Strategy

File yang di-cache untuk offline mode:
- `index.html` - Main page
- `style.css` - Stylesheet
- `script.js` - JavaScript logic
- `manifest.json` - PWA manifest
- `offline.html` - Offline fallback page

Cache version: `cloud-storage-v1`

### Rate Limiting

- **Max uploads:** 10 uploads per 10 menit
- **Max file size:** 50MB per file
- **File retention:** 5 hari (auto-delete oleh Appwrite)
- **History limit:** 10 items terakhir

---

## 🔒 Security

### Implemented Security Measures:

✅ **Content Security Policy (CSP)**
- Mencegah XSS attacks
- Membatasi sumber script dan style
- Block inline scripts kecuali yang di-whitelist

✅ **Input Sanitization**
- Sanitize semua user input
- Validate URL format
- Clean filename dari karakter berbahaya

✅ **Secure Upload**
- File size validation
- CORS proxy untuk URL upload
- Appwrite built-in security

✅ **HTTPS Only**
- GitHub Pages menggunakan HTTPS
- Service worker requires HTTPS

✅ **Privacy**
- Tidak ada tracking
- Tidak ada cookies untuk analytics
- Local storage hanya untuk history & preferences

---

## 📊 Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Fully Supported |
| Firefox | 88+ | ✅ Fully Supported |
| Safari | 14+ | ✅ Fully Supported |
| Edge | 90+ | ✅ Fully Supported |
| Opera | 76+ | ✅ Fully Supported |
| Samsung Internet | 14+ | ✅ Fully Supported |

### PWA Features Support:
- ✅ Service Worker: All modern browsers
- ✅ Web App Manifest: All modern browsers
- ✅ Notifications: Chrome, Firefox, Edge, Opera
- ⚠️ Notifications: Safari (limited support)
- ✅ Add to Home Screen: All mobile browsers

---

## 🤝 Contributing

Contributions are welcome! Ikuti langkah berikut:

### 1️⃣ Fork Repository
```bash
# Klik tombol Fork di GitHub atau klik link berikut:

https://github.com/soraxpl/cloud/fork
```

### 2️⃣ Clone Fork Anda
```bash
git clone https://github.com/soraxpl/cloud.git
cd cloud
```

### 3️⃣ Buat Branch Baru
```bash
git checkout -b feature/amazing-feature
```

### 4️⃣ Commit Changes
```bash
git add .
git commit -m "Add: amazing feature"
```

### 5️⃣ Push ke GitHub
```bash
git push origin feature/amazing-feature
```

### 6️⃣ Buat Pull Request
- Buka repository di GitHub
- Klik **"New Pull Request"**
- Pilih branch Anda dan submit

### 📝 Contribution Guidelines:
- Follow existing code style
- Add comments untuk kode kompleks
- Test di multiple browsers sebelum PR
- Update documentation jika diperlukan

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Xnuvers007 / Soraxpl

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

---

## 👨‍💻 Author

<div align="center">

### Xnuvers007

[![GitHub](https://img.shields.io/badge/GitHub-Xnuvers007-181717?style=for-the-badge&logo=github)](https://github.com/Xnuvers007)
[![Website](https://img.shields.io/badge/Website-xnuvers007-667eea?style=for-the-badge&logo=google-chrome)](https://soraxpl.github.io/)

**Made with ❤️ by Xnuvers007**

</div>

---

## 🙏 Acknowledgments

- [Appwrite](https://appwrite.io/) - Backend as a Service
- [QR Server](https://goqr.me/api/) - QR Code API
- [GitHub Pages](https://pages.github.com/) - Free hosting
- All contributors and users!

---

## 📞 Support

Jika ada pertanyaan atau masalah:

- 🐛 [Report Bugs](https://github.com/soraxpl/cloud/issues)
- 💡 [Request Features](https://github.com/soraxpl/cloud/issues)
- 📧 Contact: [Email](mailto:xnuversh1kar4@gmail.com)
- 💬 Discussions: [Discussions](https://github.com/soraxpl/cloud/issues)

---
## Contributors

<h3 align="center">✨ Our Contributors</h3>

<table>
  <tr>
    <td align="center" width="150px">
      <a href="https://github.com/soraxpl">
        <img src="https://avatars.githubusercontent.com/u/62522733?v=4" width="80px" style="border-radius: 50%;" alt="Xnuvers007"/>
        <br />
        <sub><b>Xnuvers007</b></sub>
      </a>
      <br />
      <sub>💻 <i>Lead Dev</i></sub>
    </td>
    <td align="center" width="150px">
      <a href="https://github.com/apps/github-actions">
        <img src="https://avatars.githubusercontent.com/in/15368?s=200&v=4" width="80px" style="border-radius: 50%;" alt="Bot"/>
        <br />
        <sub><b>GitHub Bot</b></sub>
      </a>
      <br />
      <sub>🤖 <i>Automation</i></sub>
    </td>
    <td align="center" width="150px">
      <a href="https://github.com/soraxpl">
        <img src="https://avatars.githubusercontent.com/u/583231?v=4" width="80px" style="border-radius: 50%;" alt="Soraxpl"/>
        <br />
        <sub><b>Soraxpl</b></sub>
      </a>
      <br />
      <sub>💻 <i>Co-Lead</i></sub>
    </td>
  </tr>
</table>

---

<div align="center">

### ⭐ Star This Repository


<script async defer src="https://buttons.github.io/buttons.js"></script>

<a class="github-button" 
   href="https://github.com/soraxpl/cloud" 
   data-color-scheme="no-preference: light; light: light; dark: dark;" 
   data-icon="octicon-star" 
   data-size="large" 
   data-show-count="true" 
   aria-label="Star soraxpl/cloud on GitHub" style="align-items: center; justify-content: center; display: inline-flex; space-between: 8px; padding: 8px 12px; font-size: 16px; font-weight: 600; color: #24292e; background-color: #eff3f6; border: 1px solid rgba(27,31,35,.15); border-radius: 6px; text-decoration: none;">
   Star
</a>

Jika project ini bermanfaat, berikan **⭐ star** untuk support development!

**Happy Uploading! 🚀☁️**

</div>
