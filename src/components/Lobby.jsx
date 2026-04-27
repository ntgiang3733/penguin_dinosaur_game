import { useState } from "react";
import { createRoom, joinRoom } from "../firebase/gameService";

export default function Lobby({ onJoinedRoom }) {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState(null); // null, 'create', 'join'

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
          <div className="logo-icon">🔤</div>
          <h1 className="game-title">Word Chain</h1>
          <p className="game-subtitle">Nối Từ Tiếng Anh Online</p>
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
              onClick={() => setMode("create")}
              disabled={!playerName.trim()}
            >
              <span className="btn-icon">🏠</span>
              Tạo Phòng Mới
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setMode("join")}
              disabled={!playerName.trim()}
            >
              <span className="btn-icon">🚪</span>
              Tham Gia Phòng
            </button>
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
