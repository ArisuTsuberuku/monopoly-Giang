/**
 * Script tự động nén & tối ưu hóa ảnh Thẻ Đất 16:9 sang định dạng WebP siêu nhẹ cho Monopoly 3D Xuyên Việt
 * Sử dụng thư viện Sharp (Node.js)
 * Cấu hình: resize(800, null, { withoutEnlargement: true }).webp({ quality: 85 })
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Thư mục nguồn (chứa ảnh thẻ đất gốc .png, .jpg, v.v... do User ném vào)
const INPUT_DIR = path.join(__dirname, '../cards');
// Thư mục đích (chứa ảnh .webp phục vụ cho PropertyCardModal.jsx của Frontend)
const OUTPUT_DIR = path.join(__dirname, '../client/public/cards');

async function optimizeCards() {
  console.log('======================================================');
  console.log('🚀 BẮT ĐẦU TỐI ƯU HÓA ẢNH THẺ ĐẤT (16:9 -> WebP 800px)');
  console.log('======================================================');
  console.log(`📁 Thư mục nguồn: ${INPUT_DIR}`);
  console.log(`📁 Thư mục đích:  ${OUTPUT_DIR}`);

  if (!fs.existsSync(INPUT_DIR)) {
    fs.mkdirSync(INPUT_DIR, { recursive: true });
    console.log('⚠️ Thư mục nguồn /cards/ chưa tồn tại, đã tự động tạo mới.');
  }
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const files = fs.readdirSync(INPUT_DIR).filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return ['.png', '.jpg', '.jpeg', '.webp'].includes(ext);
  });

  if (files.length === 0) {
    console.log('⚠️ Không tìm thấy ảnh nào trong thư mục /cards/.');
    console.log('👉 Hướng dẫn: Hãy ném ảnh thẻ đất gốc (.png, .jpg) vào thư mục `cards/` ở thư mục gốc dự án, sau đó chạy lại script này!');
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const inputPath = path.join(INPUT_DIR, file);
    // Chuẩn hóa tên Tiếng Việt NFC để tránh lỗi font khi chuyển đổi và tải ảnh trên Web
    const baseName = path.basename(file, path.extname(file)).normalize('NFC');
    const outputPath = path.join(OUTPUT_DIR, `${baseName}.webp`);

    try {
      await sharp(inputPath)
        .resize(800, null, { withoutEnlargement: true }) // Chiều ngang 800px, chiều dọc tự điều chỉnh theo tỷ lệ 16:9
        .webp({ quality: 85 })
        .toFile(outputPath);

      const inStats = fs.statSync(inputPath);
      const outStats = fs.statSync(outputPath);
      const savedKB = ((inStats.size - outStats.size) / 1024).toFixed(1);
      const reduction = Math.round((1 - outStats.size / inStats.size) * 100);

      console.log(`✅ [OK] ${file} -> ${baseName}.webp (${(outStats.size / 1024).toFixed(1)} KB | Giảm ${reduction}% / ${savedKB} KB)`);
      successCount++;
    } catch (err) {
      console.error(`❌ [LỖI] Không thể tối ưu ảnh: ${file} - Chi tiết: ${err.message}`);
      errorCount++;
    }
  }

  console.log('======================================================');
  console.log(`🎉 HOÀN TẤT: Đã xử lý thành công ${successCount} ảnh, ${errorCount} ảnh lỗi.`);
  console.log(`👉 Toàn bộ ảnh tối ưu đã nằm tại: client/public/cards/`);
  console.log('======================================================');
}

optimizeCards();
