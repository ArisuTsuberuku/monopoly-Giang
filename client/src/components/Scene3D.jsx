import React, { Suspense, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useGameStore } from '../store/gameStore';
import Board, { getTileCoordinates } from './Board';
import PlayerTokens from './PlayerToken';
import gsap from 'gsap';

/**
 * Component điều khiển góc nhìn Cinematic Camera (Monopoly Plus style) bằng GSAP
 */
function CameraController({ controlsRef }) {
  const { camera } = useThree();
  const cinematicTileId = useGameStore((state) => state.cinematicTileId);
  const activePropertyModal = useGameStore((state) => state.activePropertyModal);

  // Ưu tiên zoom vào ô đang mở Modal mua đất, nếu không thì zoom vào ô vừa dừng bước
  const targetTileId = activePropertyModal && typeof activePropertyModal.tileId === 'number'
    ? activePropertyModal.tileId
    : (typeof cinematicTileId === 'number' ? cinematicTileId : null);

  useEffect(() => {
    if (!controlsRef.current) return;

    if (targetTileId !== null && targetTileId >= 0) {
      // Zoom cận cảnh ô đất góc nghiêng ~45 độ (Cinematic Monopoly Plus)
      const coords = getTileCoordinates(targetTileId);
      const camOffsetX = coords.x >= 0 ? 6.5 : -6.5;
      const camOffsetZ = coords.z >= 0 ? 8.5 : -8.5;

      gsap.to(camera.position, {
        x: coords.x + camOffsetX,
        y: 8.0, // Độ cao ~8 đơn vị, góc nhìn nghiêng xuống 45 độ cực kỳ sinh động
        z: coords.z + camOffsetZ,
        duration: 1.3,
        ease: 'power3.inOut'
      });

      gsap.to(controlsRef.current.target, {
        x: coords.x,
        y: 0.6,
        z: coords.z,
        duration: 1.3,
        ease: 'power3.inOut'
      });
    } else {
      // Thu phóng trở về toàn cảnh bao quát bàn cờ 17x9 (17.04 x 10.80)
      gsap.to(camera.position, {
        x: 0,
        y: 18,
        z: 20,
        duration: 1.4,
        ease: 'power3.inOut'
      });

      gsap.to(controlsRef.current.target, {
        x: 0,
        y: 0,
        z: 0,
        duration: 1.4,
        ease: 'power3.inOut'
      });
    }
  }, [targetTileId, camera, controlsRef]);

  return null;
}

/**
 * Component chứa vùng không gian 3D WebGL (Canvas R3F + OrbitControls + Light Diorama Theme + DPR Sharpness)
 */
export default function Scene3D() {
  const controlsRef = useRef(null);

  return (
    <div className="scene-3d-wrapper" style={{ width: '100%', height: '100%', position: 'relative', minHeight: '540px' }}>
      <Canvas
        shadows
        dpr={[1, 2]} // Khử răng cưa tối đa và sắc nét trên màn hình Retina / High DPI
        camera={{ position: [0, 18, 20], fov: 44, near: 0.1, far: 200 }}
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

        {/* Bộ điều khiển góc nhìn tự động Cinematic GSAP */}
        <CameraController controlsRef={controlsRef} />

        <Suspense fallback={null}>
          <Board />
          <PlayerTokens />
        </Suspense>

        {/* OrbitControls giúp người chơi điều khiển góc nhìn tự do */}
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2.1} // Không cho phép lật ngửa dưới mặt đất
          minDistance={8}
          maxDistance={75}
        />
      </Canvas>

      {/* Hướng dẫn điều khiển camera nhanh cho người dùng (Light Theme) */}
      <div className="camera-hint">
        <span>🖱️ Chuột trái: Xoay bàn cờ | 🖱️ Cuộn chuột: Zoom | 🖱️ Chuột phải: Di chuyển tâm</span>
      </div>
    </div>
  );
}
