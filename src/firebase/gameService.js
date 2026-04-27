import { db } from "./config";
import {
  ref,
  set,
  get,
  update,
  onValue,
  off,
  push,
  serverTimestamp,
  onDisconnect,
  remove,
} from "firebase/database";

/**
 * Generate a random 6-character room code
 */
function generateRoomId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a unique player ID
 */
function generatePlayerId() {
  return "player_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
}

/**
 * Create a new game room
 */
export async function createRoom(playerName) {
  const roomId = generateRoomId();
  const playerId = generatePlayerId();
  const roomRef = ref(db, `rooms/${roomId}`);

  // Check if room already exists (unlikely but safe)
  const snapshot = await get(roomRef);
  if (snapshot.exists()) {
    return createRoom(playerName); // Retry with new ID
  }

  const roomData = {
    status: "waiting",
    players: {
      player1: {
        name: playerName,
        score: 0,
        id: playerId,
        connected: true,
      },
    },
    currentTurn: "player1",
    turnStartTime: null,
    lastWord: "",
    words: [],
    winner: null,
    createdAt: Date.now(),
  };

  await set(roomRef, roomData);

  // Set up disconnect handler
  const playerRef = ref(db, `rooms/${roomId}/players/player1/connected`);
  onDisconnect(playerRef).set(false);

  return { roomId, playerId, playerRole: "player1" };
}

/**
 * Join an existing room
 */
export async function joinRoom(roomId, playerName) {
  const roomRef = ref(db, `rooms/${roomId}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) {
    throw new Error("Phòng không tồn tại. Vui lòng kiểm tra lại mã phòng.");
  }

  const roomData = snapshot.val();

  if (roomData.status !== "waiting") {
    throw new Error("Phòng đã bắt đầu hoặc kết thúc.");
  }

  if (roomData.players?.player2) {
    throw new Error("Phòng đã đủ người chơi.");
  }

  const playerId = generatePlayerId();

  await update(roomRef, {
    "players/player2": {
      name: playerName,
      score: 0,
      id: playerId,
      connected: true,
    },
    status: "playing",
    turnStartTime: Date.now(),
  });

  // Set up disconnect handler
  const playerRef = ref(db, `rooms/${roomId}/players/player2/connected`);
  onDisconnect(playerRef).set(false);

  return { roomId, playerId, playerRole: "player2" };
}

/**
 * Submit a word to the game
 */
export async function submitWord(roomId, word, playerRole) {
  const roomRef = ref(db, `rooms/${roomId}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) {
    throw new Error("Phòng không tồn tại.");
  }

  const roomData = snapshot.val();

  if (roomData.status !== "playing") {
    throw new Error("Game chưa bắt đầu hoặc đã kết thúc.");
  }

  if (roomData.currentTurn !== playerRole) {
    throw new Error("Chưa đến lượt của bạn.");
  }

  const lowerWord = word.toLowerCase().trim();
  const currentWords = roomData.words || [];
  const currentScore = roomData.players[playerRole]?.score || 0;
  const nextTurn = playerRole === "player1" ? "player2" : "player1";

  const newScore = currentScore + lowerWord.length;
  const isWinner = newScore >= 70;

  const updates = {
    lastWord: lowerWord,
    words: [...currentWords, lowerWord],
    currentTurn: nextTurn,
    turnStartTime: Date.now(),
    [`players/${playerRole}/score`]: newScore,
  };

  if (isWinner) {
    updates.status = "finished";
    updates.winner = playerRole;
    updates.finishReason = "score_limit";
  }

  await update(roomRef, updates);
}

/**
 * Handle timeout - the current player loses their turn and the other player wins
 */
export async function handleTimeout(roomId, loserRole) {
  const roomRef = ref(db, `rooms/${roomId}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) return;

  const roomData = snapshot.val();
  if (roomData.status !== "playing") return;

  const winnerRole = loserRole === "player1" ? "player2" : "player1";

  await update(roomRef, {
    status: "finished",
    winner: winnerRole,
    finishReason: "timeout",
  });
}

/**
 * Listen to room changes in real-time
 */
export function listenToRoom(roomId, callback) {
  const roomRef = ref(db, `rooms/${roomId}`);
  const unsubscribe = onValue(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    }
  });

  return () => off(roomRef);
}

/**
 * Clean up room when done
 */
export async function deleteRoom(roomId) {
  const roomRef = ref(db, `rooms/${roomId}`);
  await remove(roomRef);
}

/**
 * Reset room for a rematch
 */
export async function resetRoom(roomId) {
  const roomRef = ref(db, `rooms/${roomId}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) return;

  const roomData = snapshot.val();

  await update(roomRef, {
    status: "playing",
    currentTurn: "player1",
    turnStartTime: Date.now(),
    lastWord: "",
    words: [],
    winner: null,
    finishReason: null,
    "players/player1/score": 0,
    "players/player2/score": 0,
  });
}
