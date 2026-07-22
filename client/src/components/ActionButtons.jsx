import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Dices, SkipForward, AlertCircle, X, RotateCcw } from 'lucide-react';

/**
 * Component hiển thị nút điều khiển HUD Floating (Góc phải dưới)
 * Giai đoạn 27: Monopoly Plus style giant floating action buttons
 */
export default function ActionButtons() {
  const status = useGameStore((state) => state.status);
  const currentTurnPlayerId = useGameStore((state) => state.currentTurnPlayerId);
  const myPlayerId = useGameStore((state) => state.myPlayerId);
  const hasRolledThisTurn = useGameStore((state) => state.hasRolledThisTurn);
  const errorMessage = useGameStore((state) => state.errorMessage);
  const players = useGameStore((state) => state.players);

  const rollDice = useGameStore((state) => state.rollDice);
  const endTurn = useGameStore((state) => state.endTurn);
  const resetGame = useGameStore((state) => state.resetGame);
  const clearError = useGameStore((state) => state.clearError);

  const currentTurnPlayer = players.find((p) => p.id === currentTurnPlayerId);
  const isMyTurn = Boolean(
    currentTurnPlayerId &&
      (currentTurnPlayerId === myPlayerId ||
        (typeof currentTurnPlayerId === 'string' && currentTurnPlayerId.startsWith(`local_${myPlayerId}`)) ||
        (currentTurnPlayer && !currentTurnPlayer.isBot && players.some((p) => p.id === myPlayerId)))
  );

  return (
    <div className="flex flex-col items-end gap-3">
      {/* Thông báo lỗi nếu có */}
      {errorMessage && (
        <div className="bg-red-600/90 backdrop-blur-md text-white px-4 py-2.5 rounded-xl shadow-xl border border-white/30 flex items-center gap-3 max-w-sm">
          <AlertCircle size={18} className="shrink-0 animate-bounce" />
          <span className="text-xs font-semibold">{errorMessage}</span>
          <button onClick={clearError} className="hover:bg-white/20 p-1 rounded transition-colors">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Trạng thái lượt đi */}
      {!isMyTurn && (
        <div className="bg-black/60 backdrop-blur-md text-gray-200 px-4 py-2 rounded-xl border border-white/10 text-sm font-medium shadow-md">
          👀 Đang chờ lượt của <span className="font-bold text-yellow-400">{currentTurnPlayer?.name || 'đối thủ'}</span>...
        </div>
      )}

      {/* Nút ĐỔ XÚC XẮC khổng lồ hoặc KẾT THÚC LƯỢT */}
      {isMyTurn && !hasRolledThisTurn && (
        <button
          onClick={rollDice}
          className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-500 text-white font-black text-xl rounded-full shadow-[0_5px_20px_rgba(239,68,68,0.5)] hover:scale-105 active:scale-95 transition-all animate-pulse border-2 border-white/50 cursor-pointer"
        >
          🎲 ĐỔ XÚC XẮC
        </button>
      )}

      {isMyTurn && hasRolledThisTurn && (
        <button
          onClick={endTurn}
          className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:scale-105 active:scale-95 transition-all duration-200 text-white font-bold text-lg px-6 py-4 rounded-xl shadow-lg flex items-center gap-2 border border-white/30 cursor-pointer"
        >
          <SkipForward size={22} />
          <span>KẾT THÚC LƯỢT</span>
        </button>
      )}

      {/* Nút làm mới ván cờ (nhỏ gọn phía dưới) */}
      <button
        onClick={resetGame}
        className="bg-black/40 hover:bg-red-600/80 backdrop-blur-sm text-gray-300 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm mt-1"
        title="Làm mới lại toàn bộ ván cờ về màn hình chờ Lobby"
      >
        <RotateCcw size={13} />
        <span>Làm mới ván cờ</span>
      </button>
    </div>
  );
}
