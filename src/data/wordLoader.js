import { VOCAB_WORDS_PER_GAME } from "../constants";

/**
 * Parse a single topic file. Line 1 = topic name, subsequent lines = english: vietnamese
 */
function parseTopicFile(fileName, rawText) {
  const lines = rawText.trim().split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;

  const topicName = lines[0];
  const words = [];
  const seenEnglish = new Set();

  for (let i = 1; i < lines.length; i++) {
    const colonIdx = lines[i].indexOf(":");
    if (colonIdx === -1) continue;
    const english = lines[i].substring(0, colonIdx).trim().toLowerCase();
    const vietnamese = lines[i].substring(colonIdx + 1).trim().toLowerCase();
    if (!english || !vietnamese) continue;
    if (!/^[a-z]+$/.test(english)) continue;
    if (seenEnglish.has(english)) continue;
    seenEnglish.add(english);
    words.push({ english, vietnamese });
  }

  if (words.length === 0) return null;
  return { id: fileName.replace(".txt", ""), topicName, words };
}

/**
 * Load all topic files using Vite's ?raw imports.
 * Returns array of { id, topicName, words: [{english, vietnamese}] }
 */
export function getTopicList() {
  const modules = import.meta.glob("./words/*.txt", { query: "?raw", import: "default", eager: true });

  const topics = [];
  for (const [path, rawText] of Object.entries(modules)) {
    const fileName = path.split("/").pop();
    const topic = parseTopicFile(fileName, rawText);
    if (topic) topics.push(topic);
  }

  return topics.sort((a, b) => a.topicName.localeCompare(b.topicName, "vi"));
}

/**
 * Fisher-Yates shuffle
 */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Pick random words from selected topics.
 * @param {string[]} selectedTopicIds - array of topic file names (without .txt)
 * @param {number|null} count - number of words to pick, or null for all words
 * @returns {{english: string, vietnamese: string}[]}
 */
export function pickRandomWords(selectedTopicIds, count = null) {
  const allTopics = getTopicList();
  const selected = allTopics.filter((t) => selectedTopicIds.includes(t.id));

  // If none selected or "all" selected, use all topics
  const pool = selected.length === 0 || selectedTopicIds.includes("all")
    ? allTopics
    : selected;

  const allWords = pool.flatMap((t) => t.words);
  const shuffled = shuffle(allWords);

  if (count === null || count >= shuffled.length) return shuffled;
  return shuffled.slice(0, count);
}

/**
 * Pick 10 random words for a 2-player game.
 */
export function pickWordsFor2P(selectedTopicIds) {
  return pickRandomWords(selectedTopicIds, VOCAB_WORDS_PER_GAME);
}

/**
 * Pick `count` random words from a pre-filtered word list.
 * @param {{english: string, vietnamese: string}[]} words
 * @param {number} count
 */
export function pickWordsFromList(words, count) {
  const shuffled = shuffle(words);
  if (count >= shuffled.length) return shuffled;
  return shuffled.slice(0, count);
}
