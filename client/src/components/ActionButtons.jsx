import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Play, Dices, SkipForward, AlertCircle, X, RotateCcw } from 'lucide-react';

/**
 * Component hiển thị các nút hành động (Start, Roll Dice, End Turn) và thông báo lỗi từ server
 */
export default function ActionButtons() {
  const status = useGameStore((state) => state.status);
  const currentTurnPlayerId = useGameStore((state) => state.currentTurnPlayerId);
  const myPlayerId = useGameStore((state) => state.myPlayerId);
  const hasRolledThisTurn = useGameStore((state) => state.hasRolledThisTurn);
  const errorMessage = useGameStore((state) => state.errorMessage);
  const players = useGameStore((state) => state.players);

  const startGame = useGameStore((state) => state.startGame);
  const rollDice = useGameStore((state) => state.rollDice);
  const endTurn = useGameStore((state) => state.endTurn);
  const resetGame = useGameStore((state) => state.resetGame);
  const clearError = useGameStore((state) => state.clearError);

  const currentTurnPlayer = players.find((p) => p.id === currentTurnPlayerId);
  // Cho phép điều khiển nếu là lượt của chính mình, lượt của local player, hoặc bất kỳ người chơi thật nào trên cùng máy Host
  const isMyTurn = Boolean(
    currentTurnPlayerId &&
    (currentTurnPlayerId === myPlayerId ||
     (typeof currentTurnPlayerId === 'string' && currentTurnPlayerId.startsWith(`local_${myPlayerId}`)) ||
     (currentTurnPlayer && !currentTurnPlayer.isBot && players.some(p => p.id === myPlayerId)))
  );
  const isJoined = players.some((p) => p.id === myPlayerId || (typeof p.id === 'string' && p.id.startsWith(`local_${myPlayerId}`)));

  return (
    <div className="card action-buttons-card">
      <div className="card-header">
        <Dices className="icon-main" />
        <h2>Bảng Hành Động (Control Panel)</h2>
      </div>

      {errorMessage && (
        <div className="error-alert">
          <AlertCircle size={18} className="error-icon" />
          <span className="error-text">{errorMessage}</span>
          <button className="close-error-btn" onClick={clearError} title="Đóng thông báo">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="buttons-grid">
        {status === 'waiting' && (
          <button
            className="btn btn-primary btn-start"
            onClick={startGame}
            disabled={!isJoined || players.length === 0}
          >
            <Play size={18} />
            <span>Bắt đầu Game</span>
          </button>
        )}

        {status === 'started' && (
          <>
            <button
              className={`btn btn-roll ${isMyTurn && !hasRolledThisTurn ? 'btn-pulse' : ''}`}
              onClick={rollDice}
              disabled={!isMyTurn || hasRolledThisTurn}
            >
              <Dices size={20} />
              <span>Đổ Xúc Xắc</span>
            </button>

            <button
              className="btn btn-secondary btn-end-turn"
              onClick={endTurn}
              disabled={!isMyTurn || !hasRolledThisTurn}
            >
              <SkipForward size={18} />
              <span>Kết thúc Lượt</span>
            </button>

            <button
              className="btn btn-danger btn-reset"
              onClick={resetGame}
              style={{
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                padding: '0.65rem',
                borderRadius: '8px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                marginTop: '0.5rem',
                gridColumn: '1 / -1',
                boxShadow: '0 2px 4px rgba(239, 68, 68, 0.25)'
              }}
              title="Làm mới lại toàn bộ ván cờ về màn hình chờ Lobby"
            >
              <RotateCcw size={18} />
              <span>Làm mới Ván cờ</span>
            </button>
          </>
        )}
      </div>

      <div className="action-hint">
        {status === 'waiting' && (
          <p>⏳ Đang chờ người chơi gia nhập phòng cờ. Nhấn "Bắt đầu Game" để khởi tranh.</p>
        )}
        {status === 'started' && !isMyTurn && (
          <p>👀 Đang chờ lượt đi của người chơi khác...</p>
        )}
        {status === 'started' && isMyTurn && !hasRolledThisTurn && (
          <p className="hint-active">👉 Đến lượt của bạn! Nhấn "Đổ Xúc Xắc" để di chuyển.</p>
        )}
        {status === 'started' && isMyTurn && hasRolledThisTurn && (
          <p className="hint-active">👉 Bạn đã đổ xúc xắc. Hãy mua đất hoặc nhấn "Kết thúc Lượt".</p>
        )}
      </div>
    </div>
  );
}
