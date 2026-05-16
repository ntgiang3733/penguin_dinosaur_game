import "../VocabGame.css";

export default function ModeSelector({ onSelectMode }) {
  return (
    <div className="mode-selector">
      <h1>PENGUIN - DINOSAUR</h1>
      <p className="mode-subtitle">Chọn chế độ chơi</p>

      <div className="mode-cards">
        <div className="mode-card glass-card" onClick={() => onSelectMode("chain")}>
          <div className="mode-card-icon">🔗</div>
          <div className="mode-card-info">
            <h3>Nối Chữ</h3>
            <p>Ghép từ tiếng Anh nối tiếp nhau. Từ mới phải bắt đầu bằng chữ cái cuối của từ trước.</p>
          </div>
        </div>

        <div className="mode-card glass-card" onClick={() => onSelectMode("vocab")}>
          <div className="mode-card-icon">📝</div>
          <div className="mode-card-info">
            <h3>Học Từ Mới</h3>
            <p>Dịch từ tiếng Việt sang tiếng Anh. Gõ từng chữ cái để hoàn thành từ. Có gợi ý khi cần.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
