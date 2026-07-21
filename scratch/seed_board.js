const fs = require('fs');
const path = require('path');

// Đường dẫn tới file json (hãy thay đổi nếu đường dẫn thực tế khác)
const boardPath = path.resolve(__dirname, '../data/board.json');
let oldData = [];
if (fs.existsSync(boardPath)) {
  oldData = JSON.parse(fs.readFileSync(boardPath, 'utf-8'));
} else {
  // Dự phòng đọc từ client/src/data hoặc tương tự nếu cần
  console.log("Cần trỏ đúng đường dẫn board.json");
}

const oldDataMap = {};
oldData.forEach(tile => { oldDataMap[tile.id] = tile; });

const targetLayout = [
  { id: 0, name: "Khởi Hành", type: "go" },
  { id: 1, name: "Lai Châu", type: "property", group: "light_green", oldId: 6 },
  { id: 2, name: "Điện Biên", type: "property", group: "light_green", oldId: 8 },
  { id: 3, name: "Khí Vận", type: "chest" },
  { id: 4, name: "Sơn La", type: "property", group: "light_green", oldId: 11 },
  { id: 5, name: "Cao Bằng", type: "property", group: "light_green", oldId: 7 },
  { id: 6, name: "Lạng Sơn", type: "property", group: "light_green", oldId: 4 },
  { id: 7, name: "Điểm cực Bắc", type: "utility", oldId: 40 },
  { id: 8, name: "Tuyên Quang", type: "property", group: "dark_green", oldId: 1 },
  { id: 9, name: "Cơ Hội", type: "chance" },
  { id: 10, name: "Phú Thọ", type: "property", group: "dark_green", oldId: 5 },
  { id: 11, name: "Tổng cục thuế", type: "tax", amount: 200 },
  { id: 12, name: "Lào Cai", type: "property", group: "dark_green", oldId: 2 },
  { id: 13, name: "Thái Nguyên", type: "property", group: "dark_green", oldId: 3 },
  { id: 14, name: "Khí Vận", type: "chest" },
  { id: 15, name: "Hà Nội", type: "property", group: "yellow", oldId: 12 },
  { id: 16, name: "Sân bay Nội Bài", type: "airport", oldId: 37 },
  { id: 17, name: "Quảng Ninh", type: "property", group: "yellow", oldId: 10 },
  { id: 18, name: "Thăm Tù", type: "jail" },
  { id: 19, name: "Bắc Ninh", type: "property", group: "orange", oldId: 13 },
  { id: 20, name: "Cơ Hội", type: "chance" },
  { id: 21, name: "Hưng Yên", type: "property", group: "orange", oldId: 17 },
  { id: 22, name: "Ngân hàng nhà nước", type: "tax", amount: 1000 },
  { id: 23, name: "Sân bay Cát Bi", type: "airport", oldId: 38 }, 
  { id: 24, name: "Hải Phòng", type: "property", group: "orange", oldId: 15 },
  { id: 25, name: "Khí Vận", type: "chest" },
  { id: 26, name: "Ninh Bình", type: "property", group: "orange", oldId: 9 },
  { id: 27, name: "Điểm cực Đông", type: "utility", oldId: 42 },
  { id: 28, name: "Bãi Đỗ Xe", type: "parking" },
  { id: 29, name: "Thanh Hóa", type: "property", group: "red", oldId: 14 },
  { id: 30, name: "Nghệ An", type: "property", group: "red", oldId: 16 },
  { id: 31, name: "Hà Tĩnh", type: "property", group: "red", oldId: 20 },
  { id: 32, name: "Quảng Trị", type: "property", group: "red", oldId: 18 },
  { id: 33, name: "Huế", type: "property", group: "red", oldId: 21 },
  { id: 34, name: "Cơ Hội", type: "chance" },
  { id: 35, name: "Đà Nẵng", type: "property", group: "cyan", oldId: 23 },
  { id: 36, name: "Sân bay Đà Nẵng", type: "airport", oldId: 35 },
  { id: 37, name: "Quảng Ngãi", type: "property", group: "cyan", oldId: 22 },
  { id: 38, name: "Khánh Hòa", type: "property", group: "cyan", oldId: 19 },
  { id: 39, name: "Đắk Lắk", type: "property", group: "blue", oldId: 27 },
  { id: 40, name: "Gia Lai", type: "property", group: "blue", oldId: 26 },
  { id: 41, name: "Lâm Đồng", type: "property", group: "blue", oldId: 25 },
  { id: 42, name: "Điểm cực Nam", type: "utility", oldId: 39 },
  { id: 43, name: "Đồng Nai", type: "property", group: "magenta", oldId: 28 },
  { id: 44, name: "Tây Ninh", type: "property", group: "magenta", oldId: 24 },
  { id: 45, name: "TP. Hồ Chí Minh", type: "property", group: "magenta", oldId: 30 },
  { id: 46, name: "Vào Tù", type: "go_to_jail" },
  { id: 47, name: "Khí Vận", type: "chest" },
  { id: 48, name: "Vĩnh Long", type: "property", group: "purple", oldId: 29 },
  { id: 49, name: "Đồng Tháp", type: "property", group: "purple", oldId: 34 },
  { id: 50, name: "Sân bay Tân Sơn Nhất", type: "airport", oldId: 36 },
  { id: 51, name: "TP. Cần Thơ", type: "property", group: "purple", oldId: 33 },
  { id: 52, name: "An Giang", type: "property", group: "purple", oldId: 31 },
  { id: 53, name: "Cơ Hội", type: "chance" },
  { id: 54, name: "Cà Mau", "type": "property", group: "purple", oldId: 32 },
  { id: 55, name: "Điểm cực Tây", "type": "utility", oldId: 41 }
];

const newBoard = targetLayout.map((tile, index) => {
  let baseData = {};
  if (tile.oldId && oldDataMap[tile.oldId]) {
    baseData = { ...oldDataMap[tile.oldId] };
    delete baseData.tileIndex;
    delete baseData.id;
    delete baseData.name;
    delete baseData.group;
  }
  return {
    id: index,
    name: tile.name,
    type: tile.type,
    ...(tile.group ? { group: tile.group } : {}),
    ...baseData,
    ...(tile.amount ? { amount: tile.amount } : {})
  };
});

fs.writeFileSync(boardPath, JSON.stringify(newBoard, null, 2), 'utf-8');
console.log("Đã tạo board.json chuẩn xác 56 ô!");
