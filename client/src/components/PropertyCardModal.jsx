import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { Check, X, ShieldAlert } from 'lucide-react';

/**
 * Hàm lấy mã màu header cho thẻ đất dựa vào thuộc tính group (phục vụ Fallback UI)
 */
function getHeaderColor(group, type) {
  if (type === 'airport') return '#06b6d4';
  if (type === 'utility' || type === 'extreme_point') return '#eab308';
  switch (group) {
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
    default: return '#3b82f6';
  }
}

/**
 * Component Thẻ Đất Pure Image Overlay (Floating Card chuẩn 16:9)
 * Lột bỏ toàn bộ nền trắng, khung viền hay text thừa. Tôn vinh tuyệt đối bức ảnh 16:9 và nút bấm trôi nổi.
 */
export default function PropertyCardModal() {
  const modalData = useGameStore((state) => state.activePropertyModal);
  const board = useGameStore((state) => state.board);
  const players = useGameStore((state) => state.players);
  const properties = useGameStore((state) => state.properties);
  const currentTurnPlayerId = useGameStore((state) => state.currentTurnPlayerId);
  const buyProperty = useGameStore((state) => state.buyProperty);
  const upgradeProperty = useGameStore((state) => state.upgradeProperty);
  const closePropertyModal = useGameStore((state) => state.closePropertyModal);

  const [imgError, setImgError] = useState(false);

  // Khi mở thẻ đất mới (modalData.tileId thay đổi), reset trạng thái lỗi ảnh
  useEffect(() => {
    setImgError(false);
  }, [modalData?.tileId]);

  // Chỉ hiển thị khi có dữ liệu modal hợp lệ từ Authoritative Server
  if (!modalData || typeof modalData.tileId !== 'number') {
    return null;
  }

  const tile = board[modalData.tileId] || {
    name: `Ô đất #${modalData.tileId}`,
    price: modalData.price || 200,
    baseRent: 20,
    upgrades: []
  };

  const activePlayer = players.find((p) => p.id === currentTurnPlayerId);
  const currentMoney = activePlayer?.money || 0;
  const price = typeof modalData.price === 'number' && modalData.price > 0 ? modalData.price : (tile.price || 200);
  const canAfford = currentMoney >= price;
  const headerColor = getHeaderColor(tile.group, tile.type);
  const mode = modalData.mode || 'unowned';

  // Tìm thông tin chủ sở hữu nếu có
  const tileState = properties[modalData.tileId] || {};
  const owner = players.find((p) => p.id === tileState.ownerId);
  const ownerName = owner ? owner.name : 'Chưa có chủ';

  // Kiểm tra chi phí nâng cấp nếu ở mode self_owned
  const currentLevel = modalData.level || 0;
  const nextUpgrade = tile.upgrades && tile.upgrades[currentLevel];
  const canAffordUpgrade = nextUpgrade ? currentMoney >= nextUpgrade.cost : false;

  const normalizedFileName = (tile.name || '').normalize('NFC');
  const imageUrl = encodeURI(`/cards/${normalizedFileName}.webp`);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        padding: '1.5rem',
        animation: 'fadeIn 0.25s ease-out'
      }}
    >
      <div
        className="relative flex flex-col items-center max-w-4xl w-[90%] md:w-[70%]"
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '90%',
          maxWidth: '850px',
          animation: 'bouncePopup 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {/* Tên chủ sở hữu hoặc trạng thái nổi phía trên mép ảnh */}
        {tileState.ownerId ? (
          <div
            className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 text-xs md:text-sm font-bold uppercase tracking-wider rounded-t-lg border-x border-t border-white/50 shadow-[0_-4px_10px_rgba(0,0,0,0.3)] z-10 opacity-95"
            style={{
              position: 'absolute',
              top: '-16px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: '#ffffff',
              padding: '0.25rem 1.25rem',
              borderRadius: '0.5rem 0.5rem 0 0',
              fontWeight: 700,
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              boxShadow: '0 -4px 10px rgba(0,0,0,0.35)',
              borderTop: '1px solid rgba(255, 255, 255, 0.6)',
              borderLeft: '1px solid rgba(255, 255, 255, 0.6)',
              borderRight: '1px solid rgba(255, 255, 255, 0.6)',
              zIndex: 10,
              opacity: 0.95
            }}
          >
            👤 {ownerName}
          </div>
        ) : mode === 'self_owned' ? (
          <div
            className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-1 text-xs md:text-sm font-bold uppercase tracking-wider rounded-t-lg border-x border-t border-white/50 shadow-[0_-4px_10px_rgba(0,0,0,0.3)] z-10 opacity-95"
            style={{
              position: 'absolute',
              top: '-16px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              color: '#ffffff',
              padding: '0.25rem 1.25rem',
              borderRadius: '0.5rem 0.5rem 0 0',
              fontWeight: 700,
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              boxShadow: '0 -4px 10px rgba(0,0,0,0.35)',
              borderTop: '1px solid rgba(255, 255, 255, 0.6)',
              borderLeft: '1px solid rgba(255, 255, 255, 0.6)',
              borderRight: '1px solid rgba(255, 255, 255, 0.6)',
              zIndex: 10,
              opacity: 0.95
            }}
          >
            ⭐ Landmark sở hữu của bạn
          </div>
        ) : null}

        {/* Bức ảnh 16:9 nguyên bản không khung viền */}
        <img
          src={imageUrl}
          alt={tile.name}
          onError={() => setImgError(true)}
          className="w-full aspect-[16/9] object-contain drop-shadow-2xl rounded-xl"
          style={{
            width: '100%',
            aspectRatio: '16 / 9',
            objectFit: 'contain',
            borderRadius: '16px',
            filter: 'drop-shadow(0 25px 35px rgba(0, 0, 0, 0.8))',
            display: imgError ? 'none' : 'block'
          }}
        />

        {/* Khi ảnh bị lỗi (chưa có thẻ đất), hiển thị khối Fallback UI bo tròn và đổ bóng cho đẹp */}
        {imgError && (
          <div
            className="deed-fallback-box drop-shadow-2xl rounded-2xl"
            style={{
              width: '100%',
              minHeight: '260px',
              borderRadius: '20px',
              border: '3px dashed #94a3b8',
              background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem',
              textAlign: 'center',
              gap: '0.6rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65)'
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: headerColor, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
              {tile.group ? `NHÓM ĐẤT ${tile.group.toUpperCase()}` : tile.type.toUpperCase()}
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: '#0f172a', lineHeight: '1.2' }}>
              {tile.name}
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0284c7', background: '#e0f2fe', padding: '0.45rem 1.2rem', borderRadius: '999px', marginTop: '0.35rem', border: '1px solid #bae6fd' }}>
              Giá trị ô đất: {price.toLocaleString('vi-VN')} VNĐ
            </div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', fontStyle: 'italic', marginTop: '0.4rem' }}>
              (Đang hiển thị chế độ dự phòng do chưa nạp ảnh /cards/{normalizedFileName}.webp)
            </div>
          </div>
        )}

        {/* Cảnh báo nếu không đủ tiền mua khi đang mở bán */}
        {mode === 'unowned' && !canAfford && !imgError && (
          <div
            className="flex items-center gap-2 bg-red-500/90 text-white px-4 py-2 rounded-lg font-semibold text-sm shadow-md mt-3"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(220, 38, 38, 0.95)',
              color: '#ffffff',
              padding: '0.6rem 1.2rem',
              borderRadius: '12px',
              fontSize: '0.92rem',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
              marginTop: '0.85rem'
            }}
          >
            <ShieldAlert size={18} />
            <span>Bạn không đủ tiền mua (Hiện có: {currentMoney.toLocaleString('vi-VN')} VNĐ).</span>
          </div>
        )}

        {/* Cụm nút bấm trôi nổi ngay sát dưới mép ảnh */}
        <div
          className="flex gap-4 mt-6"
          style={{
            display: 'flex',
            gap: '1.2rem',
            marginTop: '1.5rem',
            width: '100%',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}
        >
          {mode === 'unowned' && (
            <button
              onClick={() => buyProperty(modalData.tileId, currentTurnPlayerId)}
              disabled={!canAfford}
              className="btn-floating-action"
              style={{
                padding: '0.95rem 2.4rem',
                fontSize: '1.05rem',
                background: canAfford ? 'linear-gradient(135deg, #16a34a, #15803d)' : '#64748b',
                color: '#ffffff',
                fontWeight: 800,
                cursor: canAfford ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                boxShadow: canAfford ? '0 12px 28px -6px rgba(22, 163, 74, 0.65), 0 0 0 2px rgba(255,255,255,0.25)' : 'none',
                borderRadius: '9999px',
                border: 'none',
                transition: 'all 0.2s ease',
                letterSpacing: '0.3px'
              }}
            >
              <Check size={22} />
              <span>Mua Ngay ({price.toLocaleString('vi-VN')} VNĐ)</span>
            </button>
          )}

          {mode === 'self_owned' && nextUpgrade && (
            <button
              onClick={() => upgradeProperty(modalData.tileId, currentTurnPlayerId)}
              disabled={!canAffordUpgrade}
              className="btn-floating-action"
              style={{
                padding: '0.95rem 2.4rem',
                fontSize: '1.05rem',
                background: canAffordUpgrade ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#64748b',
                color: '#ffffff',
                fontWeight: 800,
                cursor: canAffordUpgrade ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                boxShadow: canAffordUpgrade ? '0 12px 28px -6px rgba(37, 99, 235, 0.65), 0 0 0 2px rgba(255,255,255,0.25)' : 'none',
                borderRadius: '9999px',
                border: 'none',
                transition: 'all 0.2s ease',
                letterSpacing: '0.3px'
              }}
            >
              <Check size={22} />
              <span>Nâng Cấp ({nextUpgrade.cost.toLocaleString('vi-VN')} VNĐ)</span>
            </button>
          )}

          <button
            onClick={closePropertyModal}
            className="btn-floating-action"
            style={{
              padding: '0.95rem 2.2rem',
              fontSize: '1.05rem',
              background: 'rgba(255, 255, 255, 0.95)',
              color: '#0f172a',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 12px 28px -6px rgba(0, 0, 0, 0.5), 0 0 0 2px rgba(255,255,255,0.35)',
              borderRadius: '9999px',
              border: 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <X size={22} />
            <span>{mode === 'rent_paid' ? 'Đóng Thông Báo' : 'Bỏ Qua'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
