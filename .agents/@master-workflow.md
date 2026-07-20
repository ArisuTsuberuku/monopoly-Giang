# MASTER WORKFLOW: MONOPOLY 3D XUYÊN VIỆT
**Mục tiêu:** Điều phối dự án Monopoly WebGL Multiplayer từ số 0 đến khi Deploy.
**Nguyên tắc Vận hành:** Không bao giờ chuyển sang Phase tiếp theo nếu Phase hiện tại chưa pass 100% Acceptance Criteria (Tiêu chuẩn nghiệm thu).

## Phase 1: Core Engine & Socket Synchronization
- **Nhiệm vụ:** Xây dựng khung Frontend React kết nối với Backend Socket.io hiện có.
- **Quy trình:**
  1. Đọc file `server.js` và `GameEngine.js` để hiểu các emit/on events.
  2. Dựng Zustand Store (`gameStore.js`) để lưu trữ bản sao của Server State.
  3. Dựng UI 2D (HTML/CSS) cơ bản hiển thị danh sách người chơi, số dư, và nút "Đổ Xúc Xắc".
- **Acceptance Criteria:** Bấm nút trên UI -> Gọi server -> Server trả log -> UI cập nhật không có độ trễ, không lỗi Console. BẮT BUỘC PAUSE VÀ HỎI USER TRƯỚC KHI SANG PHASE 2.

## Phase 2: Lưới Không Gian 3D (Greyboxing)
- **Nhiệm vụ:** Render 56 ô cờ tỷ lệ 16:9 bằng React Three Fiber.
- **Quy trình:**
  1. Load dữ liệu từ `board.json`.
  2. Tạo component `Board3D.jsx`. Sử dụng toán học ma trận để rải 56 `BoxGeometry` (17x9).
  3. Ô Góc: Hình vuông lớn. Ô Đất: Hình chữ nhật đứng.
- **Acceptance Criteria:** 56 ô xếp khít nhau thành hình chữ nhật khép kín, rỗng ở giữa. Bấm vào một ô sẽ log ra tên ô đó (Raycaster hoạt động).

## Phase 3: Token, Dice & Cinematic Camera
- **Nhiệm vụ:** Đưa Token (nhân vật) vào bàn cờ và xử lý góc nhìn.
- **Quy trình:**
  1. Dùng `CylinderGeometry` làm Token tạm thời.
  2. Tích hợp `GSAP` để Token di chuyển mượt mà (lerp) từ ô này sang ô khác theo quỹ đạo kim đồng hồ.
  3. Lập trình Camera: Khi Token di chuyển, Camera tự động bay theo sát mặt đất. Khi hoàn tất, Camera zoom out bao quát 16:9.
- **Acceptance Criteria:** Di chuyển token mượt, không xuyên qua các ô, Camera không bị giật lag. (✅ HOÀN THÀNH)

## Phase 4: Polish (Đánh bóng Giao diện & Độ nét WebGL)
- **Nhiệm vụ:** Tinh chỉnh toàn diện giao diện Light Mode (Diorama), chống nhòe mờ canvas 3D và bổ sung mặt bàn gỗ trung tâm.
- **Acceptance Criteria:** WebGL sắc nét trên màn hình Retina (dpr), không lỗi layout chồng chéo, khối bàn gỗ lọt khít không gian 34x18 ở giữa lưới cờ 17x9. (✅ HOÀN THÀNH)

## Phase 5: Chuẩn hóa Grid 3D, Lobby & Bot AI
- **Nhiệm vụ:** Chuẩn hóa tọa độ Grid (1 Unit = 100px), tích hợp ảnh Khế ước thật từ `board card`, xây dựng tính năng Lobby (cho phép chọn 2-4 người) và tự động thêm Bot AI tự động chơi (Authoritative Server is King).
- **Acceptance Criteria:** Phòng chơi tự động lấp đầy Bot AI nếu thiếu người, Bot AI tự động đổ xúc xắc/mua đất trên server và cập nhật real-time về Frontend, tự động reset/dọn dẹp bàn cờ khi tất cả người chơi thật rời bàn. (✅ HOÀN THÀNH)

## Phase 6: Hoàn thiện Lobby, Grid Math chuẩn & UI Điều khiển (Local Multiplayer + Bot)
- **Nhiệm vụ:** 
  1. Chuẩn hóa công thức Grid Math (Ô đất $1.0 \times 1.6$, Ô góc $1.6 \times 1.6$, Bàn gỗ trung tâm $17 \times 0.2 \times 9$, Khối nhà chủ sở hữu 3D và màu viền `TOKEN_COLORS`).
  2. Làm lại toàn diện Lobby động cho phép tùy chỉnh từng người chơi (Tên, IsBot) theo chuẩn Local Multiplayer kết hợp Bot AI trên cùng máy Host (`setup_game`).
  3. Bổ sung nút "Làm mới Ván cờ" (Màu đỏ `RotateCcw`) phát sự kiện `reset_game` về phòng chờ Lobby và đồng bộ quyền điều khiển lượt đi cho tất cả Local Players/Bots.
- **Acceptance Criteria:** Grid Math 56 ô chuẩn xác 100% không chồng lấn, Lobby động kết nối nhanh, hiển thị rõ quyền sở hữu bằng mô hình nhà 3D, hỗ trợ điều khiển Local Multiplayer trơn tru và reset ván cờ tức thì. (✅ HOÀN THÀNH)

## ERROR RECOVERY PROTOCOL (Giao thức Sửa lỗi)
Nếu User báo lỗi, Agent BẮT BUỘC thực hiện luồng sau:
1. Đọc kỹ Error Trace / Console Log.
2. Xác định nguyên nhân gốc rễ (Root Cause) bằng cách phân tích State hoặc Logic.
3. KHÔNG viết lại toàn bộ file. Chỉ cung cấp đoạn code cần vá (Patch) và giải thích lý do (bằng tiếng Việt).