import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { UserPlus, Sparkles, Users, Play, Bot, User } from 'lucide-react';

/**
 * Component form thiết lập ván cờ (Chọn số người chơi 2-4, nhập tên và chọn Ai là Bot theo Local Multiplayer)
 */
export default function JoinForm() {
  const [menuView, setMenuView] = useState('main'); // 'main' hoặc 'settings'
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

  const handleStartGame = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!isConnected) return;
    const validSetup = playersSetup.map((item, idx) => ({
      name: item.name.trim() || (item.isBot ? `Bot AI ${idx}` : `Người chơi ${idx + 1}`),
      isBot: Boolean(item.isBot)
    }));
    setupGame(validSetup);
  };

  return (
    <div className="w-96 flex flex-col gap-6 p-8 rounded-3xl bg-white/20 backdrop-blur-md shadow-2xl border border-white/40 text-slate-900">
      {menuView === 'main' ? (
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-blue-600 drop-shadow-sm mb-1">CỜ TỶ PHÚ</h1>
            <p className="text-sm font-semibold text-slate-700 uppercase tracking-widest">Xuyên Việt 3D</p>
          </div>

          <div className="flex flex-col gap-4 mt-2">
            <button
              type="button"
              onClick={handleStartGame}
              disabled={!isConnected}
              className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg shadow-lg shadow-blue-500/30 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer"
            >
              <Play size={22} className="fill-current" />
              <span>▶ BẮT ĐẦU CHƠI</span>
            </button>

            <button
              type="button"
              onClick={() => setMenuView('settings')}
              className="w-full py-3.5 px-6 rounded-2xl bg-white/80 hover:bg-white text-slate-800 font-bold text-base shadow-md border border-white/60 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <span>⚙ CÀI ĐẶT</span>
            </button>
          </div>

          {!isConnected && (
            <p className="text-center text-rose-600 font-semibold text-xs mt-2">
              ⚠️ Đang kết nối tới máy chủ Socket.io...
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-slate-300/60 pb-3">
            <h2 className="text-xl font-bold text-slate-900">⚙ Cài Đặt Ván Cờ</h2>
            <button
              type="button"
              onClick={() => setMenuView('main')}
              className="text-sm font-bold text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1"
            >
              🔙 QUAY LẠI
            </button>
          </div>

          <form onSubmit={handleStartGame} className="flex flex-col gap-4">
            {/* Dropdown chọn số người chơi */}
            <div className="flex items-center justify-between bg-white/70 p-3 rounded-xl border border-white/60 flex-wrap gap-2">
              <label className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                <Users size={18} className="text-blue-600" /> Quy mô bàn:
              </label>
              <div className="flex gap-1.5">
                {[2, 3, 4].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setPlayerCount(count)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      playerCount === count
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {count} Người
                  </button>
                ))}
              </div>
            </div>

            {/* Danh sách các dòng thiết lập người chơi */}
            <div className="flex flex-col gap-2 max-h-[30vh] overflow-y-auto pr-1">
              {playersSetup.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                    item.isBot ? 'bg-slate-100/90 border-slate-200' : 'bg-blue-50/90 border-blue-200'
                  }`}
                >
                  <div className={`flex items-center gap-1 min-w-[75px] font-bold text-xs ${item.isBot ? 'text-slate-600' : 'text-blue-700'}`}>
                    {item.isBot ? <Bot size={16} /> : <User size={16} />}
                    <span>#{idx + 1}</span>
                  </div>

                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleNameChange(idx, e.target.value)}
                    placeholder={`Vị trí #${idx + 1}...`}
                    maxLength={20}
                    className="flex-1 py-1 px-2 rounded-lg border border-slate-300 text-xs font-medium bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={!isConnected}
                  />

                  <label className="flex items-center gap-1 cursor-pointer text-xs font-semibold text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={item.isBot}
                      onChange={(e) => handleBotChange(idx, e.target.checked)}
                      className="w-3.5 h-3.5 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-0"
                    />
                    Bot
                  </label>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={!isConnected}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all mt-1 cursor-pointer disabled:opacity-50"
            >
              <Play size={18} />
              <span>Lưu & Bắt Đầu Chơi</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
