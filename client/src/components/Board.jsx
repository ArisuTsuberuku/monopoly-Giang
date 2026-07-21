import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Text } from '@react-three/drei';
import TilePreset from './TilePreset';

export const TILE_W = 1.0;
export const TILE_H = 1.6;
export const CORNER_SIZE = 2.0;

/**
 * Thuật toán Toán học Ma trận (Grid Math - Flush Outer Edges):
 * Chuyển đổi chỉ số mảng 1 chiều (0-55) thành tọa độ 3D (X, Y=0, Z), góc xoay khối 3D (rotation) và góc xoay nhãn chữ (textRotation).
 * Mép ngoài của TẤT CẢ các ô (cả ô góc và ô thường) thẳng hàng với nhau tại X = ±10.5 và Z = ±6.5.
 * Các ô góc nhô lẹm sâu vào phía trong lõi bàn cờ (kích thước 2.0 x 0.4 x 2.0, rotation: [0, 0, 0]).
 */
export function getTileCoordinates(index, tileId) {
  const sizeNormal = [1.0, 0.4, 1.6];
  const sizeCorner = [2.0, 0.4, 2.0];

  // 1. Góc Trái-Trên (Top-Left)
  if (index === 0) return { position: [-9.5, 0, -5.5], rotation: [0, 0, 0], size: sizeCorner, textRotation: [-Math.PI / 2, 0, -Math.PI * 3 / 4] };
  
  // 2. Cạnh Trên (Top Edge: index 1 -> 17)
  if (index >= 1 && index <= 17) return { position: [-8.0 + (index - 1) * 1.0, 0, -5.7], rotation: [0, Math.PI, 0], size: sizeNormal, textRotation: [-Math.PI / 2, 0, Math.PI] };
  
  // 3. Góc Phải-Trên (Top-Right)
  if (index === 18) return { position: [9.5, 0, -5.5], rotation: [0, 0, 0], size: sizeCorner, textRotation: [-Math.PI / 2, 0, Math.PI * 3 / 4] };
  
  // 4. Cạnh Phải (Right Edge: index 19 -> 27)
  if (index >= 19 && index <= 27) return { position: [9.7, 0, -4.0 + (index - 19) * 1.0], rotation: [0, -Math.PI / 2, 0], size: sizeNormal, textRotation: [-Math.PI / 2, 0, -Math.PI / 2] };
  
  // 5. Góc Phải-Dưới (Bottom-Right)
  if (index === 28) return { position: [9.5, 0, 5.5], rotation: [0, 0, 0], size: sizeCorner, textRotation: [-Math.PI / 2, 0, Math.PI / 4] };
  
  // 6. Cạnh Dưới (Bottom Edge: index 29 -> 45)
  if (index >= 29 && index <= 45) return { position: [8.0 - (index - 29) * 1.0, 0, 5.7], rotation: [0, 0, 0], size: sizeNormal, textRotation: [-Math.PI / 2, 0, 0] };
  
  // 7. Góc Trái-Dưới (Bottom-Left)
  if (index === 46) return { position: [-9.5, 0, 5.5], rotation: [0, 0, 0], size: sizeCorner, textRotation: [-Math.PI / 2, 0, -Math.PI / 4] };
  
  // 8. Cạnh Trái (Left Edge: index 47 -> 55)
  if (index >= 47 && index <= 55) return { position: [-9.7, 0, 4.0 - (index - 47) * 1.0], rotation: [0, Math.PI / 2, 0], size: sizeNormal, textRotation: [-Math.PI / 2, 0, Math.PI / 2] };

  // Fallback an toàn
  return { position: [0, 0, 0], rotation: [0, 0, 0], size: sizeNormal, textRotation: [-Math.PI / 2, 0, 0] };
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
      {/* Khối mặt bàn gỗ chuẩn kích thước theo yêu cầu: args={[17.8, 0.2, 9.8]} */}
      <mesh position={[0, -0.1, 0]} receiveShadow castShadow>
        <boxGeometry args={[17.8, 0.2, 9.8]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.9} metalness={0.08} />
      </mesh>

      {/* Sân nỉ Diorama sáng sang trọng nằm trên mặt gỗ trung tâm */}
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[17.4, 0.02, 9.4]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.65} metalness={0.05} />
      </mesh>
      
      {/* Khối đế gỗ Diorama bên dưới toàn bộ bàn cờ giúp tạo độ cao sang trọng */}
      <mesh position={[0, -0.35, 0]} receiveShadow>
        <boxGeometry args={[21.4, 0.35, 13.4]} />
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
