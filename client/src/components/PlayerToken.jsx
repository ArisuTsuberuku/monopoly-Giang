import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { getTileCoordinates } from './Board';
import { Html } from '@react-three/drei';
import gsap from 'gsap';

// Bảng màu rực rỡ dành cho Token người chơi (Greyboxing)
export const TOKEN_COLORS = [
  '#ef4444', // Đỏ
  '#3b82f6', // Xanh dương
  '#eab308', // Vàng
  '#a855f7', // Tím
  '#06b6d4', // Cyan
  '#ec4899', // Hồng
  '#10b981', // Xanh lá
  '#f97316'  // Cam
];

/**
 * Component render 1 Token nhân vật bằng CylinderGeometry và hoạt ảnh GSAP
 */
export function PlayerToken({ player, index, totalPlayers }) {
  const meshRef = useRef(null);
  const myPlayerId = useGameStore((state) => state.myPlayerId);
  const currentTurnPlayerId = useGameStore((state) => state.currentTurnPlayerId);

  const isMe = player.id === myPlayerId;
  const isMyTurn = player.id === currentTurnPlayerId;
  const color = TOKEN_COLORS[index % TOKEN_COLORS.length];

  // Tính toán tọa độ đích trên bàn cờ dựa vào vị trí hiện tại
  useEffect(() => {
    if (!meshRef.current) return;

    const targetCoords = getTileCoordinates(player.position);
    // Độ lệch theo bán kính (offset) để nhiều người cùng đứng 1 ô không bị chồng lấp
    const angle = (index * Math.PI * 2) / Math.max(1, totalPlayers);
    const offsetX = Math.cos(angle) * 0.22;
    const offsetZ = Math.sin(angle) * 0.22;

    const posX = targetCoords.x ?? targetCoords.position[0];
    const posY = targetCoords.y ?? targetCoords.position[1];
    const posZ = targetCoords.z ?? targetCoords.position[2];
    const targetX = posX + offsetX;
    const targetZ = posZ + offsetZ;
    const targetY = posY + targetCoords.size[1] / 2 + 0.4; // Nằm sát mặt trên của ô đất

    // Dùng GSAP tạo hiệu ứng nhảy lên và lướt mượt mà đến vị trí mới
    gsap.to(meshRef.current.position, {
      x: targetX,
      y: targetY + 1.1, // Nhảy lên cao trong lúc di chuyển
      z: targetZ,
      duration: 0.55,
      ease: 'power2.out',
      onComplete: () => {
        if (meshRef.current) {
          gsap.to(meshRef.current.position, {
            y: targetY,
            duration: 0.25,
            ease: 'bounce.out'
          });
        }
      }
    });
  }, [player.position, index, totalPlayers]);

  return (
    <group ref={meshRef}>
      {/* Khối trụ đại diện Token người chơi (CylinderGeometry) */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.26, 0.8, 32]} />
        <meshStandardMaterial
          color={color}
          roughness={0.2}
          metalness={0.6}
          emissive={isMyTurn ? color : '#000000'}
          emissiveIntensity={isMyTurn ? 0.4 : 0}
        />
      </mesh>

      {/* Khối nón nhỏ trên đỉnh Token */}
      <mesh position={[0, 0.52, 0]} castShadow>
        <coneGeometry args={[0.24, 0.32, 32]} />
        <meshStandardMaterial color={isMe ? '#ffffff' : color} roughness={0.3} metalness={0.5} />
      </mesh>

      {/* Vòng sáng viền dưới nếu đang trong lượt đi */}
      {isMyTurn && (
        <mesh position={[0, -0.38, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 0.42, 32]} />
          <meshBasicMaterial color={color} side={2} />
        </mesh>
      )}

      {/* Bảng tên HTML floating nhô lên trên Token */}
      <Html position={[0, 1.35, 0]} center distanceFactor={22}>
        <div
          style={{
            background: isMe ? 'rgba(6, 182, 212, 0.9)' : 'rgba(15, 23, 42, 0.85)',
            color: '#ffffff',
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            border: isMyTurn ? `2px solid ${color}` : '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
            pointerEvents: 'none'
          }}
        >
          {player.name} {isMe && '⭐'}
          {player.inJail && ' 🚨'}
        </div>
      </Html>
    </group>
  );
}

/**
 * Component cha quản lý và render toàn bộ Token người chơi trong ván cờ
 */
export default function PlayerTokens() {
  const players = useGameStore((state) => state.players);

  return (
    <group name="monopoly-player-tokens">
      {players.map((player, idx) => (
        <PlayerToken key={player.id} player={player} index={idx} totalPlayers={players.length} />
      ))}
    </group>
  );
}
