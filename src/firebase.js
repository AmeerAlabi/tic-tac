import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyC_0T5Yns7afYlJDCOxAWgSJiJEMp5dOt0",
  authDomain: "tic-tac-4e330.firebaseapp.com",
  databaseURL: "https://tic-tac-4e330-default-rtdb.firebaseio.com",
  projectId: "tic-tac-4e330",
  storageBucket: "tic-tac-4e330.firebasestorage.app",
  messagingSenderId: "794899234785",
  appId: "1:794899234785:web:d2a52e58eb0d8542b45ca0"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Helper to ensure board is always a proper array based on grid size
function normalizeBoard(board, gridSize = 3) {
  const totalCells = gridSize * gridSize;
  if (!board || !Array.isArray(board)) {
    return Array(totalCells).fill("");
  }
  // Ensure correct number of elements, replace null/undefined with ""
  return Array(totalCells).fill("").map((_, i) => board[i] || "");
}

// Storage helpers for game state
export async function saveGame(code, state) {
  // Convert null values to empty strings for Firebase compatibility
  const toSave = {
    ...state,
    board: (state.board || []).map(cell => cell === null ? "" : cell)
  };
  await set(ref(db, `games/${code}`), toSave);
}

export async function loadGame(code) {
  const snapshot = await get(ref(db, `games/${code}`));
  if (!snapshot.exists()) return null;
  const data = snapshot.val();
  const gridSize = data.gridSize || 3;
  // Normalize board back to proper array
  return {
    ...data,
    board: normalizeBoard(data.board, gridSize)
  };
}

// Real-time listener for game updates
export function subscribeToGame(code, callback) {
  const gameRef = ref(db, `games/${code}`);
  return onValue(gameRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const gridSize = data.gridSize || 3;
      // Normalize board back to proper array
      callback({
        ...data,
        board: normalizeBoard(data.board, gridSize)
      });
    }
  });
}

// Analytics helpers
export async function appendAnalytic(entry) {
  try {
    const snapshot = await get(ref(db, "analytics"));
    let list = snapshot.exists() ? snapshot.val() : [];
    if (!Array.isArray(list)) list = [];
    list.push(entry);
    if (list.length > 500) list = list.slice(-500);
    await set(ref(db, "analytics"), list);
  } catch (e) {
    console.error("Analytics error:", e);
  }
}

export async function loadAnalytics() {
  try {
    const snapshot = await get(ref(db, "analytics"));
    const data = snapshot.exists() ? snapshot.val() : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
