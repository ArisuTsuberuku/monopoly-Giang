import React, { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import JoinForm from './components/JoinForm';
import PlayerList from './components/PlayerList';
import ActionButtons from './components/ActionButtons';
import LogPanel from './components/LogPanel';
import Scene3D from './components/Scene3D';
import PropertyCardModal from './components/PropertyCardModal';
import { Radio, Wifi, WifiOff, Landmark } from 'lucide-react';
import './App.css';

/**
 * Giao diện chính App 3D Monopoly Xuyên Việt (Authoritative Server Client + WebGL R3F)
 * Giai đoạn 3: Light Theme Diorama & Cinematic Camera
 */
export default function App() {
  const connectSocket = useGameStore((state) => state.connectSocket);
  const isConnected = useGameStore((state) => state.isConnected);
  const myPlayerId = useGameStore((state) => state.myPlayerId);
  const status = useGameStore((state) => state.status);

  useEffect(() => {
    connectSocket();
  }, [connectSocket]);

  return (
    <div className="app-container">
      {/* --- HEADER --- */}
      <header className="app-header">
        <div className="header-brand">
          <div className="logo-badge">
            <Landmark className="logo-icon" size={28} />
          </div>
          <div>
            <h1 className="brand-title">Monopoly Xuyên Việt 3D</h1>
            <p className="brand-subtitle">Giai đoạn 7: Pure 2D Property Modal &amp; ROKR Landmark Flags</p>
          </div>
        </div>

        <div className="header-status">
          <div className={`status-badge ${isConnected ? 'status-connected' : 'status-disconnected'}`}>
            {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
            <span>{isConnected ? 'Connected to Authoritative Server' : 'Disconnected (Port 3000)'}</span>
          </div>
          {myPlayerId && (
            <div className="player-id-badge">
              <Radio size={14} />
              <span>Socket ID: {myPlayerId.slice(0, 6)}...</span>
            </div>
          )}
          <div className={`game-state-badge badge-${status}`}>
            {status === 'waiting' ? '⏳ Chờ bắt đầu' : '🔥 Đang diễn ra'}
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT GRID (3D SCENE + UI PANELS) --- */}
      <main className="main-grid-3d">
        {/* Cột trái: Form gia nhập & Bảng điều khiển hành động & Danh sách người chơi */}
        <div className="ui-sidebar left-sidebar">
          <JoinForm />
          <ActionButtons />
          <PlayerList />
        </div>

        {/* Cột giữa: Bàn cờ 3D R3F Canvas */}
        <div className="scene-container">
          <Scene3D />
        </div>

        {/* Cột phải: Khung nhật ký tường thuật thời gian thực */}
        <div className="ui-sidebar right-sidebar">
          <LogPanel />
        </div>
      </main>

      {/* Thẻ đất 2D Overlay tách biệt khỏi không gian 3D */}
      <PropertyCardModal />

      {/* --- FOOTER --- */}
      <footer className="app-footer">
        <p>
          &copy; 2026 Monopoly Xuyên Việt Studio &bull; Tuân thủ tuyệt đối quy tắc <strong>SERVER IS KING &amp; GREYBOXING</strong> &bull; Node.js Authoritative Server (Port 3000)
        </p>
      </footer>
    </div>
  );
}
