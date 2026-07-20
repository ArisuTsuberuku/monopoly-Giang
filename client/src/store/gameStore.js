import { create } from 'zustand';
import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://localhost:3000';

// Cờ toàn cục module ngăn chặn gắn listeners bị nhân đôi trong strict mode / re-renders
let socketInstance = null;
let listenersAttached = false;

/**
 * Zustand Store quản lý trạng thái ván cờ Monopoly (Read-only Mirror từ Authoritative Server)
 * Tuân thủ nguyên tắc SERVER IS KING: Không tự ý tính toán, chỉ phản ánh state từ server.
 */
export const useGameStore = create((set, get) => ({
  // --- STATE (Bản sao chỉ đọc từ Server) ---
  socket: null,
  isConnected: false,
  myPlayerId: null,
  status: 'waiting', // 'waiting' | 'started'
  players: [],
  properties: {},
  board: [],
  currentTurnPlayerId: null,
  hasRolledThisTurn: false,
  logs: [],
  errorMessage: null,
  activePropertyModal: null, // { tileId, price, mode: 'unowned' | 'self_owned' | 'rent_paid' }
  cinematicTileId: null, // ID ô đất cho hoạt ảnh Cinematic Camera
  targetPlayerCount: 4, // Số lượng người chơi mục tiêu trong phòng (2, 3, 4 - tự động điền Bot nếu thiếu)

  /**
   * Cập nhật số lượng người chơi mong muốn trong phòng (2, 3, 4)
   */
  setTargetPlayerCount: (count) => set({ targetPlayerCount: Number(count) || 4 }),

  // --- ACTIONS (Kết nối & Lắng nghe) ---
  /**
   * Khởi tạo kết nối Socket.io tới máy chủ Node.js (Authoritative Server)
   */
  connectSocket: () => {
    const existingSocket = get().socket;
    if (existingSocket && existingSocket.connected) {
      return;
    }
    if (socketInstance && listenersAttached) {
      if (!get().socket) {
        set({ socket: socketInstance, isConnected: socketInstance.connected, myPlayerId: socketInstance.id });
      }
      return;
    }

    const socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true
    });
    socketInstance = socket;

    if (!listenersAttached) {
      listenersAttached = true;

      socket.on('connect', () => {
        console.log(`[Socket Connected] Kết nối máy chủ thành công! ID: ${socket.id}`);
        set({ socket, isConnected: true, myPlayerId: socket.id });
      });

      socket.on('disconnect', () => {
        console.warn('[Socket Disconnected] Mất kết nối tới máy chủ.');
        set({ isConnected: false });
      });

      // Lắng nghe cập nhật toàn bộ trạng thái ván cờ từ server
      socket.on('state_update', (payload) => {
        set({
          status: payload.status || 'waiting',
          players: payload.players || [],
          properties: payload.properties || {},
          board: payload.board || [],
          currentTurnPlayerId: payload.currentTurnPlayerId || null,
          hasRolledThisTurn: Boolean(payload.hasRolledThisTurn)
        });
      });

      // Lắng nghe sự kiện nhật ký ván cờ (Turn events)
      socket.on('turn_event', (payload) => {
        set((state) => {
          const nextLogs = [...state.logs, payload];
          let nextModal = state.activePropertyModal;
          let nextCinematicTile = state.cinematicTileId;

          // Nếu đây là sự kiện roll, cập nhật cinematicTileId để camera bay cận cảnh
          if (payload.type === 'roll' && typeof payload.newPosition === 'number') {
            nextCinematicTile = payload.newPosition;
          }

          // Kiểm tra mở modal: cho phép cả khi là myPlayerId hoặc local multiplayer id / bất kỳ ai đang ở lượt của họ trên client
          if (
            payload.type === 'roll' &&
            payload.playerId === state.currentTurnPlayerId &&
            payload.turnEvent
          ) {
            const te = payload.turnEvent;
            const isUnowned = te.type === 'unowned' || te.actionType === 'can_buy' || te.actionResult?.type === 'unowned';
            const isSelfOwned = te.type === 'self_owned' || te.actionType === 'self_owned' || te.actionResult?.type === 'self_owned';
            const isRentPaid = te.type === 'rent_paid' || te.actionType === 'paid_rent' || te.actionResult?.type === 'rent_paid';

            if (isUnowned) {
              nextModal = {
                tileId: payload.newPosition,
                price: te.price || te.actionResult?.price || 0,
                mode: 'unowned'
              };
            } else if (isSelfOwned) {
              nextModal = {
                tileId: payload.newPosition,
                level: te.level || te.actionResult?.level || 0,
                mode: 'self_owned'
              };
            } else if (isRentPaid) {
              nextModal = {
                tileId: payload.newPosition,
                rent: te.rent || te.actionResult?.rent || 0,
                mode: 'rent_paid'
              };
            }
          }

          // Nếu đã đổi lượt thì tự động đóng modal và đưa camera về toàn cảnh
          if (payload.type === 'turn_change') {
            nextModal = null;
            nextCinematicTile = null;
          }

          return { logs: nextLogs, activePropertyModal: nextModal, cinematicTileId: nextCinematicTile };
        });
      });

      // Lắng nghe lỗi hành động từ server
      socket.on('action_error', (payload) => {
        set({ errorMessage: payload.message || 'Có lỗi xảy ra khi thực hiện hành động.' });
      });
    }

    set({ socket });
  },

  /**
   * Xóa thông báo lỗi hiện tại
   */
  clearError: () => set({ errorMessage: null }),

  /**
   * Đóng Modal Thẻ Đất khi người chơi bấm Bỏ qua
   */
  closePropertyModal: () => set({ activePropertyModal: null }),

  /**
   * Thu góc nhìn Camera về toàn cảnh bàn cờ
   */
  resetCinematicCamera: () => set({ cinematicTileId: null, activePropertyModal: null }),

  // --- EMIT ACTIONS (Gửi lệnh lên Authoritative Server) ---
  /**
   * Người chơi tham gia phòng cờ
   * @param {string} name - Tên người chơi
   */
  joinGame: (name) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('join_game', { name });
    } else {
      set({ errorMessage: 'Chưa kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền.' });
    }
  },

  /**
   * Yêu cầu bắt đầu ván chơi
   */
  startGame: () => {
    const { socket, targetPlayerCount } = get();
    if (socket && socket.connected) {
      socket.emit('start_game', { targetPlayerCount: targetPlayerCount || 4 });
    }
  },

  /**
   * Thiết lập danh sách người chơi chi tiết (Tên + Bot) và bắt đầu ngay
   */
  setupGame: (playersSetup) => {
    const { socket } = get();
    if (socket && socket.connected) {
      get().clearError();
      socket.emit('setup_game', { playersSetup });
    } else {
      set({ errorMessage: 'Chưa kết nối đến máy chủ.' });
    }
  },

  /**
   * Yêu cầu làm mới ván cờ về Lobby
   */
  resetGame: () => {
    const { socket } = get();
    if (socket && socket.connected) {
      get().clearError();
      set({ activePropertyModal: null, cinematicTileId: null });
      socket.emit('reset_game');
    }
  },

  /**
   * Yêu cầu đổ xúc xắc trong lượt đi
   */
  rollDice: () => {
    const { socket } = get();
    if (socket && socket.connected) {
      get().clearError();
      socket.emit('roll_dice');
    }
  },

  /**
   * Gửi yêu cầu mua đất tại ô đang đứng
   * @param {number} tileId - ID của ô đất muốn mua
   * @param {string} [playerId] - ID người chơi Local/Active thực hiện hành động
   */
  buyProperty: (tileId, playerId) => {
    const { socket, currentTurnPlayerId } = get();
    if (socket && socket.connected) {
      get().clearError();
      socket.emit('buy_property', { tileId, playerId: playerId || currentTurnPlayerId });
      set({ activePropertyModal: null });
    }
  },

  /**
   * Gửi yêu cầu xây nhà / nâng cấp Landmark tại ô đang đứng
   * @param {number} tileId - ID của ô đất muốn nâng cấp
   * @param {string} [playerId] - ID người chơi Local/Active thực hiện hành động
   */
  upgradeProperty: (tileId, playerId) => {
    const { socket, currentTurnPlayerId } = get();
    if (socket && socket.connected) {
      get().clearError();
      socket.emit('upgrade_property', { tileId, playerId: playerId || currentTurnPlayerId });
      set({ activePropertyModal: null });
    }
  },

  /**
   * Yêu cầu kết thúc lượt đi hiện tại
   */
  endTurn: () => {
    const { socket } = get();
    if (socket && socket.connected) {
      get().clearError();
      set({ activePropertyModal: null, cinematicTileId: null });
      socket.emit('end_turn');
    }
  }
}));
