import { useState, useRef, useEffect } from "react";
import Timer from "./Timer";
import { submitWord, handleTimeout } from "../firebase/gameService";
import { validateWord, checkChainRule, checkDuplicate } from "../utils/wordValidator";

export default function GameBoard({ roomData, roomId, playerRole }) {
  const [inputWord, setInputWord] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [validationStatus, setValidationStatus] = useState(""); // 'checking', 'valid', 'invalid'
  const inputRef = useRef(null);
  const wordListRef = useRef(null);

  const myRole = playerRole;
  const opponentRole = myRole === "player1" ? "player2" : "player1";
  const isMyTurn = roomData.currentTurn === myRole;

  const myName = roomData.players?.[myRole]?.name || "Bạn";
  const opponentName = roomData.players?.[opponentRole]?.name || "Đối thủ";
  const myScore = roomData.players?.[myRole]?.score || 0;
  const opponentScore = roomData.players?.[opponentRole]?.score || 0;

  const lastWord = roomData.lastWord || "";
  const words = roomData.words || [];
  const requiredLetter = lastWord ? lastWord.charAt(lastWord.length - 1).toUpperCase() : "";

  // Auto focus input when it's my turn
  useEffect(() => {
    if (isMyTurn && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMyTurn]);

  // Scroll word list to bottom
  useEffect(() => {
    if (wordListRef.current) {
      wordListRef.current.scrollTop = wordListRef.current.scrollHeight;
    }
  }, [words.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!inputWord.trim() || !isMyTurn || isSubmitting) return;

    const word = inputWord.trim().toLowerCase();
    setError("");
    setIsSubmitting(true);
    setValidationStatus("checking");

    try {
      // 1. Check chain rule
      const chainCheck = checkChainRule(word, lastWord);
      if (!chainCheck.valid) {
        setError(chainCheck.reason);
        setValidationStatus("invalid");
        setIsSubmitting(false);
        return;
      }

      // 2. Check duplicate
      const dupCheck = checkDuplicate(word, words);
      if (!dupCheck.valid) {
        setError(dupCheck.reason);
        setValidationStatus("invalid");
        setIsSubmitting(false);
        return;
      }

      // 3. Validate with dictionary API
      const dictCheck = await validateWord(word);
      if (!dictCheck.valid) {
        setError(dictCheck.reason);
        setValidationStatus("invalid");
        setIsSubmitting(false);
        return;
      }

      // 4. Submit to Firebase
      setValidationStatus("valid");
      await submitWord(roomId, word, myRole);
      setInputWord("");
      setValidationStatus("");
    } catch (err) {
      setError(err.message);
      setValidationStatus("invalid");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onTimeout = async () => {
    try {
      await handleTimeout(roomId, roomData.currentTurn);
    } catch (err) {
      console.error("Timeout error:", err);
    }
  };

  return (
    <div className="gameboard-container">
      {/* Score Header */}
      <div className="score-header glass-card">
        <div className={`player-score ${isMyTurn && myRole === "player1" ? "active" : ""} ${myRole === "player1" ? "me" : ""}`}>
          <span className="ps-name">{myRole === "player1" ? myName : opponentName}</span>
          <span className="ps-score">{myRole === "player1" ? myScore : opponentScore}</span>
          {roomData.currentTurn === "player1" && <span className="turn-badge">🎯</span>}
        </div>

        <Timer
          turnStartTime={roomData.turnStartTime}
          duration={30}
          onTimeout={onTimeout}
          isMyTurn={isMyTurn}
        />

        <div className="score-goal glass-card">
          <span className="goal-label">Mục tiêu</span>
          <span className="goal-value">70</span>
        </div>

        <div className={`player-score ${isMyTurn && myRole === "player2" ? "active" : ""} ${myRole === "player2" ? "me" : ""}`}>
          <span className="ps-name">{myRole === "player2" ? myName : opponentName}</span>
          <span className="ps-score">{myRole === "player2" ? myScore : opponentScore}</span>
          {roomData.currentTurn === "player2" && <span className="turn-badge">🎯</span>}
        </div>
      </div>

      {/* Game Area */}
      <div className="game-area glass-card">
        {/* Turn Indicator */}
        <div className={`turn-indicator ${isMyTurn ? "my-turn" : "opponent-turn"}`}>
          {isMyTurn ? (
            <span>🎯 Lượt của bạn! Hãy nhập một từ{requiredLetter ? ` bắt đầu bằng "${requiredLetter}"` : ""}</span>
          ) : (
            <span>⏳ Đợi {opponentName} nhập từ...</span>
          )}
        </div>

        {/* Last Word Display */}
        {lastWord && (
          <div className="last-word-display">
            <span className="last-word-label">Từ trước</span>
            <div className="last-word-value">
              {lastWord.split("").map((char, i) => (
                <span
                  key={i}
                  className={`letter ${i === lastWord.length - 1 ? "highlight" : ""}`}
                >
                  {char.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Word Input */}
        <form className="word-input-form" onSubmit={handleSubmit}>
          <div className="input-wrapper">
            {requiredLetter && (
              <span className="required-letter">{requiredLetter}</span>
            )}
            <input
              ref={inputRef}
              type="text"
              className={`word-input ${validationStatus}`}
              placeholder={isMyTurn ? "Nhập từ tiếng Anh..." : "Đợi đối thủ..."}
              value={inputWord}
              onChange={(e) => {
                setInputWord(e.target.value.toLowerCase());
                setError("");
                setValidationStatus("");
              }}
              disabled={!isMyTurn || isSubmitting}
              autoComplete="off"
              spellCheck="false"
            />
            <button
              type="submit"
              className="submit-btn"
              disabled={!isMyTurn || !inputWord.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <span className="loading-spinner small"></span>
              ) : (
                "Gửi →"
              )}
            </button>
          </div>
          {error && (
            <div className="input-error slide-up">
              <span>❌</span> {error}
            </div>
          )}
          {isMyTurn && inputWord && !error && (
            <div className="input-hint">
              +{inputWord.trim().length} điểm nếu đúng
            </div>
          )}
        </form>

        {/* Word History */}
        <div className="word-history">
          <h3>📖 Lịch sử từ</h3>
          <div className="word-list" ref={wordListRef}>
            {words.length === 0 ? (
              <div className="empty-history">
                {roomData.currentTurn === "player1"
                  ? `${roomData.players?.player1?.name || "Player 1"} bắt đầu nhập từ đầu tiên!`
                  : "Chưa có từ nào..."}
              </div>
            ) : (
              [...words].reverse().map((word, i) => {
                const originalIndex = words.length - 1 - i;
                const isPlayer1Word = originalIndex % 2 === 0;
                const wordPlayer = isPlayer1Word
                  ? roomData.players?.player1?.name
                  : roomData.players?.player2?.name;
                const isMe =
                  (isPlayer1Word && myRole === "player1") ||
                  (!isPlayer1Word && myRole === "player2");

                return (
                  <div
                    key={originalIndex}
                    className={`word-item ${isMe ? "my-word" : "opponent-word"} slide-up`}
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <span className={`word-player-avatar ${isPlayer1Word ? "p1" : "p2"}`}>
                      {wordPlayer?.[0]?.toUpperCase() || "?"}
                    </span>
                    <div className="word-content">
                      <span className="word-text">{word}</span>
                      <span className="word-points">+{word.length}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
