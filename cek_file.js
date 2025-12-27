const sdk = require("node-appwrite");

// Setup Client
const client = new sdk.Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject(process.env.PROJECT_ID)
  .setKey(process.env.API_KEY);

const storage = new sdk.Storage(client);
const BUCKET_ID = process.env.BUCKET_ID;

async function checkFiles() {
  try {
    const now = new Date();
    console.log("==========================================");
    console.log("🕒 WAKTU SEKARANG (Server):", now.toLocaleString());
    console.log("==========================================\n");

    console.log("🔄 Mengambil daftar file...");

    // Ambil semua file (limit 100)
    const fileList = await storage.listFiles(BUCKET_ID, [
      sdk.Query.limit(100),
      sdk.Query.orderDesc('$createdAt') // Urutkan dari yang terbaru
    ]);

    if (fileList.total === 0) {
      console.log("✅ Bucket KOSONG. Tidak ada file.");
      return;
    }

    console.log(`📂 Total File: ${fileList.total}\n`);
    console.log("Daftar File:");
    console.log("---------------------------------------------------------------------------------");
    console.log("| Nama File                     | Tgl Upload           | Umur (Hari) | ID         |");
    console.log("---------------------------------------------------------------------------------");

    for (const file of fileList.files) {
      const createdDate = new Date(file.$createdAt);
      
      // Hitung selisih waktu dalam milidetik
      const diffMs = now - createdDate;
      // Konversi ke hari (1 hari = 1000ms * 60dtk * 60mnt * 24jam)
      const ageDays = (diffMs / (1000 * 60 * 60 * 24)).toFixed(2);

      // Format nama biar rapi tabelnya
      let name = file.name;
      if (name.length > 28) name = name.substring(0, 25) + "...";
      
      // Tambahkan padding spasi manual untuk tampilan tabel sederhana
      const namePad = name.padEnd(29, ' ');
      const datePad = createdDate.toLocaleDateString().padEnd(20, ' ');
      const agePad = `${ageDays} hari`.padEnd(11, ' ');
      
      // Tandai jika sudah lewat 8 hari (Calon terhapus)
      const status = parseFloat(ageDays) >= 8 ? "⚠️ EXPIRED" : "✅ AMAN";

      console.log(`| ${namePad} | ${datePad} | ${agePad} | ${file.$id} | ${status}`);
    }
    console.log("---------------------------------------------------------------------------------");

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

checkFiles();
