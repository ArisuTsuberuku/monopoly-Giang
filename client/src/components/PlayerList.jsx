import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Users, ShieldAlert, Award } from 'lucide-react';

/**
 * Component hiển thị danh sách người chơi trong ván cờ (Tên, Tiền hiện tại, Vị trí)
 */
export default function PlayerList() {
  const players = useGameStore((state) => state.players);
  const board = useGameStore((state) => state.board);
  const currentTurnPlayerId = useGameStore((state) => state.currentTurnPlayerId);
  const myPlayerId = useGameStore((state) => state.myPlayerId);

  const getTileName = (position) => {
    if (!board || board.length === 0) return `Ô ${position}`;
    const tile = board[position];
    return tile ? `${tile.name} (#${position})` : `Ô #${position}`;
  };

  return (
    <div className="card player-list-card">
      <div className="card-header">
        <Users className="icon-main" />
        <h2>Danh Sách Người Chơi ({players.length})</h2>
      </div>

      {players.length === 0 ? (
        <div className="empty-state">
          <p>Chưa có người chơi nào gia nhập. Hãy nhập tên bên dưới để tham gia!</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="player-table">
            <thead>
              <tr>
                <th>Người chơi</th>
                <th>Tiền hiện tại</th>
                <th>Vị trí hiện tại</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => {
                const isCurrentTurn = player.id === currentTurnPlayerId;
                const isMe = player.id === myPlayerId;

                return (
                  <tr
                    key={player.id}
                    className={`${isCurrentTurn ? 'row-active-turn' : ''} ${isMe ? 'row-me' : ''}`}
                  >
                    <td className="player-name-cell">
                      <div className="name-wrapper">
                        <span className="player-name">
                          {player.name} {isMe && <span className="badge badge-me">(Bạn)</span>}
                        </span>
                        {isCurrentTurn && (
                          <span className="badge badge-turn">
                            <Award size={14} /> Lượt đi
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="money-cell">
                      <span className="money-amount">
                        {player.money ? player.money.toLocaleString('vi-VN') : 0} VNĐ
                      </span>
                    </td>
                    <td className="position-cell">
                      <span className="position-text">{getTileName(player.position)}</span>
                    </td>
                    <td className="status-cell">
                      {player.inJail ? (
                        <span className="badge badge-jail">
                          <ShieldAlert size={14} /> Trong tù ({player.jailTurns}/3)
                        </span>
                      ) : (
                        <span className="badge badge-normal">Tự do</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
