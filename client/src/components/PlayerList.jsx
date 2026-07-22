import React from 'react';
import { useGameStore } from '../store/gameStore';
import { TOKEN_COLORS } from './PlayerToken';
import { TILES } from './TilePreset';
import { ShieldAlert, Award } from 'lucide-react';

/**
 * Hàm tiện ích lấy danh sách tài sản (portfolio) của 1 player
 */
const getPlayerProperties = (playerId, propertiesState = {}, boardState = []) => {
  if (!TILES || !Array.isArray(TILES)) return [];
  return TILES.filter((t) => {
    const prop = propertiesState[t.id] || {};
    const ownerId = prop.ownerId || (boardState[t.id] && boardState[t.id].ownerId) || t.ownerId;
    return ownerId === playerId;
  }).map((t) => ({
    name: t.name || `Ô #${t.id}`,
    type: t.type || 'property'
  }));
};

/**
 * Hàm xác định vị trí 4 góc tuyệt đối bằng Inline CSS Style
 */
const getCornerStyle = (index) => {
  switch (index) {
    case 0:
      return { top: '24px', left: '24px' };
    case 1:
      return { bottom: '100px', left: '24px' };
    case 2:
      return { bottom: '100px', right: '24px' };
    case 3:
      return { top: '24px', right: '24px' };
    default:
      return { display: 'none' };
  }
};

export default function PlayerList() {
  const players = useGameStore((state) => state.players);
  const currentTurnPlayerId = useGameStore((state) => state.currentTurnPlayerId);
  const myPlayerId = useGameStore((state) => state.myPlayerId);
  const socket = useGameStore((state) => state.socket);
  const properties = useGameStore((state) => state.properties);
  const board = useGameStore((state) => state.board);

  if (!players || players.length === 0) {
    return <div className="absolute inset-0 pointer-events-none z-10" />;
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {players.map((p, index) => {
        const isCurrentTurn = p.id === currentTurnPlayerId;
        const isMe = p.id === socket?.id || p.id === myPlayerId || (typeof p.id === 'string' && p.id.startsWith(`local_${myPlayerId}`));
        const avatarColor = TOKEN_COLORS[index % TOKEN_COLORS.length] || '#3b82f6';
        const playerProps = getPlayerProperties(p.id, properties, board);

        return (
          <div
            key={p.id}
            style={{ position: 'absolute', ...getCornerStyle(index) }}
            className={`flex flex-col gap-2 w-64 p-3 rounded-2xl backdrop-blur-md bg-black/60 pointer-events-auto border transition-all duration-300 ${
              isCurrentTurn ? 'border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)] scale-105 z-20' : 'border-white/10 z-10'
            }`}
          >
            {/* Header: Tên và Avatar */}
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-xl shadow-inner border-2 border-white/50 shrink-0"
                style={{ backgroundColor: avatarColor }}
              >
                {p.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0 items-start">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg text-white truncate max-w-[150px]">
                    {p.name} {isMe ? '(Bạn)' : ''}
                  </span>
                  {isCurrentTurn && <Award size={16} className="text-yellow-400 shrink-0 animate-bounce" />}
                </div>
                <span className="text-yellow-400 font-mono text-xl font-black">
                  {(p.money || 0).toLocaleString()} đ
                </span>
                {p.inJail && (
                  <span className="text-[11px] text-red-300 flex items-center gap-1 font-medium mt-0.5">
                    <ShieldAlert size={12} /> Trong tù ({p.jailTurns}/3)
                  </span>
                )}
              </div>
            </div>

            {/* Body: Danh sách tài sản (Cuộn dọc nếu quá nhiều) */}
            <div className="mt-2 max-h-32 overflow-y-auto custom-scrollbar flex flex-col gap-1">
              {playerProps.length === 0 ? (
                <span className="text-gray-400 text-sm italic">Chưa có tài sản</span>
              ) : (
                playerProps.map((prop, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm text-white/90 bg-white/5 px-2 py-1 rounded-md justify-start"
                  >
                    <span className="truncate max-w-[160px]">{prop.name}</span>
                    <span>🚩</span> {/* Biểu tượng sở hữu */}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
