import { useState } from "react";
import { joinDefaultVocabRoom } from "../../firebase/vocabGameService";
import { getTopicList } from "../../data/wordLoader";
import { VOCAB_WORDS_PER_GAME, VOCAB_TIME_PER_LETTER } from "../../constants";
import "../../VocabGame.css";

const ALL_TOPICS = getTopicList();

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function VocabularySetup({ onStart1P, onStart2P, onBack }) {
  const [selectedTopics, setSelectedTopics] = useState(new Set());
  const [playerName, setPlayerName] = useState("");
  const [mode, setMode] = useState("1p");
  const [isJoiningDuo, setIsJoiningDuo] = useState(false);
  const [error, setError] = useState("");
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [wordSelections, setWordSelections] = useState({});

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

  // Collect selected words across all selected topics
  const collectSelectedWords = () => {
    const allWords = [];
    for (const topicId of selectedTopics) {
      const topic = ALL_TOPICS.find((t) => t.id === topicId);
      if (!topic) continue;
      const selections = wordSelections[topicId];
      if (!selections) {
        // Topic not previewed yet — all words are selected by default
        allWords.push(...topic.words);
      } else {
        allWords.push(...topic.words.filter((w) => selections.has(w.english)));
      }
    }
    return allWords;
  };

  const handleStart1P = () => {
    if (selectedTopics.size === 0) {
      setError("Vui lòng chọn ít nhất 1 chủ đề");
      return;
    }
    const allWords = collectSelectedWords();
    if (allWords.length === 0) {
      setError("Không có từ nào được chọn. Hãy mở preview và chọn ít nhất 1 từ.");
      return;
    }
    onStart1P(shuffle(allWords));
  };

  const handleJoinDuo = async () => {
    if (!playerName.trim()) {
      setError("Vui lòng nhập tên của bạn");
      return;
    }
    if (selectedTopics.size === 0) {
      setError("Vui lòng chọn ít nhất 1 chủ đề");
      return;
    }
    const allWords = collectSelectedWords();
    if (allWords.length === 0) {
      setError("Không có từ nào được chọn. Hãy mở preview và chọn ít nhất 1 từ.");
      return;
    }

    setIsJoiningDuo(true);
    setError("");
    try {
      const result = await joinDefaultVocabRoom(playerName.trim(), [...selectedTopics], allWords);
      onStart2P(result.roomId, result.playerRole);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsJoiningDuo(false);
    }
  };

  const allSelected = selectedTopics.size === ALL_TOPICS.length;

  // Word-level selection within a topic's preview
  const initWordSelections = (topicId, words) => {
    if (!wordSelections[topicId]) {
      setWordSelections((prev) => ({
        ...prev,
        [topicId]: new Set(words.map((w) => w.english)),
      }));
    }
  };

  const toggleWord = (topicId, english) => {
    setWordSelections((prev) => {
      const current = prev[topicId];
      if (!current) return prev;
      const next = new Set(current);
      if (next.has(english)) next.delete(english);
      else next.add(english);
      return { ...prev, [topicId]: next };
    });
  };

  const toggleAllWordsInTopic = (topicId, words) => {
    setWordSelections((prev) => {
      const current = prev[topicId];
      const allSelected = !current || current.size === words.length;
      if (allSelected) {
        return { ...prev, [topicId]: new Set() };
      }
      return { ...prev, [topicId]: new Set(words.map((w) => w.english)) };
    });
  };

  const isWordSelected = (topicId, english) => {
    const selections = wordSelections[topicId];
    if (!selections) return true; // Not initialized yet = all selected
    return selections.has(english);
  };

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
          {ALL_TOPICS.map((topic) => {
            const isExpanded = expandedTopic === topic.id;
            return (
              <div
                key={topic.id}
                className={`v-topic-card ${selectedTopics.has(topic.id) ? "selected" : ""} ${isExpanded ? "expanded" : ""}`}
              >
                <div className="v-topic-card-main" onClick={() => toggleTopic(topic.id)}>
                  <span className="v-topic-name">{topic.topicName}</span>
                  <span className="v-topic-count">{topic.words.length} từ</span>
                </div>
                <button
                  className={`v-topic-preview-btn ${isExpanded ? "active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isExpanded) {
                      initWordSelections(topic.id, topic.words);
                    }
                    setExpandedTopic(isExpanded ? null : topic.id);
                  }}
                  title="Xem trước từ vựng"
                >
                  {isExpanded ? "✕" : "👁"}
                </button>
                {isExpanded && (
                  <div className="v-topic-words-preview slide-up">
                    <div className="v-preview-select-all">
                      <button
                        className="v-preview-select-all-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAllWordsInTopic(topic.id, topic.words);
                        }}
                      >
                        {wordSelections[topic.id] && wordSelections[topic.id].size === topic.words.length
                          ? "Bỏ chọn tất cả"
                          : "Chọn tất cả"}
                      </button>
                    </div>
                    {topic.words.map((w, i) => (
                      <label key={i} className="v-preview-word v-preview-word-check">
                        <input
                          type="checkbox"
                          className="v-preview-checkbox"
                          checked={isWordSelected(topic.id, w.english)}
                          onChange={() => toggleWord(topic.id, w.english)}
                        />
                        <span className="v-pw-en">{w.english}</span>
                        <span className="v-pw-arrow">→</span>
                        <span className="v-pw-vn">{w.vietnamese}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Name input - only for 2P mode */}
        {mode === "2p" && (
          <div className="v-name-input">
            <label htmlFor="v-player-name">Tên của bạn</label>
            <input
              id="v-player-name"
              type="text"
              className="input-field"
              placeholder="Nhập tên..."
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={20}
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>
        )}

        {/* Mode toggle */}
        <div className="v-mode-toggle">
          <button
            className={`v-mode-btn ${mode === "1p" ? "active" : ""}`}
            onClick={() => setMode("1p")}
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
              disabled={selectedTopics.size === 0}
            >
              🚀 Bắt Đầu
            </button>
          </div>
        )}

        {mode === "2p" && (
          <div className="v-setup-actions">
            <button
              className="btn btn-primary btn-large"
              onClick={handleJoinDuo}
              disabled={isJoiningDuo || !playerName.trim() || selectedTopics.size === 0}
            >
              {isJoiningDuo ? (
                <span className="loading-spinner"></span>
              ) : (
                "⚔️ Chơi 2 Người"
              )}
            </button>
          </div>
        )}

        {error && (
          <div className="error-message slide-up" style={{ marginTop: 16 }}>
            <span>⚠️</span> {error}
          </div>
        )}

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
