import { useState, useEffect } from "react";
import "./App.css";
import Lobby from "./components/Lobby";
import WaitingRoom from "./components/WaitingRoom";
import GameBoard from "./components/GameBoard";
import GameOver from "./components/GameOver";
import { listenToRoom, resetRoom, deleteRoom } from "./firebase/gameService";

function App() {
  const [gameState, setGameState] = useState("lobby"); // lobby, waiting, playing, finished
  const [roomId, setRoomId] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [playerRole, setPlayerRole] = useState(null);
  const [roomData, setRoomData] = useState(null);

  // Listen to room changes
  useEffect(() => {
    if (!roomId) return;

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
  }, [roomId]);

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

  return (
    <div className="app">
      <div className="bg-decoration">
        <div className="bg-orb orb-1"></div>
        <div className="bg-orb orb-2"></div>
        <div className="bg-orb orb-3"></div>
      </div>

      {gameState === "lobby" && <Lobby onJoinedRoom={handleJoinedRoom} />}

      {gameState === "waiting" && <WaitingRoom roomId={roomId} />}

      {gameState === "playing" && roomData && (
        <GameBoard
          roomData={roomData}
          roomId={roomId}
          playerRole={playerRole}
        />
      )}

      {gameState === "finished" && roomData && (
        <GameOver
          roomData={roomData}
          playerRole={playerRole}
          onPlayAgain={handlePlayAgain}
          onBackToLobby={handleBackToLobby}
        />
      )}
    </div>
  );
}

export default App;
