import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Text } from '@react-three/drei';
import TilePreset from './TilePreset';

/**
 * Thuật toán Toán học Ma trận (Grid Math):
 * Chuyển đổi chỉ số mảng 1 chiều (0-55) thành tọa độ 3D (X, Y=0, Z)
 * Viền quanh hình chữ nhật tỷ lệ 16:9 với cạnh ngang 19 ô (17 lõi + 2 góc) và cạnh dọc 11 ô (9 lõi + 2 góc).
 * 
 * Các góc cố định tại chỉ số:
 * - Góc 1 (Khởi Hành): id = 0 -> (X = +18.5, Z = +10.5)
 * - Góc 2 (Góc Dưới Trái): id = 18 -> (X = -18.5, Z = +10.5)
 * - Góc 3 (Bãi Đỗ Xe): id = 28 -> (X = -18.5, Z = -10.5)
 * - Góc 4 (Góc Trên Phải): id = 46 -> (X = +18.5, Z = -10.5)
 */
export function getTileCoordinates(index) {
  const i = Number(index) || 0;

  // Góc 0: Khởi Hành (Top-Left Corner) -> (-9.3, 0, -5.3), xoay -Math.PI*3/4
  if (i === 0) {
    return { x: -9.3, y: 0, z: -5.3, position: [-9.3, 0, -5.3], size: [1.6, 0.4, 1.6], rotation: [0, -Math.PI * 3 / 4, 0] };
  }
  // Cạnh trên (Top Edge): từ i = 1 đến 17 (rotation: [0, Math.PI, 0] - Chữ hướng ra Top)
  if (i >= 1 && i <= 17) {
    const x = -8.0 + (i - 1) * 1.0;
    return {
      x, y: 0, z: -5.3,
      position: [x, 0, -5.3],
      size: [1.0, 0.4, 1.6],
      rotation: [0, Math.PI, 0]
    };
  }
  // Góc 18: Góc Trên Phải (Top-Right Corner) -> (9.3, 0, -5.3), xoay Math.PI*3/4
  if (i === 18) {
    return { x: 9.3, y: 0, z: -5.3, position: [9.3, 0, -5.3], size: [1.6, 0.4, 1.6], rotation: [0, Math.PI * 3 / 4, 0] };
  }
  // Cạnh phải (Right Edge): từ i = 19 đến 27 (rotation: [0, -Math.PI / 2, 0] - Chữ hướng ra Right)
  if (i >= 19 && i <= 27) {
    const z = -4.0 + (i - 19) * 1.0;
    return {
      x: 9.3, y: 0, z,
      position: [9.3, 0, z],
      size: [1.0, 0.4, 1.6],
      rotation: [0, -Math.PI / 2, 0]
    };
  }
  // Góc 28: Góc Dưới Phải / Bãi Đỗ Xe (Bottom-Right Corner) -> (9.3, 0, 5.3), xoay Math.PI/4
  if (i === 28) {
    return { x: 9.3, y: 0, z: 5.3, position: [9.3, 0, 5.3], size: [1.6, 0.4, 1.6], rotation: [0, Math.PI / 4, 0] };
  }
  // Cạnh dưới (Bottom Edge): từ i = 29 đến 45 (rotation: [0, 0, 0] - Chữ hướng ra Bottom)
  if (i >= 29 && i <= 45) {
    const x = 8.0 - (i - 29) * 1.0;
    return {
      x, y: 0, z: 5.3,
      position: [x, 0, 5.3],
      size: [1.0, 0.4, 1.6],
      rotation: [0, 0, 0]
    };
  }
  // Góc 46: Góc Dưới Trái / Vào Tù (Bottom-Left Corner) -> (-9.3, 0, 5.3), xoay -Math.PI/4
  if (i === 46) {
    return { x: -9.3, y: 0, z: 5.3, position: [-9.3, 0, 5.3], size: [1.6, 0.4, 1.6], rotation: [0, -Math.PI / 4, 0] };
  }
  // Cạnh trái (Left Edge): từ i = 47 đến 55 (rotation: [0, Math.PI / 2, 0] - Chữ hướng ra Left)
  if (i >= 47 && i <= 55) {
    const z = 4.0 - (i - 47) * 1.0;
    return {
      x: -9.3, y: 0, z,
      position: [-9.3, 0, z],
      size: [1.0, 0.4, 1.6],
      rotation: [0, Math.PI / 2, 0]
    };
  }

  return { x: 0, y: 0, z: 0, position: [0, 0, 0], size: [1.0, 0.4, 1.6], rotation: [0, 0, 0] };
}

/**
 * Trả về màu sắc theo bảng màu thiên nhiên/Diorama (Light Theme Greyboxing)
 */
export function getTileColor(tile) {
  if (!tile) return '#e2e8f0';
  switch (tile.type) {
    case 'go':
      return '#22c55e'; // Xanh lá Khởi hành
    case 'parking':
      return '#3b82f6'; // Xanh dương bãi đỗ xe
    case 'jail':
    case 'visit_jail':
    case 'go_to_jail':
      return '#475569'; // Màu xám đậm thẫm cho ô nhà tù
    case 'tax':
    case 'tax_luxury':
      return '#ef4444'; // Đỏ thuế
    case 'chance':
      return '#a855f7'; // Tím Cơ Hội
    case 'chest':
      return '#ec4899'; // Hồng Khí Vận
    case 'airport':
      return '#06b6d4'; // Xanh ngọc Sân bay
    case 'utility':
    case 'extreme_point':
      return '#eab308'; // Vàng Tiện ích
    case 'property':
      switch (tile.group) {
        case 'green': return '#16a34a';
        case 'yellow': return '#eab308';
        case 'magenta':
        case 'pink': return '#d946ef';
        case 'red': return '#dc2626';
        case 'blue': return '#2563eb';
        case 'orange': return '#ea580c';
        case 'cyan': return '#0891b2';
        case 'purple': return '#9333ea';
        case 'brown': return '#854d0e';
        default: return '#94a3b8';
      }
    default:
      return '#cbd5e1';
  }
}

/**
 * Component render 56 ô bàn cờ 3D Monopoly và mặt bàn gỗ Wooden Board trung tâm
 */
export default function Board() {
  const board = useGameStore((state) => state.board);
  const properties = useGameStore((state) => state.properties);
  const players = useGameStore((state) => state.players);

  const tiles = board && board.length > 0
    ? board
    : Array.from({ length: 56 }, (_, idx) => ({ id: idx, name: `Ô #${idx}`, type: 'property' }));

  return (
    <group name="monopoly-board-grid">
      {tiles.map((tile, idx) => {
        const tileId = typeof tile.id === 'number' ? tile.id : idx;
        const coords = getTileCoordinates(tileId);
        const tileColor = getTileColor(tile);
        const propState = properties[tileId];
        const isMortgaged = propState?.isMortgaged;
        const ownerId = propState?.ownerId;

        const tileData = { tile, coords, tileColor, isMortgaged, ownerId, players, properties };

        return <TilePreset key={`tile_${tileId}_${idx}`} tileData={tileData} />;
      })}

      {/* --- WOODEN BOARD (MẶT BÀN GỖ NÂU ẤM TRUNG TÂM LƯỚI 17x9) --- */}
      {/* Khối mặt bàn gỗ chuẩn kích thước theo yêu cầu: args={[17, 0.2, 9]} */}
      <mesh position={[0, -0.05, 0]} receiveShadow castShadow>
        <boxGeometry args={[17, 0.2, 9]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.9} metalness={0.08} />
      </mesh>

      {/* Sân nỉ Diorama sáng sang trọng nằm trên mặt gỗ trung tâm */}
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[16.6, 0.02, 8.6]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.65} metalness={0.05} />
      </mesh>
      
      {/* Khối đế gỗ Diorama bên dưới toàn bộ bàn cờ giúp tạo độ cao sang trọng */}
      <mesh position={[0, -0.35, 0]} receiveShadow>
        <boxGeometry args={[20.6, 0.35, 12.6]} />
        <meshStandardMaterial color="#6b4423" roughness={0.85} metalness={0.1} />
      </mesh>

      {/* Logo Text ở chính giữa mặt bàn */}
      <Text
        position={[0, 0.08, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={1.25}
        color="#0369a1"
        fillOpacity={0.35}
        anchorX="center"
        anchorY="middle"
      >
        MONOPOLY XUYÊN VIỆT 3D
      </Text>
    </group>
  );
}
