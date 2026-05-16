import { useState, useEffect, useRef, useReducer, useCallback } from "react";
import Timer from "../Timer";
import {
  listenToVocabRoom,
  submitVocabAnswer,
  advanceVocabWord,
} from "../../firebase/vocabGameService";
import { VOCAB_TIME_PER_LETTER, VOCAB_HINT_PENALTY } from "../../constants";
import "../../VocabGame.css";

/* ---- 1P State Reducer ---- */
function gameReducer(state, action) {
  switch (action.type) {
    case "CORRECT_LETTER":
      return { ...state, correctCount: state.correctCount + 1 };

    case "WORD_COMPLETE": {
      const word = state.words[state.currentIndex];
      const points = Math.max(0, word.english.length - state.hintsThisWord);
      return {
        ...state,
        score: state.score + points,
        wordsCompleted: state.wordsCompleted + 1,
        history: [
          ...state.history,
          {
            english: word.english,
            vietnamese: word.vietnamese,
            points,
            hints: state.hintsThisWord,
          },
        ],
        lastWordResult: "correct",
      };
    }
    case "USE_HINT": {
      const word = state.words[state.currentIndex];
      const revealed = new Set(state.hintRevealed);
      let hintedPos = -1;
      for (let i = 0; i < word.english.length; i++) {
        if (i >= state.correctCount && !revealed.has(i)) {
          revealed.add(i);
          hintedPos = i;
          break;
        }
      }
      // Auto-fill: advance correctCount past the hinted letter
      const newCorrectCount = hintedPos >= 0 ? hintedPos + 1 : state.correctCount;
      return {
        ...state,
        hintRevealed: revealed,
        correctCount: newCorrectCount,
        hintsThisWord: state.hintsThisWord + 1,
        hintsUsedTotal: state.hintsUsedTotal + 1,
      };
    }
    case "NEXT_WORD": {
      const nextIndex = state.currentIndex + 1;
      if (nextIndex >= state.words.length) {
        return { ...state, finished: true };
      }
      return {
        ...state,
        currentIndex: nextIndex,
        correctCount: 0,
        hintsThisWord: 0,
        hintRevealed: new Set(),
        lastWordResult: null,
      };
    }
    case "SHOW_RESULT":
      return { ...state, lastWordResult: action.result };
    case "FINISH":
      return { ...state, finished: true };
    default:
      return state;
  }
}

function init1PState(words) {
  return {
    words,
    currentIndex: 0,
    correctCount: 0,
    hintsThisWord: 0,
    hintsUsedTotal: 0,
    hintRevealed: new Set(),
    score: 0,
    wordsCompleted: 0,
    history: [],
    finished: false,
    lastWordResult: null,
  };
}

/* ---- Component ---- */
export default function VocabularyGame({
  words,            // 1P: word list
  roomId,           // 2P: Firebase room ID
  playerRole,       // 2P: "player1" | "player2"
  initialRoomData,  // 2P: initial room data from joining
  onFinish,
}) {
  const is1P = !!words;

  // 1P state
  const [state1P, dispatch1P] = useReducer(gameReducer, words, init1PState);

  // 2P state
  const [roomData, setRoomData] = useState(initialRoomData || null);
  const [correctCount2P, setCorrectCount2P] = useState(0);
  const [hintsThisWord2P, setHintsThisWord2P] = useState(0);
  const [hintRevealed2P, setHintRevealed2P] = useState(new Set());
  const [wordResult2P, setWordResult2P] = useState(null);
  const [transitioning, setTransitioning] = useState(false);

  // Shared
  const inputRef = useRef(null);
  const submittedRef = useRef(false); // Prevent double-submission in 2P
  const [errorPos, setErrorPos] = useState(-1);

  // Derive current word
  const currentWord = is1P
    ? state1P.words[state1P.currentIndex]
    : roomData?.gameWords?.[roomData.currentWordIndex];

  const correctCount = is1P ? state1P.correctCount : correctCount2P;
  const hintsThisWord = is1P ? state1P.hintsThisWord : hintsThisWord2P;
  const hintRevealed = is1P ? state1P.hintRevealed : hintRevealed2P;
  const myScore = is1P
    ? state1P.score
    : roomData?.players?.[playerRole]?.score || 0;
  const wordsCompleted = is1P
    ? state1P.wordsCompleted
    : roomData?.players?.[playerRole]?.wordsCompleted || 0;
  const totalWords = is1P ? state1P.words.length : (roomData?.gameWords?.length || 10);
  const amAnswered = is1P ? false : roomData?.[`${playerRole}Answered`];
  const otherAnswered = is1P
    ? false
    : roomData?.[`${playerRole === "player1" ? "player2" : "player1"}Answered`];
  const opponentName = is1P
    ? ""
    : roomData?.players?.[playerRole === "player1" ? "player2" : "player1"]?.name || "Đối thủ";

  // 2P: Listen to Firebase room
  useEffect(() => {
    if (is1P || !roomId) return;

    const unsub = listenToVocabRoom(roomId, (data) => {
      setRoomData((prev) => {
        // Check if word index changed
        if (prev && data.currentWordIndex !== prev.currentWordIndex) {
          setCorrectCount2P(0);
          setHintsThisWord2P(0);
          setHintRevealed2P(new Set());
          setWordResult2P(null);
          setTransitioning(false);
          setErrorPos(-1);
          submittedRef.current = false;
        }
        // Check if game finished
        if (data.status === "finished" && prev?.status === "playing") {
          // Small delay to show final word
          setTimeout(() => onFinish(data), 1500);
        }
        return data;
      });
    });

    return () => unsub();
  }, [is1P, roomId, onFinish]);

  // Auto-focus input
  useEffect(() => {
    if (inputRef.current && currentWord && !amAnswered && !transitioning) {
      inputRef.current.focus();
    }
  }, [currentWord, correctCount, amAnswered, transitioning]);

  // Get the target word's letters for display
  const targetLetters = currentWord ? currentWord.english.split("") : [];

  // Determine state for each letter position
  function getLetterState(i) {
    if (i < correctCount) return "correct";
    if (hintRevealed.has(i)) return "hint";
    if (i === correctCount && !amAnswered) return "current";
    return "empty";
  }

  // Handle key input
  const handleKeyDown = useCallback(
    (e) => {
      if (!currentWord || amAnswered || transitioning) return;
      // Ignore non-letter keys
      if (e.key.length !== 1 || !/^[a-zA-Z]$/.test(e.key)) {
        return;
      }
      e.preventDefault();

      const typed = e.key.toLowerCase();
      const target = currentWord.english[correctCount];

      if (typed === target) {
        setErrorPos(-1);
        if (is1P) {
          dispatch1P({ type: "CORRECT_LETTER" });
        } else {
          setCorrectCount2P((c) => c + 1);
        }
      } else {
        setErrorPos(correctCount);
        setTimeout(() => setErrorPos(-1), 400);
      }
    },
    [currentWord, correctCount, amAnswered, transitioning, is1P]
  );

  // Check word completion for 2P
  useEffect(() => {
    if (is1P || !currentWord || amAnswered || submittedRef.current) return;
    if (correctCount2P >= currentWord.english.length) {
      submittedRef.current = true;
      handleWordComplete2P();
    }
  }, [correctCount2P, currentWord, amAnswered, is1P]);

  // Check word completion for 1P
  const stateRef = useRef(state1P);
  stateRef.current = state1P;

  useEffect(() => {
    if (!is1P || !currentWord) return;
    if (state1P.correctCount >= currentWord.english.length && !state1P.lastWordResult) {
      dispatch1P({ type: "WORD_COMPLETE" });
    }
  }, [state1P.correctCount, is1P]);

  // Handle 1P word transition after completion
  useEffect(() => {
    if (!is1P || state1P.lastWordResult !== "correct") return;

    const s = stateRef.current;
    const timer = setTimeout(() => {
      if (s.currentIndex + 1 >= s.words.length) {
        dispatch1P({ type: "FINISH" });
        onFinish({
          score: s.score,
          wordsCompleted: s.wordsCompleted,
          hintsUsedTotal: s.hintsUsedTotal,
          history: s.history,
        });
      } else {
        dispatch1P({ type: "NEXT_WORD" });
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [state1P.lastWordResult, is1P]);

  async function handleWordComplete2P() {
    if (!currentWord || !roomId || amAnswered) return;
    const points = Math.max(0, currentWord.english.length - hintsThisWord2P);
    const prevIndex = roomData?.currentWordIndex;

    try {
      await submitVocabAnswer(roomId, playerRole, points, hintsThisWord2P);
      setWordResult2P("correct");

      // Try to advance after a short delay
      setTimeout(async () => {
        try {
          await advanceVocabWord(roomId, prevIndex);
        } catch (err) {
          console.error("Advance error:", err);
        }
      }, 600);
    } catch (err) {
      console.error("Submit error:", err);
    }
  }

  // Timer handler for 2P
  const handleTimerExpired = useCallback(async () => {
    if (is1P || amAnswered || transitioning) return;
    setTransitioning(true);
    setWordResult2P("timeout");
    const prevIndex = roomData?.currentWordIndex;

    setTimeout(async () => {
      try {
        await advanceVocabWord(roomId, prevIndex);
      } catch (err) {
        console.error("Advance after timeout error:", err);
      }
    }, 600);
  }, [is1P, amAnswered, transitioning, roomId, roomData]);

  // Hint handler
  const handleHint = () => {
    if (!currentWord) return;
    if (is1P) {
      dispatch1P({ type: "USE_HINT" });
    } else {
      const revealed = new Set(hintRevealed2P);
      let hintedPos = -1;
      for (let i = 0; i < currentWord.english.length; i++) {
        if (i >= correctCount2P && !revealed.has(i)) {
          revealed.add(i);
          hintedPos = i;
          break;
        }
      }
      setHintRevealed2P(revealed);
      setHintsThisWord2P((h) => h + 1);
      if (hintedPos >= 0) {
        setCorrectCount2P(hintedPos + 1);
      }
    }
  };

  const allLettersRevealed = currentWord
    ? correctCount + hintRevealed.size >= currentWord.english.length
    : false;

  const timerDuration = currentWord
    ? currentWord.english.length * VOCAB_TIME_PER_LETTER
    : 30;

  // Compute visual display string for word
  const wordResult = is1P ? state1P.lastWordResult : wordResult2P;

  return (
    <div className="v-game-container">
      <div className="v-game-card glass-card">
        {/* Top bar */}
        <div className="v-game-topbar">
          <div className="v-score-display">⭐ {myScore} điểm</div>
          {is1P ? (
            <div className="v-progress-display">Từ {wordsCompleted + 1} / {totalWords}</div>
          ) : (
            <div className="v-progress-display">
              Từ {(roomData?.currentWordIndex || 0) + 1} / {totalWords}
            </div>
          )}
        </div>

        {/* 2P: Timer */}
        {!is1P && roomData?.currentWordStartTime && currentWord && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <Timer
              turnStartTime={roomData.currentWordStartTime}
              duration={timerDuration}
              onTimeout={handleTimerExpired}
              isMyTurn={!amAnswered}
            />
          </div>
        )}

        {/* 2P: Player status */}
        {!is1P && (
          <div className="v-player-progress">
            <div className={`v-player-status ${playerRole === "player1" ? "me" : "opponent"}`}>
              <div className={`v-player-dot ${roomData?.player1Answered ? "answered" : "waiting"}`}></div>
              <span>{roomData?.players?.player1?.name || "Player 1"}</span>
            </div>
            <div className={`v-player-status ${playerRole === "player2" ? "me" : "opponent"}`}>
              <div className={`v-player-dot ${roomData?.player2Answered ? "answered" : "waiting"}`}></div>
              <span>{roomData?.players?.player2?.name || "Player 2"}</span>
            </div>
          </div>
        )}

        {/* Vietnamese clue */}
        {currentWord && (
          <div className="v-clue-area">
            <div className="v-clue-label">Dịch sang tiếng Anh:</div>
            <div className="v-clue-word">{currentWord.vietnamese}</div>
          </div>
        )}

        {/* Letter grid */}
        {currentWord && (
          <div className="v-letter-grid">
            {targetLetters.map((letter, i) => {
              const state = getLetterState(i);
              let displayChar = "";
              if (state === "correct" || state === "hint") displayChar = letter;
              else if (state === "current" && !amAnswered) displayChar = "";

              return (
                <div
                  key={i}
                  className={`v-letter-box ${state} ${errorPos === i ? "error" : ""}`}
                >
                  {state === "empty" || (state === "current" && !amAnswered)
                    ? "_"
                    : letter}
                </div>
              );
            })}
          </div>
        )}

        {/* Word result message */}
        <div className={`v-word-result ${wordResult === "correct" ? "correct-word" : wordResult === "timeout" ? "timeout-word" : ""}`}>
          {wordResult === "correct" && <>✅ Chính xác! +{Math.max(0, currentWord?.english.length - hintsThisWord || 0)} điểm</>}
          {wordResult === "timeout" && <>⏰ Hết giờ! Không được điểm từ này</>}
        </div>

        {/* Letter input area */}
        {currentWord && !amAnswered && !transitioning && (
          <div className="v-input-area">
            <div className="v-input-label">
              Nhấn phím chữ cái để gõ từng ký tự ↓
            </div>
            <div className="v-input-wrapper">
              <div className="v-input-cursor">▎</div>
              <input
                ref={inputRef}
                className="v-letter-input"
                value=""
                onKeyDown={handleKeyDown}
                placeholder="gõ vào đây..."
                readOnly
                disabled={!!amAnswered || !!transitioning}
                autoComplete="off"
                spellCheck="false"
                autoFocus
              />
            </div>
          </div>
        )}

        {amAnswered && !is1P && (
          <div style={{ textAlign: "center", color: "var(--accent-green)", marginBottom: 16 }}>
            ✅ Đã trả lời — đợi người kia...
          </div>
        )}

        {/* Actions */}
        <div className="v-game-actions">
          {!is1P && !amAnswered && !transitioning && (
            <button
              className="v-hint-btn"
              onClick={handleHint}
              disabled={allLettersRevealed}
            >
              💡 Gợi ý
              <span className="v-hint-penalty">-{VOCAB_HINT_PENALTY} điểm</span>
            </button>
          )}

          {is1P && !state1P.finished && (
            <>
              <button
                className="v-hint-btn"
                onClick={handleHint}
                disabled={allLettersRevealed || state1P.correctCount >= (currentWord?.english.length || 0)}
              >
                💡 Gợi ý
                <span className="v-hint-penalty">-{VOCAB_HINT_PENALTY} điểm</span>
              </button>
              <button
                className="btn btn-secondary v-end-btn"
                onClick={() => {
                  dispatch1P({ type: "FINISH" });
                  const s = stateRef.current;
                  onFinish({
                    score: s.score,
                    wordsCompleted: s.wordsCompleted,
                    hintsUsedTotal: s.hintsUsedTotal,
                    history: s.history,
                  });
                }}
              >
                🛑 Kết Thúc
              </button>
            </>
          )}
        </div>

        {/* Hint count */}
        {hintsThisWord > 0 && (
          <div style={{ textAlign: "center", color: "var(--accent-orange)", fontSize: "0.82rem" }}>
            Đã dùng {hintsThisWord} gợi ý từ này
          </div>
        )}
      </div>
    </div>
  );
}
