import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import Board, { getTileCoordinates } from './Board';
import PlayerTokens from './PlayerToken';

/**
 * Component Dual/Tri-State Follow Camera: Lobby (toàn cảnh), Moving (Over-The-Shoulder), Stopped (Góc chéo 45 độ y=5.5 cận cảnh thấy rõ texture)
 */
function FollowCamera() {
  const { camera, controls } = useThree();
  const isTokenAnimating = useGameStore((state) => state.isTokenAnimating);
  const gameStatus = useGameStore((state) => state.gameStatus);
  const hasJoined = useGameStore((state) => state.hasJoined);
  const cameraFocusPos = useGameStore((state) => state.cameraFocusPos);

  // Tính toán các hướng
  const centerDir = new THREE.Vector3(cameraFocusPos[0], 0, cameraFocusPos[2]).normalize();
  if (centerDir.lengthSq() === 0) centerDir.set(0, 0, 1);
  const up = new THREE.Vector3(0, 1, 0);
  const forwardDir = new THREE.Vector3().crossVectors(centerDir, up).normalize();

  const vecTarget = new THREE.Vector3();
  const vecCamera = new THREE.Vector3();

  // 1. TRẠNG THÁI LOBBY / IDLE (Chưa bắt đầu game)
  if (!hasJoined || gameStatus === 'waiting') {
    vecTarget.set(0, 0, 0); // Nhìn thẳng vào tâm bàn cờ
    vecCamera.set(0, 14, 20); // Góc chéo từ trên cao, bao quát toàn bộ sa bàn
  } 
  // 2. TRẠNG THÁI MOVING (Đang di chuyển)
  else if (isTokenAnimating) {
    vecTarget.set(cameraFocusPos[0] + forwardDir.x * 2, cameraFocusPos[1] + 1, cameraFocusPos[2] + forwardDir.z * 2);
    vecCamera.set(
      cameraFocusPos[0] - forwardDir.x * 5 + centerDir.x * 2,
      cameraFocusPos[1] + 7,
      cameraFocusPos[2] - forwardDir.z * 5 + centerDir.z * 2
    );
  } 
  // 3. TRẠNG THÁI STOPPED (Đứng im tại ô)
  else {
    // NÂNG CAO GÓC NHÌN ĐỂ THẤY RÕ TEXTURE Ô ĐẤT
    vecTarget.set(cameraFocusPos[0] - centerDir.x * 1.5, cameraFocusPos[1] + 0.5, cameraFocusPos[2] - centerDir.z * 1.5);
    vecCamera.set(
      cameraFocusPos[0] + centerDir.x * 6.5, 
      cameraFocusPos[1] + 5.5, // TĂNG LÊN 5.5 ĐỂ NHÌN CHÉO XUỐNG 45 ĐỘ
      cameraFocusPos[2] + centerDir.z * 6.5
    );
  }

  useFrame((state, delta) => {
    if (controls) {
      const lerpSpeed = (!hasJoined || gameStatus === 'waiting') ? 1.0 : (isTokenAnimating ? 2.5 : 1.5);
      controls.target.lerp(vecTarget, lerpSpeed * delta);
      camera.position.lerp(vecCamera, lerpSpeed * delta);
      controls.update();
    }
  });
  return null;
}

/**
 * Component chứa vùng không gian 3D WebGL (Canvas R3F + OrbitControls + Light Diorama Theme + DPR Sharpness)
 */
export default function Scene3D() {
  const controlsRef = useRef(null);
  const players = useGameStore((state) => state.players);
  const currentTurnPlayerId = useGameStore((state) => state.currentTurnPlayerId);
  const activePropertyModal = useGameStore((state) => state.activePropertyModal);

  // Xác định vị trí đích cần bám đuổi (ô cờ người chơi đang đứng hoặc ô đang mở modal thẻ đất)
  const activePlayer = players.find((p) => p.id === currentTurnPlayerId);
  const focusTileId = activePropertyModal && typeof activePropertyModal.tileId === 'number'
    ? activePropertyModal.tileId
    : (activePlayer?.position ?? 0);

  const targetCoords = getTileCoordinates(focusTileId);
  const targetPos = [
    targetCoords.x ?? targetCoords.position[0],
    targetCoords.y ?? targetCoords.position[1],
    targetCoords.z ?? targetCoords.position[2]
  ];

  return (
    <div className="scene-3d-wrapper" style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas
        className="w-full h-full block"
        style={{ width: '100vw', height: '100vh', display: 'block' }}
        shadows
        dpr={[1, 2]} // Khử răng cưa tối đa và sắc nét trên màn hình Retina / High DPI
        camera={{ position: [0, 4, 12], fov: 35, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#bae6fd']} /> {/* Màu sky-200 */}
        {/* Hệ thống ánh sáng ban ngày Diorama tươi sáng rực rỡ */}
        <ambientLight intensity={1.2} color="#f8fafc" />
        <directionalLight
          position={[10, 15, 10]}
          intensity={1.8}
          color="#ffffff"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-28}
          shadow-camera-right={28}
          shadow-camera-top={28}
          shadow-camera-bottom={-28}
        />
        <pointLight position={[-20, 20, -20]} intensity={0.6} color="#38bdf8" />

        {/* Dynamic Follow Camera tự động bám đuổi Token */}
        <FollowCamera />

        <Suspense fallback={null}>
          <Board />
          <PlayerTokens />
        </Suspense>

        {/* OrbitControls giúp người chơi điều khiển góc nhìn tự do với thông số Ultra-Cinematic */}
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping={true}
          dampingFactor={0.05} // Xoay mượt hơn
          maxPolarAngle={Math.PI / 2.05} // Ép góc nhìn sát mặt bàn (gần 90 độ ngang)
          minPolarAngle={Math.PI / 8}
          minDistance={2} // Cho phép zoom dí sát vào Token/Nhà
          maxDistance={25}
        />
      </Canvas>

      {/* Hướng dẫn điều khiển camera nhanh cho người dùng (Light Theme) */}
      <div className="camera-hint">
        <span>🖱️ Chuột trái: Xoay bàn cờ | 🖱️ Cuộn chuột: Zoom | 🖱️ Chuột phải: Di chuyển tâm</span>
      </div>
    </div>
  );
}
