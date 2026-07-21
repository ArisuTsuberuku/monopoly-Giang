import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { getTileCoordinates } from './Board';
import { Html } from '@react-three/drei';
import { useSpring, a } from '@react-spring/three';

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
 * Hook tùy chỉnh lưu lại giá trị của render trước (usePrevious)
 */
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

/**
 * Tính toán tọa độ đích trên ô cờ kèm độ lệch (offset) để nhiều người cùng đứng không bị đè lên nhau
 */
function getOffsetTargetPos(tileIdx, idx, totalCount) {
  const coords = getTileCoordinates(tileIdx);
  const angle = (idx * Math.PI * 2) / Math.max(1, totalCount);
  const offsetX = Math.cos(angle) * 0.18;
  const offsetZ = Math.sin(angle) * 0.18;

  const posX = (coords.x ?? coords.position[0]) + offsetX;
  const posY = (coords.y ?? coords.position[1]) + (coords.size[1] / 2) + 0.16; // Đặt sát mặt trên của ô đất khi thu nhỏ
  const posZ = (coords.z ?? coords.position[2]) + offsetZ;
  return [posX, posY, posZ];
}

/**
 * Component render 1 Token nhân vật nhảy qua từng ô (Hopping Animation) và thu nhỏ 35%
 */
export function PlayerToken({ player, index, totalPlayers }) {
  const myPlayerId = useGameStore((state) => state.myPlayerId);
  const currentTurnPlayerId = useGameStore((state) => state.currentTurnPlayerId);
  const setTokenAnimating = useGameStore((state) => state.setTokenAnimating);

  const isMe = player.id === myPlayerId;
  const isMyTurn = player.id === currentTurnPlayerId;
  const color = TOKEN_COLORS[index % TOKEN_COLORS.length];

  const prevPosition = usePrevious(player.position);
  const initialPos = getOffsetTargetPos(player.position, index, totalPlayers);

  // Khởi tạo Spring động cho phép lập trình chuỗi nhảy (Async Queue)
  const [{ pos }, api] = useSpring(() => ({
    pos: initialPos
  }));

  useEffect(() => {
    // Nếu mới mount hoặc không thay đổi vị trí ô cờ, cập nhật vị trí đích ngay lập tức và mở khóa UI
    if (prevPosition === undefined || prevPosition === player.position) {
      api.start({ pos: getOffsetTargetPos(player.position, index, totalPlayers), immediate: true });
      if (prevPosition !== undefined) {
        setTokenAnimating(false);
      }
      return;
    }

    // Lập mảng path đi vòng quanh bàn cờ (56 ô) từ prevPosition đến player.position
    let steps = (player.position - prevPosition + 56) % 56;
    if (steps === 0 && player.position !== prevPosition) steps = 56;

    const path = [];
    for (let i = 1; i <= steps; i++) {
      path.push((prevPosition + i) % 56);
    }

    if (steps > 0) {
      setTokenAnimating(true); // KHÓA UI
      api.start({
        to: async (next) => {
          for (let i = 0; i < path.length; i++) {
            const targetPos = getOffsetTargetPos(path[i], index, totalPlayers);
            // Nhảy búng lên không trung (Hop up)
            await next({ pos: [targetPos[0], targetPos[1] + 1.1, targetPos[2]], config: { duration: 150 } });
            // Đáp xuống tâm ô cờ tiếp theo (Land down)
            await next({ pos: [targetPos[0], targetPos[1], targetPos[2]], config: { duration: 120 } });
          }
          setTokenAnimating(false); // MỞ KHÓA UI KHI ĐẾN ĐÍCH
        }
      });
    }
  }, [player.position, prevPosition, index, totalPlayers, api, setTokenAnimating]);

  return (
    <a.group position={pos}>
      {/* Thu nhỏ toàn bộ model 3D xuống còn ~35% (scale={[0.35, 0.35, 0.35]}) để vừa vặn lọt thỏm trong ô đất */}
      <group scale={[0.35, 0.35, 0.35]}>
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
      </group>

      {/* Bảng tên HTML floating nhô phía trên Token (đặt ở ngoài group scale để giữ độ sắc nét nhãn chữ) */}
      <Html position={[0, 0.9, 0]} center distanceFactor={18}>
        <div
          style={{
            background: isMe ? 'rgba(6, 182, 212, 0.95)' : 'rgba(15, 23, 42, 0.9)',
            color: '#ffffff',
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            border: isMyTurn ? `2px solid ${color}` : '1px solid rgba(255,255,255,0.25)',
            boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
            pointerEvents: 'none'
          }}
        >
          {player.name} {isMe && '⭐'}
          {player.inJail && ' 🚨'}
        </div>
      </Html>
    </a.group>
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
