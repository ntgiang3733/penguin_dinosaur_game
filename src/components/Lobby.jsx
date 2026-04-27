import { useState } from "react";
import { createRoom, joinRoom, joinDefaultRoom } from "../firebase/gameService";

export default function Lobby({ onJoinedRoom }) {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isJoiningDefault, setIsJoiningDefault] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState(null); // null, 'create', 'join'

  const handleJoinDefault = async () => {
    if (!playerName.trim()) {
      setError("Vui lòng nhập tên của bạn");
      return;
    }

    setIsJoiningDefault(true);
    setError("");

    try {
      const result = await joinDefaultRoom(playerName.trim());
      onJoinedRoom(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsJoiningDefault(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError("Vui lòng nhập tên của bạn");
      return;
    }

    setIsCreating(true);
    setError("");

    try {
      const result = await createRoom(playerName.trim());
      onJoinedRoom(result);
    } catch (err) {
      setError("Không thể tạo phòng. Vui lòng thử lại.");
      console.error(err);
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
      const result = await joinRoom(roomCode.trim().toUpperCase(), playerName.trim());
      onJoinedRoom(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsJoining(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      if (mode === "create") handleCreateRoom();
      else if (mode === "join") handleJoinRoom();
    }
  };

  return (
    <div className="lobby-container">
      <div className="lobby-card glass-card">
        <div className="lobby-header">
          <div className="logo-icon">🐧 - 🦖</div>
          <h1 className="game-title">PENGUIN - DINOSAUR</h1>
        </div>

        <div className="lobby-rules">
          <h3>📜 Luật Chơi</h3>
          <ul>
            <li>Nhập 1 từ tiếng Anh mỗi lượt (30 giây)</li>
            <li>Từ tiếp theo phải bắt đầu bằng chữ cái cuối của từ trước</li>
            <li>Không được lặp lại từ đã dùng</li>
            <li>Điểm = số chữ cái trong từ</li>
          </ul>
        </div>

        <div className="name-input-group">
          <label htmlFor="player-name">Tên của bạn</label>
          <input
            id="player-name"
            type="text"
            placeholder="Nhập tên..."
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={handleKeyPress}
            maxLength={20}
            className="input-field"
          />
        </div>

        {!mode && (
          <div className="lobby-actions">
            <button
              className="btn btn-primary"
              onClick={handleJoinDefault}
              disabled={isJoiningDefault || !playerName.trim()}
            >
              {isJoiningDefault ? (
                <span className="loading-spinner"></span>
              ) : (
                <>
                  <span className="btn-icon">⚡</span>
                  Chơi Luôn
                </>
              )}
            </button>
            <div className="divider"><span>HOẶC</span></div>
            <div className="lobby-sub-actions">
              <button
                className="btn btn-secondary btn-small"
                onClick={() => setMode("create")}
                disabled={!playerName.trim()}
              >
                <span className="btn-icon">🏠</span>
                Tạo Phòng
              </button>
              <button
                className="btn btn-secondary btn-small"
                onClick={() => setMode("join")}
                disabled={!playerName.trim()}
              >
                <span className="btn-icon">🚪</span>
                Vào Phòng
              </button>
            </div>
          </div>
        )}

        {mode === "create" && (
          <div className="lobby-actions slide-up">
            <button
              className="btn btn-primary btn-large"
              onClick={handleCreateRoom}
              disabled={isCreating || !playerName.trim()}
            >
              {isCreating ? (
                <span className="loading-spinner"></span>
              ) : (
                <>
                  <span className="btn-icon">🎮</span>
                  Tạo Phòng & Bắt Đầu
                </>
              )}
            </button>
            <button className="btn btn-ghost" onClick={() => setMode(null)}>
              ← Quay lại
            </button>
          </div>
        )}

        {mode === "join" && (
          <div className="lobby-actions slide-up">
            <div className="room-code-input-group">
              <label htmlFor="room-code">Mã Phòng</label>
              <input
                id="room-code"
                type="text"
                placeholder="Nhập mã phòng (6 ký tự)..."
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                onKeyDown={handleKeyPress}
                maxLength={6}
                className="input-field input-room-code"
              />
            </div>
            <button
              className="btn btn-primary btn-large"
              onClick={handleJoinRoom}
              disabled={isJoining || !playerName.trim() || !roomCode.trim()}
            >
              {isJoining ? (
                <span className="loading-spinner"></span>
              ) : (
                <>
                  <span className="btn-icon">🚀</span>
                  Tham Gia
                </>
              )}
            </button>
            <button className="btn btn-ghost" onClick={() => setMode(null)}>
              ← Quay lại
            </button>
          </div>
        )}

        {error && (
          <div className="error-message slide-up">
            <span>⚠️</span> {error}
          </div>
        )}
      </div>
    </div>
  );
}
