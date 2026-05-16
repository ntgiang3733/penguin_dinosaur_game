import { useState } from "react";
import { createVocabRoom, joinVocabRoom } from "../../firebase/vocabGameService";
import { getTopicList, pickRandomWords, pickWordsFor2P } from "../../data/wordLoader";
import { VOCAB_WORDS_PER_GAME, VOCAB_TIME_PER_LETTER } from "../../constants";
import "../../VocabGame.css";

const ALL_TOPICS = getTopicList();

export default function VocabularySetup({ onStart1P, onStart2P, onBack }) {
  const [selectedTopics, setSelectedTopics] = useState(new Set(ALL_TOPICS.map((t) => t.id)));
  const [playerName, setPlayerName] = useState("");
  const [mode, setMode] = useState("1p");
  const [roomCode, setRoomCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");
  const [showRoomInput, setShowRoomInput] = useState(false);

  const toggleTopic = (id) => {
    setSelectedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedTopics.size === ALL_TOPICS.length) {
      setSelectedTopics(new Set());
    } else {
      setSelectedTopics(new Set(ALL_TOPICS.map((t) => t.id)));
    }
  };

  const handleStart1P = () => {
    if (!playerName.trim()) {
      setError("Vui lòng nhập tên của bạn");
      return;
    }
    if (selectedTopics.size === 0) {
      setError("Vui lòng chọn ít nhất 1 chủ đề");
      return;
    }
    const words = pickRandomWords([...selectedTopics], null);
    if (words.length === 0) {
      setError("Không có từ nào trong chủ đề đã chọn");
      return;
    }
    onStart1P(words);
  };

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError("Vui lòng nhập tên của bạn");
      return;
    }
    if (selectedTopics.size === 0) {
      setError("Vui lòng chọn ít nhất 1 chủ đề");
      return;
    }

    const words = pickWordsFor2P([...selectedTopics]);
    if (words.length < VOCAB_WORDS_PER_GAME) {
      setError(`Cần ít nhất ${VOCAB_WORDS_PER_GAME} từ trong các chủ đề đã chọn (hiện có ${words.length})`);
      return;
    }

    setIsCreating(true);
    setError("");
    try {
      const result = await createVocabRoom(playerName.trim(), [...selectedTopics], words);
      onStart2P(result.roomId, result.playerRole);
    } catch (err) {
      setError("Không thể tạo phòng. Vui lòng thử lại.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      setError("Vui lòng nhập tên của bạn");
      return;
    }
    if (!roomCode.trim()) {
      setError("Vui lòng nhập mã phòng");
      return;
    }
    setIsJoining(true);
    setError("");
    try {
      const result = await joinVocabRoom(roomCode.trim().toUpperCase(), playerName.trim());
      onStart2P(result.roomId, result.playerRole);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsJoining(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      if (showRoomInput) handleJoinRoom();
      else handleStart1P();
    }
  };

  const allSelected = selectedTopics.size === ALL_TOPICS.length;

  return (
    <div className="v-setup-container">
      <div className="v-setup-card glass-card">
        <div className="v-setup-header">
          <h2>📝 Học Từ Mới</h2>
          <p>Chọn chủ đề và bắt đầu luyện tập</p>
        </div>

        {/* Topic selection */}
        <div className="v-select-all">
          <button
            className={`v-select-all-btn ${allSelected ? "active" : ""}`}
            onClick={toggleAll}
          >
            {allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả chủ đề"}
          </button>
        </div>

        <div className="v-topic-grid">
          {ALL_TOPICS.map((topic) => (
            <div
              key={topic.id}
              className={`v-topic-card ${selectedTopics.has(topic.id) ? "selected" : ""}`}
              onClick={() => toggleTopic(topic.id)}
            >
              {topic.topicName}
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>
                {topic.words.length} từ
              </div>
            </div>
          ))}
        </div>

        {/* Name input */}
        <div className="v-name-input">
          <label htmlFor="v-player-name">Tên của bạn</label>
          <input
            id="v-player-name"
            type="text"
            className="input-field"
            placeholder="Nhập tên..."
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={handleKeyPress}
            maxLength={20}
            style={{ width: "100%", boxSizing: "border-box" }}
          />
        </div>

        {/* Mode toggle */}
        <div className="v-mode-toggle">
          <button
            className={`v-mode-btn ${mode === "1p" ? "active" : ""}`}
            onClick={() => { setMode("1p"); setShowRoomInput(false); }}
          >
            🎮 1 Người Chơi
          </button>
          <button
            className={`v-mode-btn ${mode === "2p" ? "active" : ""}`}
            onClick={() => setMode("2p")}
          >
            ⚔️ 2 Người Chơi
          </button>
        </div>

        {mode === "1p" && (
          <p className="v-mode-info">
            Không giới hạn thời gian • Không giới hạn số từ • Có gợi ý (-1 điểm)
          </p>
        )}
        {mode === "2p" && (
          <p className="v-mode-info">
            {VOCAB_WORDS_PER_GAME} từ mỗi trận • Mỗi chữ cái {VOCAB_TIME_PER_LETTER}s • Cả 2 cùng gõ • Có gợi ý (-1 điểm)
          </p>
        )}

        {/* Actions */}
        {mode === "1p" && (
          <div className="v-setup-actions">
            <button
              className="btn btn-primary btn-large"
              onClick={handleStart1P}
              disabled={!playerName.trim() || selectedTopics.size === 0}
            >
              🚀 Bắt Đầu
            </button>
          </div>
        )}

        {mode === "2p" && !showRoomInput && (
          <div className="v-setup-actions">
            <button
              className="btn btn-primary btn-large"
              onClick={handleCreateRoom}
              disabled={isCreating || !playerName.trim() || selectedTopics.size === 0}
            >
              {isCreating ? <span className="loading-spinner"></span> : "🏠 Tạo Phòng"}
            </button>
            <button
              className="btn btn-secondary btn-large"
              onClick={() => setShowRoomInput(true)}
              disabled={!playerName.trim()}
            >
              🚪 Vào Phòng
            </button>
          </div>
        )}

        {mode === "2p" && showRoomInput && (
          <div className="v-setup-actions">
            <div className="v-room-input">
              <label htmlFor="v-room-code">Mã Phòng</label>
              <input
                id="v-room-code"
                type="text"
                className="input-field input-room-code"
                placeholder="Nhập mã phòng (6 ký tự)..."
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                onKeyDown={handleKeyPress}
                maxLength={6}
                style={{ width: "100%", boxSizing: "border-box" }}
              />
            </div>
            <button
              className="btn btn-primary btn-large"
              onClick={handleJoinRoom}
              disabled={isJoining || !playerName.trim() || !roomCode.trim()}
            >
              {isJoining ? <span className="loading-spinner"></span> : "🚀 Tham Gia"}
            </button>
            <button className="btn btn-ghost" onClick={() => setShowRoomInput(false)}>
              ← Quay lại
            </button>
          </div>
        )}

        {error && (
          <div className="error-message slide-up" style={{ marginTop: 16 }}>
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Back button */}
        <button
          className="btn btn-ghost"
          onClick={onBack}
          style={{ marginTop: 16, width: "100%" }}
        >
          ← Chọn chế độ khác
        </button>
      </div>
    </div>
  );
}
