import React, { Suspense, useState } from 'react';
import { useTexture, Text } from '@react-three/drei';
import { TOKEN_COLORS } from './PlayerToken';

/**
 * Error Boundary chuyên biệt cho R3F Texture / Material loading
 */
class TextureErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    if (this.props.onError) {
      this.props.onError();
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/**
 * Component tải ảnh texture .png cho mặt Top (material-2)
 */
function TopFaceTexture({ tileName, attach = "material-2", isMortgaged }) {
  const texture = useTexture(`/texture/${tileName}.png`);
  return (
    <meshStandardMaterial
      attach={attach}
      map={texture}
      roughness={0.35}
      metalness={0.15}
      opacity={isMortgaged ? 0.4 : 1.0}
      transparent={Boolean(isMortgaged)}
    />
  );
}

/**
 * Component quản lý ô đất (Auto-Texture Mapping với BoxGeometry & Graceful Degradation)
 */
export default function TilePreset({ tileData }) {
  const { tile, coords, tileColor, isMortgaged, players = [], properties = {} } = tileData;

  // ĐẢM BẢO đọc state sở hữu và level chuẩn xác theo tile.id, tuyệt đối không dùng index của mảng
  const tileId = tile?.id !== undefined ? tile.id : 0;
  const propState = properties[tileId] || {};
  const ownerId = propState.ownerId || tileData.ownerId;
  const currentLevel = Number(propState.level) || 0;

  const ownerIdx = players.findIndex((p) => p.id === ownerId);
  const ownerColor = ownerIdx >= 0 ? TOKEN_COLORS[ownerIdx % TOKEN_COLORS.length] : '#0284c7';
  const ownerName = ownerIdx >= 0 ? players[ownerIdx].name : '';

  const pos = coords.position || [coords.x, coords.y, coords.z];
  const rot = coords.rotation || [0, 0, 0];
  const size = coords.size || [1.0, 0.4, 1.6];

  const [textureFailed, setTextureFailed] = useState(false);

  // Material dự phòng (Fallback) cho mặt Top khi ảnh texture chưa có hoặc đang tải
  const fallbackTopMaterial = (
    <meshStandardMaterial
      attach="material-2"
      color={tileColor}
      roughness={0.35}
      metalness={0.15}
      opacity={isMortgaged ? 0.4 : 1.0}
      transparent={Boolean(isMortgaged)}
    />
  );

  return (
    <group position={pos} rotation={rot}>
      {/* Khối nền chính BoxGeometry với 6 mặt (Auto-Texture Mapping) */}
      <mesh receiveShadow castShadow>
        <boxGeometry args={size} />
        {/* Mặt 0: Right (Viền gỗ) */}
        <meshStandardMaterial attach="material-0" color="#8b5a2b" roughness={0.8} metalness={0.1} />
        {/* Mặt 1: Left (Viền gỗ) */}
        <meshStandardMaterial attach="material-1" color="#8b5a2b" roughness={0.8} metalness={0.1} />
        {/* Mặt 2: Top Face (Dán ảnh PNG qua useTexture, nếu lỗi/thiếu thì hiển thị màu tileColor) */}
        <TextureErrorBoundary
          fallback={fallbackTopMaterial}
          onError={() => setTextureFailed(true)}
        >
          <Suspense fallback={fallbackTopMaterial}>
            <TopFaceTexture
              tileName={tile?.name || `tile_${tileId}`}
              isMortgaged={isMortgaged}
            />
          </Suspense>
        </TextureErrorBoundary>
        {/* Mặt 3: Bottom (Viền gỗ) */}
        <meshStandardMaterial attach="material-3" color="#8b5a2b" roughness={0.8} metalness={0.1} />
        {/* Mặt 4: Front (Viền gỗ) */}
        <meshStandardMaterial attach="material-4" color="#8b5a2b" roughness={0.8} metalness={0.1} />
        {/* Mặt 5: Back (Viền gỗ) */}
        <meshStandardMaterial attach="material-5" color="#8b5a2b" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Nhãn chữ hiển thị khi chưa có texture hoặc fallback màu nền (xoay [-Math.PI / 2, 0, 0] để chân chữ hướng ra ngoài) */}
      {textureFailed && (
        <Text
          position={[0, size[1] / 2 + 0.02, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={size[0] > 1.4 ? 0.32 : 0.22}
          color={tileColor === '#ffffff' || tileColor === '#f8fafc' || tileColor === '#cbd5e1' ? '#0f172a' : '#ffffff'}
          anchorX="center"
          anchorY="middle"
          maxWidth={size[0] * 0.9}
          textAlign="center"
        >
          {tile?.name ? `${tile.name}\n(#${tileId})` : `#${tileId}`}
        </Text>
      )}

      {/* --- HIỂN THỊ SỞ HỮU KIỂU "CỜ ROKR & LANDMARK" (BẮT BUỘC MAP BẰNG properties[tileId]) --- */}
      {ownerId && (
        <>
          {/* 1. Con dấu (Flag / ROKR Stamp): Ở góc trên-trái [-0.3, size[1]/2, -0.6] */}
          <group position={[-0.3, size[1] / 2, -0.6]}>
            <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.1, 0.12, 0.06, 16]} />
              <meshStandardMaterial color={ownerColor} roughness={0.3} metalness={0.6} />
            </mesh>
            <mesh position={[0, 0.18, 0]} castShadow>
              <boxGeometry args={[0.03, 0.32, 0.03]} />
              <meshStandardMaterial color="#cbd5e1" roughness={0.4} metalness={0.7} />
            </mesh>
            <mesh position={[0.09, 0.28, 0]} castShadow>
              <boxGeometry args={[0.18, 0.12, 0.02]} />
              <meshStandardMaterial color={ownerColor} roughness={0.2} metalness={0.3} />
            </mesh>
            <Text
              position={[0.09, 0.42, 0]}
              fontSize={0.14}
              color={ownerColor}
              anchorX="center"
              anchorY="bottom"
              outlineWidth={0.015}
              outlineColor="#ffffff"
            >
              {ownerName ? ownerName.substring(0, 8) : 'ROKR'}
            </Text>
          </group>

          {/* 2. Nhà (Level 1-4): Xếp hàng ngang ở góc trên-phải */}
          {currentLevel >= 1 && currentLevel <= 4 && (
            <group position={[0.04, size[1] / 2, -0.6]}>
              {Array.from({ length: currentLevel }).map((_, idx) => (
                <group key={idx} position={[idx * 0.13, 0, 0]}>
                  <mesh position={[0, 0.06, 0]} castShadow>
                    <boxGeometry args={[0.11, 0.12, 0.11]} />
                    <meshStandardMaterial color={ownerColor} roughness={0.3} metalness={0.4} />
                  </mesh>
                  <mesh position={[0, 0.15, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                    <coneGeometry args={[0.09, 0.08, 4]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.3} />
                  </mesh>
                </group>
              ))}
            </group>
          )}

          {/* 3. Landmark (Level 5): Khối Kim tự tháp lớn ngay tâm ô đất */}
          {currentLevel >= 5 && (
            <group position={[0, size[1] / 2, 0]}>
              <mesh position={[0, 0.22, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
                <coneGeometry args={[0.36, 0.45, 4]} />
                <meshStandardMaterial color={ownerColor} roughness={0.2} metalness={0.6} />
              </mesh>
              <mesh position={[0, 0.48, 0]} castShadow>
                <boxGeometry args={[0.15, 0.15, 0.15]} />
                <meshStandardMaterial color="#eab308" roughness={0.1} metalness={0.9} emissive="#ca8a04" emissiveIntensity={0.4} />
              </mesh>
              <Text
                position={[0, 0.65, 0]}
                fontSize={0.18}
                color="#eab308"
                anchorX="center"
                anchorY="bottom"
                outlineWidth={0.02}
                outlineColor="#0f172a"
              >
                ★ LANDMARK ★
              </Text>
            </group>
          )}
        </>
      )}
    </group>
  );
}
