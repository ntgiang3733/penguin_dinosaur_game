import { useState, useEffect } from "react";
import { getGameHistory } from "../firebase/gameService";

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs}s`;
}

function formatDate(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));

  const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 0) return `Hôm nay, ${time}`;
  if (diffDays === 1) return `Hôm qua, ${time}`;
  return `${d.toLocaleDateString("vi-VN")}, ${time}`;
}

function finishLabel(reason) {
  if (reason === "timeout") return "⏰ Hết giờ";
  if (reason === "score_limit") return "🏁 Đủ điểm";
  return reason || "?";
}

export default function GameHistory({ onBack }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getGameHistory(30)
      .then((data) => {
        if (!cancelled) setGames(data);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="history-container">
      <div className="history-card glass-card">
        <div className="history-header">
          <button className="btn btn-ghost" onClick={onBack}>
            ← Quay lại
          </button>
          <h2>📋 Lịch Sử Game</h2>
          <div style={{ width: 80 }} />
        </div>

        {loading && (
          <div className="history-loading">
            <span className="loading-spinner"></span>
            <span>Đang tải...</span>
          </div>
        )}

        {!loading && games.length === 0 && (
          <div className="history-empty">
            <span className="history-empty-icon">🎮</span>
            <p>Chưa có game nào được chơi.</p>
          </div>
        )}

        {!loading && games.length > 0 && (
          <div className="history-list">
            {games.map((game) => {
              const isExpanded = expandedId === game.id;
              const isDraw = game.winner === "draw";
              const p1Won = game.winner === "player1";
              const p2Won = game.winner === "player2";

              return (
                <div
                  key={game.id}
                  className={`history-item glass-card ${isExpanded ? "expanded" : ""}`}
                  onClick={() => setExpandedId(isExpanded ? null : game.id)}
                >
                  <div className="history-item-header">
                    <div className="history-players">
                      <span className={`history-player ${p1Won ? "winner" : ""}`}>
                        {p1Won && "👑 "}
                        {game.player1.name}
                        <span className="history-score">{game.player1.score}</span>
                      </span>
                      <span className="history-vs">vs</span>
                      <span className={`history-player ${p2Won ? "winner" : ""}`}>
                        {p2Won && "👑 "}
                        {game.player2.name}
                        <span className="history-score">{game.player2.score}</span>
                      </span>
                      {isDraw && <span className="history-draw-badge">Hòa</span>}
                    </div>
                    <div className="history-meta">
                      <span className="history-finish">{finishLabel(game.finishReason)}</span>
                      <span className="history-dot">·</span>
                      <span className="history-duration">
                        {formatDuration(game.finishedAt - game.startedAt)}
                      </span>
                      <span className="history-dot">·</span>
                      <span className="history-words-count">{game.totalWords} từ</span>
                    </div>
                    <div className="history-date">{formatDate(game.finishedAt)}</div>
                    <span className={`history-expand-icon ${isExpanded ? "open" : ""}`}>▾</span>
                  </div>

                  {isExpanded && game.words && game.words.length > 0 && (
                    <div className="history-word-chain slide-up">
                      {game.words.map((word, i) => (
                        <span key={i} className="chain-word">
                          <span className={`chain-player ${i % 2 === 0 ? "p1" : "p2"}`}>
                            {i % 2 === 0 ? game.player1.name[0] : game.player2.name[0]}
                          </span>
                          {word}
                          <span className="chain-score">+{word.length}</span>
                          {i < game.words.length - 1 && <span className="chain-arrow">→</span>}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
