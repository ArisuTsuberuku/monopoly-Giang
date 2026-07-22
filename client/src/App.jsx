import React, { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import JoinForm from './components/JoinForm';
import PlayerList from './components/PlayerList';
import ActionButtons from './components/ActionButtons';
import Scene3D from './components/Scene3D';
import PropertyCardModal from './components/PropertyCardModal';
import './App.css';

/**
 * Giao diện chính App 3D Monopoly Xuyên Việt (Fullscreen fixed 3D + HUD Overlays)
 * Giai đoạn 28: Fixed Root Layering & CSS Cleanups
 */
export default function App() {
  const connectSocket = useGameStore((state) => state.connectSocket);
  const hasJoined = useGameStore((state) => state.hasJoined);
  const gameStatus = useGameStore((state) => state.gameStatus || state.status);
  const isTokenAnimating = useGameStore((state) => state.isTokenAnimating);
  const activePropertyModal = useGameStore((state) => state.activePropertyModal);

  useEffect(() => {
    connectSocket();
  }, [connectSocket]);

  // Debug log để kiểm tra state
  console.log("HUD State - hasJoined:", hasJoined, " | gameStatus:", gameStatus, " | Animating:", isTokenAnimating);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', overflow: 'hidden' }} className="select-none font-sans bg-gradient-to-b from-sky-400 to-sky-100">

      {/* LAYER 0: 3D CANVAS */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <Scene3D />
      </div>

      {/* LAYER 1: HUD WIDGETS */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, pointerEvents: 'none' }}>

        {/* MENU LOBBY (Bên Trái) */}
        {(!hasJoined || gameStatus === 'waiting') && (
          <div style={{ position: 'absolute', left: '3rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'auto', zIndex: 20 }}>
             <JoinForm />
          </div>
        )}

        {/* HUD TRONG GAME (4 Góc & Giữa) */}
        {(hasJoined && (gameStatus === 'playing' || gameStatus === 'started')) && (
          <>
            {/* HUD 4 Góc */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
              <PlayerList />
            </div>

            {/* Nút Hành Động (Giữa Dưới) */}
            <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'auto', zIndex: 20 }}>
              <ActionButtons />
            </div>
          </>
        )}
      </div>

      {/* LAYER 2: MODALS */}
      {activePropertyModal && !isTokenAnimating && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 50, pointerEvents: 'auto' }}>
          <PropertyCardModal />
        </div>
      )}

    </div>
  );
}
