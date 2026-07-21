const fs = require('fs');
const path = require('path');

const boardPath = path.resolve(__dirname, '../data/board.json');
const textureDir = path.resolve(__dirname, '../client/public/texture');

if (!fs.existsSync(boardPath)) {
  console.error("❌ Không tìm thấy board.json tại:", boardPath);
  process.exit(1);
}

const boardData = JSON.parse(fs.readFileSync(boardPath, 'utf-8'));
const missingFiles = [];
const foundFiles = [];

boardData.forEach(tile => {
  // Thay thế các ký tự không hợp lệ trong tên file nếu có (hiện tại ta dùng trực tiếp tile.name)
  const expectedFileName = `${tile.name}.webp`;
  const filePath = path.join(textureDir, expectedFileName);
  
  if (fs.existsSync(filePath)) {
    foundFiles.push(expectedFileName);
  } else {
    missingFiles.push(expectedFileName);
  }
});

console.log("========================================");
console.log("🔍 BÁO CÁO KIỂM TRA TEXTURE BÀN CỜ");
console.log("========================================");
console.log(`✅ Đã tìm thấy: ${foundFiles.length}/56 file.`);
console.log(`❌ Đang thiếu (hoặc sai tên): ${missingFiles.length} file.`);
console.log("----------------------------------------");
if (missingFiles.length > 0) {
  console.log("⚠️ DANH SÁCH FILE CẦN BỔ SUNG HOẶC ĐỔI TÊN LẠI CHO KHỚP:");
  missingFiles.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file}`);
  });
} else {
  console.log("🎉 TUYỆT VỜI! Đã khớp 100% texture cho toàn bộ 56 ô cờ!");
}
console.log("========================================");
