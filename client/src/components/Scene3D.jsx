import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import Board, { getTileCoordinates } from './Board';
import PlayerTokens from './PlayerToken';

/**
 * Component Dual-State Follow Camera: Over-The-Shoulder (nhìn từ sau lưng theo forwardDir) vs Stopped (Siêu thấp y=1.2 cận cảnh)
 */
function FollowCamera({ targetPos }) {
  const { camera, controls } = useThree();
  const isTokenAnimating = useGameStore((state) => state.isTokenAnimating);

  // Tính toán các hướng
  const centerDir = new THREE.Vector3(targetPos[0], 0, targetPos[2]).normalize();
  if (centerDir.lengthSq() === 0) centerDir.set(0, 0, 1);
  const up = new THREE.Vector3(0, 1, 0);
  // forwardDir chính là hướng chạy dọc theo mép bàn cờ (Tiếp tuyến)
  const forwardDir = new THREE.Vector3().crossVectors(centerDir, up).normalize();

  const vecTarget = new THREE.Vector3();
  const vecCamera = new THREE.Vector3();

  if (isTokenAnimating) {
    // TRẠNG THÁI MOVING: Over-the-shoulder (Từ sau lưng, nhìn về phía trước)
    // Điểm nhìn: Phía trước Token một chút
    vecTarget.set(targetPos[0] + forwardDir.x * 2, targetPos[1] + 1, targetPos[2] + forwardDir.z * 2);
    // Camera: Lùi ra sau Token, hơi vếch ra ngoài mép, và cao lên
    vecCamera.set(
      targetPos[0] - forwardDir.x * 6 + centerDir.x * 3,
      targetPos[1] + 6,
      targetPos[2] - forwardDir.z * 6 + centerDir.z * 3
    );
  } else {
    // TRẠNG THÁI STOPPED: Cực kỳ sát mặt đất, zoom cận cảnh mặt tiền ô đất
    vecTarget.set(targetPos[0] - centerDir.x * 1, targetPos[1] + 0.5, targetPos[2] - centerDir.z * 1);
    vecCamera.set(
      targetPos[0] + centerDir.x * 5.5, // Gần hơn nữa
      targetPos[1] + 1.2,               // Rất sát mặt đất
      targetPos[2] + centerDir.z * 5.5
    );
  }

  useFrame((state, delta) => {
    if (controls) {
      // Làm mượt chuyển động Camera
      const lerpSpeed = isTokenAnimating ? 2 : 1.5;
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
    <div className="scene-3d-wrapper" style={{ width: '100%', height: '100%', position: 'relative', minHeight: '540px' }}>
      <Canvas
        shadows
        dpr={[1, 2]} // Khử răng cưa tối đa và sắc nét trên màn hình Retina / High DPI
        camera={{ position: [0, 4, 12], fov: 35, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
        style={{ borderRadius: '16px', background: '#e0f2fe' }}
      >
        <color attach="background" args={['#e0f2fe']} />
        {/* Hệ thống ánh sáng ban ngày Diorama tươi sáng */}
        <ambientLight intensity={0.85} color="#f8fafc" />
        <directionalLight
          position={[25, 40, 30]}
          intensity={1.6}
          color="#ffffff"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-28}
          shadow-camera-right={28}
          shadow-camera-top={28}
          shadow-camera-bottom={-28}
        />
        <pointLight position={[-20, 20, -20]} intensity={0.6} color="#38bdf8" />

        {/* Dynamic Follow Camera tự động bám đuổi Token */}
        <FollowCamera targetPos={targetPos} />

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
