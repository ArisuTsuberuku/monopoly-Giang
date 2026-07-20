import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { ScrollText, Terminal } from 'lucide-react';

/**
 * Component hiển thị khung nhật ký (Log Panel) cuộn theo dõi các thông báo từ Authoritative Server
 */
export default function LogPanel() {
  const logs = useGameStore((state) => state.logs);
  const logContainerRef = useRef(null);

  // Tự động cuộn xuống cuối khi có nhật ký mới
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogTypeClass = (type) => {
    switch (type) {
      case 'join':
        return 'log-join';
      case 'start':
        return 'log-start';
      case 'roll':
        return 'log-roll';
      case 'buy':
      case 'upgrade':
        return 'log-buy';
      case 'mortgage':
        return 'log-mortgage';
      case 'turn_change':
        return 'log-turn';
      default:
        return 'log-info';
    }
  };

  return (
    <div className="card log-panel-card">
      <div className="card-header">
        <ScrollText className="icon-main" />
        <h2>Nhật Ký Ván Cờ (Authoritative Logs)</h2>
      </div>

      <div className="log-container" ref={logContainerRef}>
        {logs.length === 0 ? (
          <div className="log-empty">
            <Terminal size={20} />
            <span>Chưa có diễn biến nào. Hãy gia nhập và bắt đầu ván cờ!</span>
          </div>
        ) : (
          logs.map((item, idx) => (
            <div key={idx} className={`log-item ${getLogTypeClass(item.type)}`}>
              <span className="log-time">[{item.timestamp || 'Việt Nam'}]</span>
              <span className="log-text">{item.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
