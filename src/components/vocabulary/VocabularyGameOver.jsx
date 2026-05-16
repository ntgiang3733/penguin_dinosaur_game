import "../../VocabGame.css";

export default function VocabularyGameOver({ result, isLocal, playerRole, roomData, onPlayAgain, onBackToHome }) {
  if (!result && !roomData) return null;

  let displayName, myScore, opponentName, opponentScore, isWinner, isDraw;

  if (isLocal && result) {
    displayName = "Bạn";
    myScore = result.score;
    opponentScore = 0;
    isWinner = true;
    isDraw = false;
  } else if (roomData) {
    const myRole = playerRole;
    const oppRole = myRole === "player1" ? "player2" : "player1";
    myScore = roomData.players?.[myRole]?.score || 0;
    opponentScore = roomData.players?.[oppRole]?.score || 0;
    displayName = roomData.players?.[myRole]?.name || "Bạn";
    opponentName = roomData.players?.[oppRole]?.name || "Đối thủ";
    isWinner = roomData.winner === myRole;
    isDraw = roomData.winner === "draw";
  }

  let emoji, text, textClass;
  if (isLocal) {
    emoji = "🎉";
    text = "Hoàn Thành!";
    textClass = "solo";
  } else if (isWinner) {
    emoji = "🏆";
    text = "Bạn Thắng!";
    textClass = "win";
  } else if (isDraw) {
    emoji = "🤝";
    text = "Hòa!";
    textClass = "draw";
  } else {
    emoji = "😢";
    text = "Bạn Thua!";
    textClass = "lose";
  }

  const wordsCompleted = result?.wordsCompleted
    || (roomData?.players?.[playerRole]?.wordsCompleted || 0);

  const hintsUsed = result?.hintsUsedTotal || 0;

  const history = result?.history || [];

  return (
    <div className="v-gameover-container">
      <div className="v-gameover-card glass-card">
        <div className="v-result-banner">
          <span className="v-result-emoji">{emoji}</span>
          <h2 className={`v-result-text ${textClass}`}>{text}</h2>
          {!isLocal && (
            <p className="v-result-subtitle">
              {isWinner ? "Chúc mừng! Bạn đã ghi nhiều điểm hơn!" :
               isDraw ? "Hai người chơi bằng điểm nhau!" :
               "Đối thủ đã ghi nhiều điểm hơn!"}
            </p>
          )}
        </div>

        {/* 1P stats */}
        {isLocal && (
          <div className="v-final-stats">
            <div className="v-stat-box">
              <div className="v-stat-value">{myScore}</div>
              <div className="v-stat-label">Điểm</div>
            </div>
            <div className="v-stat-box">
              <div className="v-stat-value">{wordsCompleted}</div>
              <div className="v-stat-label">Từ đã hoàn thành</div>
            </div>
            <div className="v-stat-box">
              <div className="v-stat-value">{hintsUsed}</div>
              <div className="v-stat-label">Lần dùng gợi ý</div>
            </div>
            <div className="v-stat-box">
              <div className="v-stat-value">{myScore - (result?.rawScore || myScore) >= 0 ? myScore : myScore}</div>
              <div className="v-stat-label">Điểm cuối cùng</div>
            </div>
          </div>
        )}

        {/* 2P score comparison */}
        {!isLocal && (
          <div className="v-score-compare">
            <div className={`v-score-player ${isWinner ? "winner" : ""}`}>
              <div className="v-score-name">{displayName} (Bạn)</div>
              <div className="v-score-num">{myScore}</div>
            </div>
            <div className="v-score-vs">VS</div>
            <div className={`v-score-player ${!isWinner && !isDraw ? "winner" : ""}`}>
              <div className="v-score-name">{opponentName}</div>
              <div className="v-score-num">{opponentScore}</div>
            </div>
          </div>
        )}

        {/* Word breakdown */}
        {history.length > 0 && (
          <div className="v-word-list">
            <h3>📝 Chi tiết các từ</h3>
            {history.map((item, i) => (
              <div key={i} className="v-word-item">
                <span className="v-wi-vn">{item.vietnamese}</span>
                <span className="v-wi-en">{item.english}</span>
                <span className="v-wi-points">+{item.points}</span>
                {item.hints > 0 && (
                  <span className="v-wi-hints">-{item.hints} gợi ý</span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="v-gameover-actions">
          <button className="btn btn-primary" onClick={onPlayAgain}>
            🔄 Chơi Lại
          </button>
          <button className="btn btn-secondary" onClick={onBackToHome}>
            🏠 Về Trang Chủ
          </button>
        </div>
      </div>
    </div>
  );
}
