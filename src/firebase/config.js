import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAIJGlKvjD8HkFD4SDis21PdcMF3FeVN7U",
  authDomain: "penguin-dinosaur-game.firebaseapp.com",
  databaseURL: "https://penguin-dinosaur-game-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "penguin-dinosaur-game",
  storageBucket: "penguin-dinosaur-game.firebasestorage.app",
  messagingSenderId: "245980334802",
  appId: "1:245980334802:web:f282532159852de7117b0b",
  measurementId: "G-ZJMF0EVWNB"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);