import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Check, X, ShieldAlert } from 'lucide-react';

/**
 * Hàm lấy mã màu header cho thẻ đất dựa vào thuộc tính group
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
 * Component Thẻ Đất 2D Overlay thuần túy (Pure 2D Overlay Modal)
 * Nằm ngoài không gian 3D Canvas, hiển thị rõ nét, không bị ngược chữ hoặc ảnh hưởng bởi camera R3F.
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
  const ownerName = owner ? owner.name : 'Chủ sở hữu khác';

  // Kiểm tra chi phí nâng cấp nếu ở mode self_owned
  const currentLevel = modalData.level || 0;
  const nextUpgrade = tile.upgrades && tile.upgrades[currentLevel];
  const canAffordUpgrade = nextUpgrade ? currentMoney >= nextUpgrade.cost : false;

  return (
    <div
      className="property-card-2d-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        animation: 'fadeIn 0.25s ease-out'
      }}
    >
      <div
        className="property-card-modal-content"
        style={{
          background: '#ffffff',
          border: '3px solid #cbd5e1',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '400px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Inter, sans-serif',
          animation: 'bouncePopup 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {/* Header màu đặc trưng của nhóm đất */}
        <div
          className="deed-header"
          style={{
            background: headerColor,
            padding: '1.25rem 1.5rem',
            textAlign: 'center',
            color: '#ffffff',
            borderBottom: '4px solid rgba(0,0,0,0.15)'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', opacity: 0.95 }}>
            {mode === 'self_owned' ? 'LANDMARK SỞ HỮU' : mode === 'rent_paid' ? 'THÔNG BÁO THUẾ / THUÊ' : 'GIẤY CHỨNG NHẬN QUYỀN SỞ HỮU'}
          </div>
          <h2 style={{ fontSize: '1.55rem', fontWeight: 800, margin: '0.25rem 0', fontFamily: 'Outfit, sans-serif', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
            {tile.name}
          </h2>
          <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
            Chỉ số ô: #{tile.id} ({tile.type.toUpperCase()})
          </div>
        </div>

        {/* Thân thẻ đất với ảnh Khế ước thực từ /board card/ */}
        <div className="deed-body" style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '0.95rem', color: '#1e293b' }}>
          {/* Ảnh Khế ước thật tải từ folder /board card/ */}
          <img
            src={`/board card/${tile.name}.png`}
            alt={tile.name}
            onError={(e) => { e.target.style.display = 'none'; }}
            style={{
              width: '100%',
              maxHeight: '210px',
              objectFit: 'contain',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              background: '#f8fafc'
            }}
          />

          {mode === 'unowned' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '0.85rem 1.1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Giá Mua Đất:</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0284c7' }}>
                  {price.toLocaleString('vi-VN')} VNĐ
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#475569' }}>Giá thuê cơ bản (Chưa nâng cấp):</span>
                <strong style={{ color: '#16a34a', fontWeight: 700 }}>{(tile.baseRent || 20).toLocaleString('vi-VN')} VNĐ</strong>
              </div>
            </>
          )}

          {mode === 'self_owned' && (
            <div style={{ background: '#f0fdf4', padding: '0.95rem', borderRadius: '12px', border: '1px solid #bbf7d0', color: '#15803d', fontSize: '0.95rem' }}>
              <div style={{ fontWeight: 700, marginBottom: '0.35rem', fontSize: '1rem' }}>🎉 Bạn là chủ sở hữu mảnh đất này!</div>
              <div>Cấp độ Landmark hiện tại: <strong>Cấp {currentLevel}</strong></div>
              {nextUpgrade ? (
                <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #86efac' }}>
                  Nâng cấp tiếp theo: <strong>{nextUpgrade.name}</strong> ({nextUpgrade.cost.toLocaleString('vi-VN')} VNĐ)
                </div>
              ) : (
                <div style={{ marginTop: '0.5rem', color: '#047857', fontWeight: 600 }}>⭐ Đã đạt cấp độ tối đa!</div>
              )}
            </div>
          )}

          {mode === 'rent_paid' && (
            <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '12px', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '0.95rem' }}>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.3rem' }}>💸 ĐÃ THANH TOÁN TIỀN THUÊ</div>
              <div>Người chơi <strong>{activePlayer ? activePlayer.name : 'Bạn'}</strong> đã dừng chân tại khu đất của người khác.</div>
              <div style={{ marginTop: '0.4rem', padding: '0.5rem', background: '#ffffff', borderRadius: '8px', border: '1px solid #fee2e2' }}>
                Đã trả <strong style={{ fontSize: '1.1rem' }}>{modalData.rent?.toLocaleString('vi-VN') || 0} VNĐ</strong> tiền thuê cho <strong>{ownerName}</strong>!
              </div>
            </div>
          )}

          {tile.upgrades && tile.upgrades.length > 0 && mode === 'unowned' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: '#475569' }}>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.1rem' }}>Bảng giá thuê nâng cấp Landmark:</div>
              {tile.upgrades.slice(0, 3).map((upg, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>⭐ Cấp {upg.level}: {upg.name || `Landmark ${upg.level}`}</span>
                  <span style={{ fontWeight: 600, color: '#334155' }}>{upg.rent?.toLocaleString('vi-VN')} VNĐ</span>
                </div>
              ))}
            </div>
          )}

          {mode === 'unowned' && !canAfford && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fef2f2', color: '#dc2626', padding: '0.7rem 0.9rem', borderRadius: '10px', fontSize: '0.85rem', border: '1px solid #fecaca', fontWeight: 600 }}>
              <ShieldAlert size={18} />
              <span>Bạn không đủ tiền mua (Hiện có: {currentMoney.toLocaleString('vi-VN')} VNĐ).</span>
            </div>
          )}
        </div>

        {/* Các nút hành động tương ứng với từng chế độ */}
        <div className="deed-footer" style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.95rem' }}>
          {mode === 'unowned' && (
            <button
              onClick={() => buyProperty(modalData.tileId, currentTurnPlayerId)}
              disabled={!canAfford}
              className="btn"
              style={{
                flex: 1, padding: '0.85rem', fontSize: '1rem',
                background: canAfford ? 'linear-gradient(135deg, #16a34a, #15803d)' : '#94a3b8',
                color: '#fff', fontWeight: 700,
                cursor: canAfford ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                boxShadow: canAfford ? '0 4px 12px rgba(22, 163, 74, 0.25)' : 'none',
                borderRadius: '10px', border: 'none'
              }}
            >
              <Check size={20} />
              <span>Mua Ngay ({price.toLocaleString('vi-VN')} VNĐ)</span>
            </button>
          )}

          {mode === 'self_owned' && nextUpgrade && (
            <button
              onClick={() => upgradeProperty(modalData.tileId, currentTurnPlayerId)}
              disabled={!canAffordUpgrade}
              className="btn"
              style={{
                flex: 1, padding: '0.85rem', fontSize: '1rem',
                background: canAffordUpgrade ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#94a3b8',
                color: '#fff', fontWeight: 700,
                cursor: canAffordUpgrade ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                boxShadow: canAffordUpgrade ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none',
                borderRadius: '10px', border: 'none'
              }}
            >
              <Check size={20} />
              <span>Xây Nhà / Nâng Cấp</span>
            </button>
          )}

          <button
            onClick={closePropertyModal}
            className="btn"
            style={{
              flex: 1, padding: '0.85rem', fontSize: '1rem',
              background: '#ffffff', border: '1px solid #cbd5e1',
              color: '#334155', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              borderRadius: '10px'
            }}
          >
            <X size={20} />
            <span>{mode === 'rent_paid' ? 'Đóng thông báo' : 'Bỏ qua'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
