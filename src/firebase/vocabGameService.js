import { db } from "./config";
import {
  ref,
  set,
  get,
  update,
  onValue,
  off,
  onDisconnect,
  remove,
} from "firebase/database";

function generateRoomId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generatePlayerId() {
  return "player_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
}

/**
 * Create a new vocabulary game room
 */
export async function createVocabRoom(playerName, selectedTopics, gameWords) {
  const roomId = generateRoomId();
  const playerId = generatePlayerId();
  const roomRef = ref(db, `vocabRooms/${roomId}`);

  const snapshot = await get(roomRef);
  if (snapshot.exists()) {
    return createVocabRoom(playerName, selectedTopics, gameWords);
  }

  const roomData = {
    status: "waiting",
    selectedTopics,
    gameWords,
    currentWordIndex: 0,
    currentWordStartTime: null,
    player1Answered: false,
    player2Answered: false,
    winner: null,
    finishReason: null,
    createdAt: Date.now(),
    players: {
      player1: {
        name: playerName,
        score: 0,
        wordsCompleted: 0,
        id: playerId,
        connected: true,
      },
    },
  };

  await set(roomRef, roomData);

  const playerRef = ref(db, `vocabRooms/${roomId}/players/player1/connected`);
  onDisconnect(playerRef).set(false);

  return { roomId, playerId, playerRole: "player1" };
}

/**
 * Join an existing vocabulary game room
 */
export async function joinVocabRoom(roomId, playerName) {
  const roomRef = ref(db, `vocabRooms/${roomId}`);
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
      wordsCompleted: 0,
      id: playerId,
      connected: true,
    },
    status: "playing",
    currentWordStartTime: Date.now(),
  });

  const playerRef = ref(db, `vocabRooms/${roomId}/players/player2/connected`);
  onDisconnect(playerRef).set(false);

  return { roomId, playerId, playerRole: "player2" };
}

/**
 * Submit an answer for the current word. Called by a player when they finish typing.
 * Returns the points earned (word length - hints used, min 0).
 */
export async function submitVocabAnswer(roomId, playerRole, points, hintsUsed) {
  const roomRef = ref(db, `vocabRooms/${roomId}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) return;

  const roomData = snapshot.val();
  if (roomData.status !== "playing") return;
  if (roomData[`${playerRole}Answered`]) return; // Already answered

  const currentScore = roomData.players[playerRole]?.score || 0;
  const currentCompleted = roomData.players[playerRole]?.wordsCompleted || 0;

  await update(roomRef, {
    [`${playerRole}Answered`]: true,
    [`players/${playerRole}/score`]: currentScore + points,
    [`players/${playerRole}/wordsCompleted`]: currentCompleted + 1,
  });
}

/**
 * Advance to the next word. Called when both players have answered or timer expired.
 * Only advances if the currentWordIndex hasn't changed (prevents double-advance).
 */
export async function advanceVocabWord(roomId, expectedIndex) {
  const roomRef = ref(db, `vocabRooms/${roomId}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) return;

  const roomData = snapshot.val();
  if (roomData.status !== "playing") return;
  if (roomData.currentWordIndex !== expectedIndex) return; // Already advanced

  const nextIndex = expectedIndex + 1;

  if (nextIndex >= roomData.gameWords.length) {
    // Game over — determine winner
    const p1Score = roomData.players?.player1?.score || 0;
    const p2Score = roomData.players?.player2?.score || 0;
    let winner = null;
    if (p1Score > p2Score) winner = "player1";
    else if (p2Score > p1Score) winner = "player2";
    else winner = "draw";

    await update(roomRef, {
      status: "finished",
      winner,
      finishReason: "complete",
      currentWordIndex: nextIndex,
      player1Answered: false,
      player2Answered: false,
    });
  } else {
    await update(roomRef, {
      currentWordIndex: nextIndex,
      currentWordStartTime: Date.now(),
      player1Answered: false,
      player2Answered: false,
    });
  }
}

/**
 * Listen to room changes in real-time
 */
export function listenToVocabRoom(roomId, callback) {
  const roomRef = ref(db, `vocabRooms/${roomId}`);
  const unsubscribe = onValue(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    }
  });
  return () => off(roomRef);
}

/**
 * Delete a vocabulary room
 */
export async function deleteVocabRoom(roomId) {
  const roomRef = ref(db, `vocabRooms/${roomId}`);
  await remove(roomRef);
}
