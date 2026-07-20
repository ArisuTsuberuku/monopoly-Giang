import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { UserPlus, Sparkles, Users, Play, Bot, User } from 'lucide-react';

/**
 * Component form thiết lập ván cờ (Chọn số người chơi 2-4, nhập tên và chọn Ai là Bot theo Local Multiplayer)
 */
export default function JoinForm() {
  const [playerCount, setPlayerCount] = useState(4);
  const [playersSetup, setPlayersSetup] = useState([
    { name: 'Đại Gia Sài Thành', isBot: false },
    { name: 'Bot AI 1', isBot: true },
    { name: 'Bot AI 2', isBot: true },
    { name: 'Bot AI 3', isBot: true }
  ]);

  const setupGame = useGameStore((state) => state.setupGame);
  const isConnected = useGameStore((state) => state.isConnected);

  // Cập nhật mảng playersSetup khi đổi số lượng người chơi
  useEffect(() => {
    setPlayersSetup((prev) => {
      if (prev.length === playerCount) return prev;
      if (prev.length < playerCount) {
        const next = [...prev];
        for (let i = prev.length; i < playerCount; i++) {
          next.push({
            name: `Bot AI ${i}`,
            isBot: true
          });
        }
        return next;
      }
      return prev.slice(0, playerCount);
    });
  }, [playerCount]);

  const handleNameChange = (index, newName) => {
    setPlayersSetup((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], name: newName };
      return next;
    });
  };

  const handleBotChange = (index, isBot) => {
    setPlayersSetup((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        isBot,
        name: isBot && next[index].name.startsWith('Người chơi') ? `Bot AI ${index}` : (!isBot && next[index].name.startsWith('Bot AI') ? `Người chơi ${index + 1}` : next[index].name)
      };
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isConnected) return;
    // Kiểm tra tên hợp lệ
    const validSetup = playersSetup.map((item, idx) => ({
      name: item.name.trim() || (item.isBot ? `Bot AI ${idx}` : `Người chơi ${idx + 1}`),
      isBot: Boolean(item.isBot)
    }));
    setupGame(validSetup);
  };

  return (
    <div className="card join-form-card">
      <div className="card-header">
        <Users className="icon-main" />
        <h2>Thiết Lập Ván Cờ Monopoly Xuyên Việt (Lobby)</h2>
      </div>

      <form onSubmit={handleSubmit} className="join-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Dropdown chọn số người chơi */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '0.8rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '0.5rem' }}>
          <label style={{ fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
            <Users size={18} color="#0284c7" /> Chọn quy mô bàn đấu:
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[2, 3, 4].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setPlayerCount(count)}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: '8px',
                  border: playerCount === count ? '2px solid #0284c7' : '1px solid #cbd5e1',
                  background: playerCount === count ? '#e0f2fe' : '#ffffff',
                  color: playerCount === count ? '#0369a1' : '#64748b',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {count} Người
              </button>
            ))}
          </div>
        </div>

        {/* Danh sách các dòng thiết lập người chơi */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {playersSetup.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.8rem',
                background: item.isBot ? '#f1f5f9' : '#eff6ff',
                padding: '0.6rem 0.9rem',
                borderRadius: '8px',
                border: item.isBot ? '1px solid #e2e8f0' : '1px solid #bfdbfe',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: '85px', fontWeight: 600, color: item.isBot ? '#64748b' : '#1d4ed8' }}>
                {item.isBot ? <Bot size={18} /> : <User size={18} />}
                <span>Vị trí #{idx + 1}</span>
              </div>

              <input
                type="text"
                value={item.name}
                onChange={(e) => handleNameChange(idx, e.target.value)}
                placeholder={`Tên vị trí #${idx + 1}...`}
                maxLength={20}
                style={{
                  flex: 1,
                  padding: '0.45rem 0.7rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  background: '#ffffff'
                }}
                disabled={!isConnected}
              />

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#475569', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={item.isBot}
                  onChange={(e) => handleBotChange(idx, e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                Là Máy (Bot)
              </label>
            </div>
          ))}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={!isConnected}
          style={{
            width: '100%',
            padding: '0.85rem',
            fontSize: '1.05rem',
            fontWeight: 700,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.6rem',
            borderRadius: '10px',
            boxShadow: '0 4px 6px -1px rgba(2, 132, 199, 0.3)',
            marginTop: '0.5rem',
            cursor: 'pointer'
          }}
        >
          <Play size={20} />
          <span>Tạo Ván Cờ & Bắt Đầu Ngay</span>
        </button>

        {!isConnected && (
          <p className="connection-warning" style={{ textAlign: 'center', color: '#e11d48', fontWeight: 600, fontSize: '0.85rem' }}>
            ⚠️ Đang kết nối tới máy chủ Socket.io (Port 3000)...
          </p>
        )}
      </form>
    </div>
  );
}
