import { useState, useEffect } from "react";
import "./App.css";
import ModeSelector from "./components/ModeSelector";
import Lobby from "./components/Lobby";
import WaitingRoom from "./components/WaitingRoom";
import GameBoard from "./components/GameBoard";
import GameOver from "./components/GameOver";
import VocabularySetup from "./components/vocabulary/VocabularySetup";
import VocabularyWaiting from "./components/vocabulary/VocabularyWaiting";
import VocabularyGame from "./components/vocabulary/VocabularyGame";
import VocabularyGameOver from "./components/vocabulary/VocabularyGameOver";
import { listenToRoom, resetRoom, deleteRoom } from "./firebase/gameService";

function App() {
  // ---- Shared state ----
  const [gameMode, setGameMode] = useState(null); // null | 'chain' | 'vocab'
  const [gameState, setGameState] = useState("lobby");

  // ---- Chain game state ----
  const [roomId, setRoomId] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [playerRole, setPlayerRole] = useState(null);
  const [roomData, setRoomData] = useState(null);

  // ---- Vocab game state ----
  const [vocabIsLocal, setVocabIsLocal] = useState(true);
  const [vocabRoomId, setVocabRoomId] = useState(null);
  const [vocabPlayerRole, setVocabPlayerRole] = useState(null);
  const [vocabGameWords, setVocabGameWords] = useState(null);
  const [vocabInitialRoomData, setVocabInitialRoomData] = useState(null);
  const [vocabFinalResult, setVocabFinalResult] = useState(null);
  const [vocabFinalRoomData, setVocabFinalRoomData] = useState(null);

  // ---- Chain game: Listen to room changes ----
  useEffect(() => {
    if (!roomId || gameMode !== "chain") return;

    const unsubscribe = listenToRoom(roomId, (data) => {
      setRoomData(data);

      if (data.status === "waiting") {
        setGameState("waiting");
      } else if (data.status === "playing") {
        setGameState("playing");
      } else if (data.status === "finished") {
        setGameState("finished");
      }
    });

    return () => unsubscribe();
  }, [roomId, gameMode]);

  // ---- Reset everything ----
  const handleBackToModeSelect = () => {
    setGameMode(null);
    setGameState("lobby");
    setRoomId(null);
    setPlayerId(null);
    setPlayerRole(null);
    setRoomData(null);
    setVocabIsLocal(true);
    setVocabRoomId(null);
    setVocabPlayerRole(null);
    setVocabGameWords(null);
    setVocabInitialRoomData(null);
    setVocabFinalResult(null);
    setVocabFinalRoomData(null);
  };

  // ---- Chain game handlers ----
  const handleJoinedRoom = ({ roomId, playerId, playerRole }) => {
    setRoomId(roomId);
    setPlayerId(playerId);
    setPlayerRole(playerRole);
  };

  const handlePlayAgain = async () => {
    try {
      await resetRoom(roomId);
    } catch (err) {
      console.error("Reset error:", err);
    }
  };

  const handleBackToLobby = () => {
    setGameState("lobby");
    setRoomId(null);
    setPlayerId(null);
    setPlayerRole(null);
    setRoomData(null);
  };

  // ---- Vocab game handlers ----
  const handleVocabStart1P = (words) => {
    setVocabGameWords(words);
    setVocabIsLocal(true);
    setVocabFinalResult(null);
    setVocabFinalRoomData(null);
    setGameState("playing");
  };

  const handleVocabStart2P = (roomId, playerRole) => {
    setVocabRoomId(roomId);
    setVocabPlayerRole(playerRole);
    setVocabIsLocal(false);
    setVocabFinalResult(null);
    setVocabFinalRoomData(null);
    setGameState("waiting");
  };

  const handleVocabOpponentJoined = (roomData) => {
    setVocabInitialRoomData(roomData);
    setGameState("playing");
  };

  const handleVocabFinish = (resultOrRoomData) => {
    if (vocabIsLocal) {
      setVocabFinalResult(resultOrRoomData);
    } else {
      setVocabFinalRoomData(resultOrRoomData);
    }
    setGameState("finished");
  };

  const handleVocabPlayAgain = () => {
    // Go back to vocab setup
    setGameState("lobby");
    setVocabRoomId(null);
    setVocabPlayerRole(null);
    setVocabGameWords(null);
    setVocabInitialRoomData(null);
    setVocabFinalResult(null);
    setVocabFinalRoomData(null);
  };

  const handleChainBackToModeSelect = () => {
    handleBackToModeSelect();
  };

  return (
    <div className="app">
      <div className="bg-decoration">
        <div className="bg-orb orb-1"></div>
        <div className="bg-orb orb-2"></div>
        <div className="bg-orb orb-3"></div>
      </div>

      {/* ---- Mode Selector ---- */}
      {gameMode === null && (
        <ModeSelector onSelectMode={setGameMode} />
      )}

      {/* ---- Chain Game (unchanged) ---- */}
      {gameMode === "chain" && gameState === "lobby" && (
        <Lobby
          onJoinedRoom={handleJoinedRoom}
          onBackToModeSelect={handleChainBackToModeSelect}
        />
      )}

      {gameMode === "chain" && gameState === "waiting" && (
        <WaitingRoom roomId={roomId} />
      )}

      {gameMode === "chain" && gameState === "playing" && roomData && (
        <GameBoard
          roomData={roomData}
          roomId={roomId}
          playerRole={playerRole}
        />
      )}

      {gameMode === "chain" && gameState === "finished" && roomData && (
        <GameOver
          roomData={roomData}
          playerRole={playerRole}
          onPlayAgain={handlePlayAgain}
          onBackToLobby={handleBackToLobby}
        />
      )}

      {/* ---- Vocab Game ---- */}
      {gameMode === "vocab" && gameState === "lobby" && (
        <VocabularySetup
          onStart1P={handleVocabStart1P}
          onStart2P={handleVocabStart2P}
          onBack={handleBackToModeSelect}
        />
      )}

      {gameMode === "vocab" && gameState === "waiting" && (
        <VocabularyWaiting
          roomId={vocabRoomId}
          onOpponentJoined={handleVocabOpponentJoined}
        />
      )}

      {gameMode === "vocab" && gameState === "playing" && vocabIsLocal && vocabGameWords && (
        <VocabularyGame
          words={vocabGameWords}
          onFinish={handleVocabFinish}
        />
      )}

      {gameMode === "vocab" && gameState === "playing" && !vocabIsLocal && vocabRoomId && (
        <VocabularyGame
          roomId={vocabRoomId}
          playerRole={vocabPlayerRole}
          initialRoomData={vocabInitialRoomData}
          onFinish={handleVocabFinish}
        />
      )}

      {gameMode === "vocab" && gameState === "finished" && (
        <VocabularyGameOver
          result={vocabFinalResult}
          isLocal={vocabIsLocal}
          playerRole={vocabPlayerRole}
          roomData={vocabFinalRoomData}
          onPlayAgain={handleVocabPlayAgain}
          onBackToHome={handleBackToModeSelect}
        />
      )}
    </div>
  );
}

export default App;
