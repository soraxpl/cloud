const sdk = require("node-appwrite");

const client = new sdk.Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject(process.env.PROJECT_ID)
  .setKey(process.env.API_KEY);

const storage = new sdk.Storage(client);
const BUCKET_ID = process.env.BUCKET_ID;

const EXPIRATION_DAYS = 8;

async function deleteExpiredFiles() {
  try {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - EXPIRATION_DAYS);
    const limitISO = dateLimit.toISOString();

    console.log(`🔄 Menghubungkan ke Appwrite...`);
    console.log(`📅 Mencari file yang dibuat sebelum: ${dateLimit.toLocaleString()}`);

    const queries = [
      sdk.Query.limit(100),
      sdk.Query.lessThan('$createdAt', limitISO)
    ];

    const fileList = await storage.listFiles(BUCKET_ID, queries);

    if (fileList.total === 0) {
      console.log("✅ Tidak ada file kadaluarsa. Semua file aman.");
      return;
    }

    console.log(`⚠️ Ditemukan ${fileList.files.length} file tua yang harus dihapus.`);

    for (const file of fileList.files) {
      await storage.deleteFile(BUCKET_ID, file.$id);
      
      const fileDate = new Date(file.$createdAt);
      const ageDays = ((new Date() - fileDate) / (1000 * 60 * 60 * 24)).toFixed(1);
      
      console.log(`🗑️ Deleted: ${file.name} (Umur: ${ageDays} hari)`);
    }

    console.log(`🎉 Batch selesai! ${fileList.files.length} file terhapus.`);

    if (fileList.files.length >= 100) {
      console.log("⏳ Masih ada sisa file kadaluarsa, mengulang proses...");
      await deleteExpiredFiles();
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

deleteExpiredFiles();
