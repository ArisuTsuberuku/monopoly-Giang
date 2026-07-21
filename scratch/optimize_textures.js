const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const textureDir = path.resolve(__dirname, '../client/public/texture');
if (!fs.existsSync(textureDir)) {
  console.log("Không tìm thấy thư mục texture.");
  process.exit(0);
}

fs.readdirSync(textureDir).forEach(file => {
  if (file.endsWith('.png') || file.endsWith('.jpg')) {
    const input = path.join(textureDir, file);
    // Đổi đuôi thành .webp
    const output = path.join(textureDir, file.replace(/\.(png|jpg)$/, '.webp'));
    
    sharp(input)
      .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(output)
      .then(() => console.log(`Đã nén tối ưu: ${output}`))
      .catch(err => console.error(`Lỗi nén ${file}:`, err));
  }
});
