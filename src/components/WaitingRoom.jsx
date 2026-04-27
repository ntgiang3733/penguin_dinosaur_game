import { useState } from "react";

export default function WaitingRoom({ roomId }) {
  const [copied, setCopied] = useState(false);

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = roomId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="waiting-container">
      <div className="waiting-card glass-card">
        <div className="waiting-icon">
          <div className="pulse-ring"></div>
          <span className="waiting-emoji">⏳</span>
        </div>

        <h2>Đang Chờ Đối Thủ...</h2>
        <p className="waiting-subtitle">
          Chia sẻ mã phòng bên dưới cho bạn bè để bắt đầu
        </p>

        <div className="room-code-display" onClick={copyRoomCode}>
          <span className="room-code-label">Mã Phòng</span>
          <span className="room-code-value">{roomId}</span>
          <button className={`copy-btn ${copied ? "copied" : ""}`}>
            {copied ? "✅ Đã copy!" : "📋 Copy"}
          </button>
        </div>

        <div className="waiting-dots">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      </div>
    </div>
  );
}
