export default function GameOver({ roomData, playerRole, onPlayAgain, onBackToLobby }) {
  const myRole = playerRole;
  const opponentRole = myRole === "player1" ? "player2" : "player1";

  const myScore = roomData.players?.[myRole]?.score || 0;
  const opponentScore = roomData.players?.[opponentRole]?.score || 0;
  const myName = roomData.players?.[myRole]?.name || "Bạn";
  const opponentName = roomData.players?.[opponentRole]?.name || "Đối thủ";

  const isWinner = roomData.winner === myRole;
  const isDraw = roomData.winner === "draw";
  const finishReason = roomData.finishReason;

  const words = roomData.words || [];

  let resultEmoji, resultText, resultClass;
  if (isWinner) {
    resultEmoji = "🏆";
    resultText = "Bạn Thắng!";
    resultClass = "result-win";
  } else if (isDraw) {
    resultEmoji = "🤝";
    resultText = "Hòa!";
    resultClass = "result-draw";
  } else {
    resultEmoji = "😢";
    resultText = "Bạn Thua!";
    resultClass = "result-lose";
  }

  let reasonText = "";
  if (finishReason === "timeout") {
    reasonText = isWinner
      ? "Đối thủ đã hết thời gian!"
      : "Bạn đã hết thời gian!";
  } else if (finishReason === "score_limit") {
    reasonText = isWinner
      ? "Chúc mừng! Bạn đã đạt mốc 70 điểm trước!"
      : "Đối thủ đã đạt mốc 70 điểm trước!";
  } else if (finishReason === "disconnect") {
    reasonText = "Đối thủ đã ngắt kết nối.";
  }

  return (
    <div className="gameover-container">
      <div className="gameover-card glass-card">
        <div className={`result-banner ${resultClass}`}>
          <span className="result-emoji">{resultEmoji}</span>
          <h2 className="result-text">{resultText}</h2>
          {reasonText && <p className="result-reason">{reasonText}</p>}
        </div>

        <div className="final-scores">
          <div className={`score-card ${isWinner ? "winner" : ""}`}>
            <span className="score-name">{myName} (Bạn)</span>
            <span className="score-value">{myScore}</span>
            <span className="score-label">điểm</span>
          </div>
          <div className="score-vs">VS</div>
          <div className={`score-card ${!isWinner && !isDraw ? "winner" : ""}`}>
            <span className="score-name">{opponentName}</span>
            <span className="score-value">{opponentScore}</span>
            <span className="score-label">điểm</span>
          </div>
        </div>

        {words.length > 0 && (
          <div className="word-summary">
            <h3>📝 Các từ đã chơi ({words.length})</h3>
            <div className="word-chain-display">
              {words.map((word, i) => (
                <span key={i} className="chain-word">
                  <span className={`chain-player ${i % 2 === 0 ? "p1" : "p2"}`}>
                    {i % 2 === 0
                      ? roomData.players?.player1?.name?.[0]
                      : roomData.players?.player2?.name?.[0]}
                  </span>
                  {word}
                  <span className="chain-score">+{word.length}</span>
                  {i < words.length - 1 && <span className="chain-arrow">→</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="gameover-actions">
          <button className="btn btn-primary" onClick={onPlayAgain}>
            <span className="btn-icon">🔄</span>
            Chơi Lại
          </button>
          <button className="btn btn-secondary" onClick={onBackToLobby}>
            <span className="btn-icon">🏠</span>
            Về Trang Chủ
          </button>
        </div>
      </div>
    </div>
  );
}
