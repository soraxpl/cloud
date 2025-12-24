const sdk = require("node-appwrite");

const client = new sdk.Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject(process.env.PROJECT_ID)
  .setKey(process.env.API_KEY);

const storage = new sdk.Storage(client);
const BUCKET_ID = process.env.BUCKET_ID;

async function deleteAllFiles() {
  try {
    console.log("🔄 Menghubungkan ke Appwrite...");

    const fileList = await storage.listFiles(BUCKET_ID, [sdk.Query.limit(100)]);

    if (fileList.total === 0) {
      console.log("✅ Bucket sudah bersih. Tidak ada file.");
      return;
    }

    console.log(`⚠️ Ditemukan ${fileList.total} file. Menghapus...`);

    for (const file of fileList.files) {
      await storage.deleteFile(BUCKET_ID, file.$id);
      console.log(`🗑️ Deleted: ${file.name}`);
    }

    console.log("🎉 Selesai!");

    if (fileList.total > 100) {
      console.log("Masih ada sisa, mengulang proses...");
      deleteAllFiles();
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

deleteAllFiles();
