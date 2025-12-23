        const { Client, Storage, ID } = Appwrite;
        const client = new Client()
            .setEndpoint('https://cloud.appwrite.io/v1')
            .setProject('694afcf8003aa2b09216');
        const storage = new Storage(client);
        const BUCKET_ID = '694afd1800182ce31a42';

        let currentTab = 'file';
        let filesToUpload = [];
        let uploadedFileUrl = '';
        let uploadedFileId = '';
        const MAX_FILE_SIZE = 50 * 1024 * 1024;

        window.addEventListener('DOMContentLoaded', () => {
            loadHistory();
            loadDarkMode();
        });

        function switchTab(tab) {
            currentTab = tab;
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            if(tab === 'file') {
                document.querySelector('button[onclick="switchTab(\'file\')"]').classList.add('active');
                document.getElementById('fileTab').classList.add('active');
            } else {
                document.querySelector('button[onclick="switchTab(\'url\')"]').classList.add('active');
                document.getElementById('urlTab').classList.add('active');
            }
        }

        function handleFileSelect() {
            const fileInput = document.getElementById('uploader');
            processFiles(Array.from(fileInput.files));
        }

        const dropZone = document.getElementById('dropZone');
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault(); e.stopPropagation();
            }, false);
        });
        dropZone.addEventListener('dragover', () => dropZone.classList.add('dragover'));
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
        dropZone.addEventListener('drop', (e) => {
            dropZone.classList.remove('dragover');
            processFiles(Array.from(e.dataTransfer.files));
        });

        function processFiles(files) {
            filesToUpload = files;
            const selectedFileDiv = document.getElementById('selectedFileName');
            const multipleInfo = document.getElementById('multipleInfo');
            const warning = document.getElementById('fileSizeWarning');

            if (files.length === 0) return;

            const oversized = files.filter(f => f.size > MAX_FILE_SIZE);
            warning.style.display = oversized.length > 0 ? 'block' : 'none';

            selectedFileDiv.style.display = 'block';
            if (files.length === 1) {
                selectedFileDiv.textContent = `📁 ${files[0].name}`;
                multipleInfo.style.display = 'none';
            } else {
                selectedFileDiv.textContent = `📁 ${files.length} file dipilih`;
                multipleInfo.textContent = files.map(f => f.name).join(', ');
                multipleInfo.style.display = 'block';
            }
        }

        async function urlToFile(url) {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                const filename = url.split('/').pop().split('?')[0] || 'image.jpg';
                return new File([blob], filename, { type: blob.type });
            } catch (e) {
                throw new Error("Gagal mengambil gambar. Pastikan URL valid dan bisa diakses publik (CORS).");
            }
        }

        async function uploadFile() {
            const statusDiv = document.getElementById('status');
            const btn = document.getElementById('btnUpload');
            const btnText = document.getElementById('btnText');
            const progressBar = document.getElementById('progressBar');
            const previewContainer = document.getElementById('previewContainer');

            statusDiv.innerHTML = "";
            previewContainer.style.display = 'none';
            progressBar.style.display = 'block';
            document.querySelector('.progress-bar-fill').style.width = '0%';

            let finalFiles = [];
            if (currentTab === 'file') {
                if (filesToUpload.length === 0) {
                    statusDiv.innerHTML = '<span class="error-text">⚠️ Pilih file dulu!</span>';
                    progressBar.style.display = 'none';
                    return;
                }
                finalFiles = filesToUpload;
            } else {
                const url = document.getElementById('imageUrl').value.trim();
                if (!url) {
                    statusDiv.innerHTML = '<span class="error-text">⚠️ Masukkan URL!</span>';
                    progressBar.style.display = 'none';
                    return;
                }
                try {
                    btnText.innerText = "Mengunduh gambar...";
                    const fileFromUrl = await urlToFile(url);
                    finalFiles = [fileFromUrl];
                } catch (err) {
                    statusDiv.innerHTML = `<span class="error-text">❌ ${err.message}</span>`;
                    progressBar.style.display = 'none';
                    return;
                }
            }

            btn.disabled = true;
            let successCount = 0;
            let lastResult = null;

            try {
                for (let i = 0; i < finalFiles.length; i++) {
                    const file = finalFiles[i];
                    btnText.innerText = `Mengupload (${i+1}/${finalFiles.length})...`;
                    
                    const response = await storage.createFile(BUCKET_ID, ID.unique(), file);
                    
                    const resultUrl = storage.getFileView(BUCKET_ID, response.$id);
                    
                    lastResult = {
                        name: file.name,
                        url: resultUrl,
                        fileId: response.$id,
                        date: new Date().toISOString()
                    };
                    
                    saveToHistory(lastResult);
                    successCount++;
                    
                    const percent = ((i + 1) / finalFiles.length) * 100;
                    document.querySelector('.progress-bar-fill').style.width = `${percent}%`;
                }

                statusDiv.innerHTML = `<span class="success-text">✅ Berhasil mengupload ${successCount} file!</span>`;
                
                uploadedFileUrl = lastResult.url;
                uploadedFileId = lastResult.fileId;
                document.getElementById('uploadedImage').src = lastResult.url;
                const linkElem = document.getElementById('fileUrl');
                linkElem.href = lastResult.url;
                linkElem.textContent = lastResult.url;
                previewContainer.style.display = 'block';
                loadHistory();

            } catch (error) {
                console.error(error);
                statusDiv.innerHTML = `<span class="error-text">❌ Error: ${error.message}</span>`;
            } finally {
                btn.disabled = false;
                btnText.innerText = "Upload Sekarang";
                setTimeout(() => { progressBar.style.display = 'none'; }, 1000);
            }
        }

        async function copyToClipboard() {
            try {
                await navigator.clipboard.writeText(uploadedFileUrl);
                const btn = document.querySelector('.copy-btn');
                const originalText = btn.innerText;
                btn.innerText = "✅ Tersalin!";
                setTimeout(() => btn.innerText = originalText, 2000);
            } catch (err) { alert('Gagal menyalin'); }
        }

        function toggleQRCode() {
            const container = document.getElementById('qrCodeContainer');
            if (container.style.display === 'block') {
                container.style.display = 'none';
            } else {
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(uploadedFileUrl)}`;
                document.getElementById('qrCodeImage').src = qrUrl;
                container.style.display = 'block';
            }
        }

        function shareToWhatsApp() { window.open(`https://wa.me/?text=${encodeURIComponent(uploadedFileUrl)}`, '_blank'); }
        function shareToTelegram() { window.open(`https://t.me/share/url?url=${encodeURIComponent(uploadedFileUrl)}`, '_blank'); }

        function downloadFile() {
            if (!uploadedFileId) {
                alert('Tidak ada file untuk didownload!');
                return;
            }
            
            try {
                const downloadUrl = storage.getFileDownload(BUCKET_ID, uploadedFileId);
                
                window.open(downloadUrl, '_blank');
                
                // Atau bisa juga menggunakan createElement untuk auto download:
                // const link = document.createElement('a');
                // link.href = downloadUrl;
                // link.download = ''; // Browser akan gunakan nama file asli
                // link.click();
                
            } catch (error) {
                console.error('Download error:', error);
                alert('Gagal mendownload file!');
            }
        }

        function saveToHistory(item) {
            let history = JSON.parse(localStorage.getItem('uploadHistory') || '[]');
            history.unshift(item);
            if(history.length > 10) history.pop();
            localStorage.setItem('uploadHistory', JSON.stringify(history));
        }

        function loadHistory() {
            const history = JSON.parse(localStorage.getItem('uploadHistory') || '[]');
            const list = document.getElementById('historyList');
            const section = document.getElementById('historySection');
            
            if (history.length === 0) {
                section.style.display = 'none';
                return;
            }
            
            section.style.display = 'block';
            list.innerHTML = history.map(item => `
                <div class="history-item">
                    <div class="history-item-info">
                        <div><b>${item.name.substring(0, 20)}${item.name.length>20?'...':''}</b></div>
                        <div class="history-item-date">${new Date(item.date).toLocaleString()}</div>
                    </div>
                    <div style="display: flex; gap: 5px;">
                        <a href="${item.url}" target="_blank" class="history-item-link">Lihat</a>
                        ${item.fileId ? `<a href="${storage.getFileDownload(BUCKET_ID, item.fileId)}" target="_blank" class="history-item-link" style="background: #10b981;">⬇️</a>` : ''}
                    </div>
                </div>
            `).join('');
        }

        function clearHistory() {
            if(confirm("Hapus semua riwayat?")) {
                localStorage.removeItem('uploadHistory');
                loadHistory();
            }
        }

        function toggleDarkMode() {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('darkMode', isDark);
            updateDarkIcon(isDark);
        }

        function loadDarkMode() {
            const isDark = localStorage.getItem('darkMode') === 'true';
            if (isDark) document.body.classList.add('dark-mode');
            updateDarkIcon(isDark);
        }

        function updateDarkIcon(isDark) {
            const icon = document.getElementById('darkModeIcon');
            if (isDark) {
                icon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
            } else {
                icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
            }
        }
