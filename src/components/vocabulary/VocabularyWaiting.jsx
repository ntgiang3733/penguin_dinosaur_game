import { useState, useEffect, useRef } from "react";
import { listenToVocabRoom } from "../../firebase/vocabGameService";
import "../../VocabGame.css";

export default function VocabularyWaiting({ roomId, onOpponentJoined }) {
  const [copied, setCopied] = useState(false);
  const unsubRef = useRef(null);

  useEffect(() => {
    unsubRef.current = listenToVocabRoom(roomId, (data) => {
      if (data.status === "playing") {
        onOpponentJoined(data);
      }
    });

    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, [roomId, onOpponentJoined]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="v-waiting-container">
      <div className="v-waiting-card glass-card">
        <h2>⏳ Chờ Người Chơi</h2>
        <p>Chia sẻ mã phòng để bạn của bạn tham gia</p>

        <div className="v-room-code-display">{roomId}</div>

        <button className="v-copy-btn" onClick={handleCopy}>
          {copied ? "✅ Đã Sao Chép!" : "📋 Sao Chép Mã Phòng"}
        </button>

        {copied && <div className="v-copied slide-up">Đã sao chép mã phòng!</div>}

        <div className="v-waiting-animation">
          <div className="v-waiting-dot"></div>
          <div className="v-waiting-dot"></div>
          <div className="v-waiting-dot"></div>
        </div>
      </div>
    </div>
  );
}
