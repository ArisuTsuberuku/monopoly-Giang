# Thư mục Mô hình 3D cho Bàn cờ Monopoly (`client/public/models/`)

Hệ thống **TilePreset** được tích hợp cơ chế **Graceful Degradation**:
- Bạn có thể đặt các file 3D định dạng `.glb` vào thư mục này theo quy ước đặt tên: `tile_{id}.glb` (Ví dụ: `tile_0.glb` cho ô Khởi Hành, `tile_1.glb` cho ô Tuyên Quang...).
- Trang web sẽ tự động nhận diện và hiển thị mô hình tĩnh này thông qua `useGLTF`.
- Nếu file chưa tồn tại hoặc bị xóa, hệ thống sẽ tự động dùng khối `BoxGeometry` Greyboxing làm Fallback mà không bao giờ gây gián đoạn hay crash trang web.
