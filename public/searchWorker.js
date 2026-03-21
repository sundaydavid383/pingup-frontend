// searchWorker.js - Web Worker for heavy search/scoring operations
// This runs off the main thread to prevent UI blocking

const STOP_WORDS = new Set([
  "the", "who", "was", "an", "is", "to", "and", "in", "he", "she", "of", "a"
]);

// Helper functions (duplicated from main thread for worker context)
const clean = (s) =>
  s
    .toLowerCase()
    .replace(/[\u2018\u2019\u201c\u201d]/g, "'")
    .replace(/[^a-z0-9'\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (s) => {
  if (!s) return [];
  return s.split(/\s+/).filter(Boolean);
};

function buildBigrams(words) {
  const pairs = [];
  for (let i = 0; i < words.length - 1; i++) {
    pairs.push(words[i] + " " + words[i + 1]);
  }
  return pairs;
}

function wordSimilarity(a, b) {
  if (a === b) return 1;
  if (b.includes(a) || a.includes(b)) return 0.85;
  return 0;
}

// Scoring function - optimized for worker
function scoreVerse(queryTokens, verse, invertedIndex, totalVerses) {
  const verseTokens = verse.tokens || tokenize(clean(verse.text));
  const tokenSet = new Set(verseTokens);

  // 1️⃣ TF-IDF
  let tfidfScore = 0;
  for (const qt of queryTokens) {
    const tf = verseTokens.filter(t => t === qt).length / verseTokens.length;
    const df = invertedIndex.get(qt)?.size || 0;
    const idf = Math.log((totalVerses + 1) / (1 + df));
    tfidfScore += tf * idf;
  }

  // 2️⃣ Positional proximity
  let positions = [];
  queryTokens.forEach(qt => {
    verseTokens.forEach((vt, idx) => {
      if (vt === qt) positions.push(idx);
    });
  });
  let proximityScore = 0;
  if (positions.length >= queryTokens.length) {
    positions.sort((a, b) => a - b);
    let distances = [];
    for (let i = 1; i < positions.length; i++) distances.push(positions[i] - positions[i - 1]);
    const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
    proximityScore = 1 / (1 + avgDistance);
  }

  // 3️⃣ Phrase boosting
  const bigrams = buildBigrams(queryTokens);
  let phraseBoost = 0;
  bigrams.forEach(bg => {
    if (verse.text.toLowerCase().includes(bg)) phraseBoost += 0.1;
  });

  // 4️⃣ Speech-tolerance
  let speechScore = 0;
  queryTokens.forEach(qt => {
    let bestSim = 0;
    verseTokens.forEach(vt => {
      bestSim = Math.max(bestSim, wordSimilarity(qt, vt));
    });
    speechScore += bestSim;
  });
  speechScore = speechScore / queryTokens.length;

  // 5️⃣ Combine
  const wTFIDF = 0.4, wProx = 0.2, wPhrase = 0.2, wSpeech = 0.2;
  const finalScore = wTFIDF * tfidfScore
    + wProx * proximityScore
    + wPhrase * phraseBoost
    + wSpeech * speechScore;

  return finalScore;
}

// Local state in worker
let verseById = new Map();
let invertedIndex = new Map();
let versesLength = 0;

// Initialize with data from main thread
function initializeIndex(data) {
  verseById = new Map(data.verseById);
  invertedIndex = new Map(data.invertedIndex);
  versesLength = data.versesLength;
}

// Perform search
function performSearch(query) {
  const cleaned = clean(query);
  const tokens = tokenize(cleaned).filter(t => !STOP_WORDS.has(t));

  if (!tokens.length) {
    return [];
  }

  let tokenSets = tokens
    .map(t => invertedIndex.get(t))
    .filter(Boolean);

  if (!tokenSets.length) {
    tokenSets = tokens.map(() => new Set(verseById.keys()));
  }

  const candidateIds = new Set(tokenSets.flatMap(s => [...s]));

  // Score all candidates
  const scored = [];
  for (const id of candidateIds) {
    const v = verseById.get(id);
    if (v) {
      const score = scoreVerse(tokens, v, invertedIndex, versesLength);
      scored.push({ ...v, _score: score });
    }
  }

  // Sort and get top 3
  scored.sort((a, b) => b._score - a._score);
  return scored.slice(0, 3);
}

// Message handler
self.onmessage = function(e) {
  const { type, payload, id } = e.data;

  switch (type) {
    case 'init':
      initializeIndex(payload);
      self.postMessage({ type: 'initComplete', id });
      break;

    case 'search':
      const results = performSearch(payload.query);
      self.postMessage({ type: 'searchResults', id, results });
      break;

    default:
      self.postMessage({ type: 'error', id, error: 'Unknown message type' });
  }
};
