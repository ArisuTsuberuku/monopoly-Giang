import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { ScrollText, Terminal } from 'lucide-react';

/**
 * Component hiển thị nhật ký HUD (Log Panel floating widget bên trái trên)
 */
export default function LogPanel() {
  const logs = useGameStore((state) => state.logs);
  const logContainerRef = useRef(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full text-white p-3">
      <div className="flex items-center gap-2 pb-2 mb-2 border-b border-white/20 shrink-0">
        <ScrollText size={16} className="text-blue-400" />
        <h2 className="font-bold text-sm tracking-wide uppercase text-gray-200">Nhật Ký Ván Cờ</h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs" ref={logContainerRef}>
        {logs.length === 0 ? (
          <div className="flex items-center gap-2 text-gray-400 italic py-4">
            <Terminal size={14} />
            <span>Chưa có diễn biến nào...</span>
          </div>
        ) : (
          logs.map((item, idx) => (
            <div key={idx} className="leading-relaxed border-l-2 border-white/20 pl-2 py-0.5">
              <span className="text-blue-300 font-mono mr-1">[{item.timestamp || 'VN'}]</span>
              <span className="text-gray-100">{item.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
