import React, { useState, useEffect, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { useTexture, Text } from '@react-three/drei';
import { TOKEN_COLORS } from './PlayerToken';
import boardTiles from '../../../data/board.json';

export const TILES = boardTiles;

const FALLBACK_COLORS = {
  // Theo Group (Đất thường)
  light_green: '#4ade80', dark_green: '#16a34a',
  yellow: '#facc15', orange: '#f97316',
  red: '#ef4444', cyan: '#06b6d4',
  blue: '#3b82f6', magenta: '#d946ef', purple: '#a855f7',
  // Theo Type (Các ô chức năng không có group)
  airport: '#0ea5e9',   // Xanh da trời đậm (Sân bay)
  utility: '#fbbf24',   // Vàng đồng (Điểm cực)
  tax: '#f87171',       // Đỏ nhạt (Thuế)
  chance: '#c084fc',    // Tím nhạt (Cơ hội)
  chest: '#f472b6',     // Hồng nhạt (Khí vận)
  jail: '#ea580c',      // Cam sậm (Thăm tù)
  go_to_jail: '#ea580c',// Cam sậm (Vào tù)
  parking: '#14b8a6',   // Xanh ngọc (Bãi đỗ xe)
  go: '#22c55e'         // Xanh lá (Khởi hành)
};

// Cấu hình xoay Texture (Sử dụng Math.PI / 2, Math.PI, v.v...)
export const TEXTURE_SETTINGS = {
  // Ví dụ chỉnh sửa: 
  // 0: { rotation: Math.PI / 2, offsetX: 0.1, offsetY: -0.05, repeatX: 1, repeatY: 1 }
  0: { rotation: 0 },
  19: { rotation: Math.PI },
  20: { rotation: Math.PI },
  21: { rotation: Math.PI },
  22: { rotation: Math.PI },
  23: { rotation: Math.PI },
  24: { rotation: Math.PI },
  25: { rotation: Math.PI },
  26: { rotation: Math.PI },
  27: { rotation: Math.PI },
  47: { rotation: -Math.PI },
  48: { rotation: -Math.PI },
  49: { rotation: -Math.PI },
  50: { rotation: -Math.PI },
  51: { rotation: -Math.PI },
  52: { rotation: -Math.PI },
  53: { rotation: -Math.PI },
  54: { rotation: -Math.PI },
  55: { rotation: -Math.PI }
};

class TextureErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error) {
    console.warn(`[R3F Missing] Không tìm thấy: ${this.props.url}`);
    if (this.props.onFail) this.props.onFail();
  }
  render() {
    if (this.state.hasError) {
      return <meshStandardMaterial attach="material-2" color={this.props.fallbackColor} roughness={0.5} />;
    }
    return this.props.children;
  }
}

function TopFaceMaterial({ url, config, onSuccess }) {
  const texture = useTexture(url);

  const cloned = useMemo(() => {
    const t = texture.clone();
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.center.set(0.5, 0.5);
    t.rotation = config.rotation || 0;
    if (config.offsetX !== undefined || config.offsetY !== undefined) {
      t.offset.set(config.offsetX || 0, config.offsetY || 0);
    }
    if (config.repeatX !== undefined || config.repeatY !== undefined) {
      t.repeat.set(config.repeatX || 1, config.repeatY || 1);
    }
    t.needsUpdate = true;
    return t;
  }, [texture, config]);

  // Gọi callback khi render thành công
  useEffect(() => {
    if (onSuccess) onSuccess();
  }, [onSuccess]);

  return <meshStandardMaterial attach="material-2" map={cloned} color="#ffffff" roughness={0.5} transparent={true} alphaTest={0.05} />;
}

/**
 * Component quản lý ô đất (Auto-Texture Mapping với BoxGeometry & Graceful Degradation)
 */
export default function TilePreset({ tileData }) {
  const { tile, coords, tileColor: propTileColor, isMortgaged, players = [], properties = {} } = tileData;
  const tileColor = tile?.group ? FALLBACK_COLORS[tile.group] : (FALLBACK_COLORS[tile?.type] || propTileColor || '#cbd5e1');

  // ĐẢM BẢO đọc state sở hữu và level chuẩn xác theo tile.id, tuyệt đối không dùng index của mảng
  const tileId = tile?.id !== undefined ? tile.id : 0;
  const propState = properties[tileId] || {};
  const ownerId = propState.ownerId || tileData.ownerId;
  const currentLevel = Number(propState.level) || 0;

  const ownerIdx = players.findIndex((p) => p.id === ownerId);
  const ownerColor = ownerIdx >= 0 ? TOKEN_COLORS[ownerIdx % TOKEN_COLORS.length] : '#0284c7';
  const ownerName = ownerIdx >= 0 ? players[ownerIdx].name : '';

  const [textureStatus, setTextureStatus] = useState('loading'); // 'loading', 'success', 'failed'

  const normalizedFileName = tile?.name ? tile.name.normalize('NFC') : '';
  const url = encodeURI(`/texture/${normalizedFileName}.webp`);
  const config = TEXTURE_SETTINGS[tile?.id] || {};

  const pos = coords.position || [coords.x, coords.y, coords.z];
  const rot = coords.rotation || [0, 0, 0];
  const size = coords.size || [1.0, 0.4, 1.6];

  return (
    <group position={pos} rotation={rot}>
      <mesh receiveShadow castShadow>
        <boxGeometry args={size} />
        {/* Render 5 mặt viền màu gỗ */}
        {[0, 1, 3, 4, 5].map((i) => (
          <meshStandardMaterial key={i} attach={`material-${i}`} color="#8b5a2b" roughness={0.8} />
        ))}

        <TextureErrorBoundary url={url} fallbackColor={tileColor} onFail={() => setTextureStatus('failed')}>
          <Suspense fallback={<meshStandardMaterial attach="material-2" color={tileColor} roughness={0.5} />}>
            <TopFaceMaterial url={url} config={config} onSuccess={() => setTextureStatus('success')} />
          </Suspense>
        </TextureErrorBoundary>
      </mesh>

      {/* Chỉ hiện Fallback Text nếu Texture bị lỗi 404 */}
      {textureStatus === 'failed' && (
        <Text
          position={[0, size[1] / 2 + 0.01, 0]}
          rotation={coords.textRotation || [-Math.PI / 2, 0, 0]}
          fontSize={size[0] > 1.4 ? 0.28 : 0.20}
          color={tileColor === '#ffffff' || tileColor === '#f8fafc' || tileColor === '#cbd5e1' ? '#0f172a' : '#ffffff'}
          anchorX="center"
          anchorY="middle"
          textAlign="center"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          {`${tile?.name || ''}\n(#${tileId})`}
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
