import { useState, useCallback } from 'react';

const LEMONFOX_API_KEY = process.env.REACT_APP_LEMONFOX_API_KEY;
const API_URL = 'https://api.lemonfox.ai/v1/audio/transcriptions';

// --- Start of Bible Verse Logic ---

const BIBLE_BOOKS = {
  'genesis': 'Genesis', 'gen': 'Genesis', 'ge': 'Genesis',
  'exodus': 'Exodus', 'ex': 'Exodus', 'exo': 'Exodus',
  'leviticus': 'Leviticus', 'lev': 'Leviticus', 'le': 'Leviticus',
  'numbers': 'Numbers', 'num': 'Numbers', 'nu': 'Numbers',
  'deuteronomy': 'Deuteronomy', 'deut': 'Deuteronomy', 'dt': 'Deuteronomy',
  'joshua': 'Joshua', 'josh': 'Joshua', 'jos': 'Joshua',
  'judges': 'Judges', 'judg': 'Judges', 'jdg': 'Judges',
  'ruth': 'Ruth', 'ru': 'Ruth',
  '1 samuel': '1 Samuel', '1 sam': '1 Samuel', '1 sa': '1 Samuel',
  '2 samuel': '2 Samuel', '2 sam': '2 Samuel', '2 sa': '2 Samuel',
  '1 kings': '1 Kings', '1 kgs': '1 Kings',
  '2 kings': '2 Kings', '2 kgs': '2 Kings',
  '1 chronicles': '1 Chronicles', '1 chron': '1 Chronicles', '1 ch': '1 Chronicles',
  '2 chronicles': '2 Chronicles', '2 chron': '2 Chronicles', '2 ch': '2 Chronicles',
  'ezra': 'Ezra', 'ezr': 'Ezra',
  'nehemiah': 'Nehemiah', 'neh': 'Nehemiah',
  'esther': 'Esther', 'est': 'Esther', 'esth': 'Esther',
  'job': 'Job', 'jb': 'Job',
  'psalms': 'Psalms', 'psalm': 'Psalms', 'ps': 'Psalms', 'psa': 'Psalms',
  'proverbs': 'Proverbs', 'prov': 'Proverbs', 'pr': 'Proverbs',
  'ecclesiastes': 'Ecclesiastes', 'eccles': 'Ecclesiastes', 'ec': 'Ecclesiastes',
  'song of solomon': 'Song of Solomon', 'song': 'Song of Solomon', 'sos': 'Song of Solomon',
  'isaiah': 'Isaiah', 'isa': 'Isaiah', 'is': 'Isaiah',
  'jeremiah': 'Jeremiah', 'jer': 'Jeremiah', 'je': 'Jeremiah',
  'lamentations': 'Lamentations', 'lam': 'Lamentations',
  'ezekiel': 'Ezekiel', 'ezek': 'Ezekiel', 'eze': 'Ezekiel',
  'daniel': 'Daniel', 'dan': 'Daniel', 'da': 'Daniel',
  'hosea': 'Hosea', 'hos': 'Hosea',
  'joel': 'Joel', 'jl': 'Joel',
  'amos': 'Amos', 'am': 'Amos',
  'obadiah': 'Obadiah', 'obad': 'Obadiah', 'ob': 'Obadiah',
  'jonah': 'Jonah', 'jon': 'Jonah',
  'micah': 'Micah', 'mic': 'Micah',
  'nahum': 'Nahum', 'nah': 'Nahum',
  'habakkuk': 'Habakkuk', 'hab': 'Habakkuk',
  'zephaniah': 'Zephaniah', 'zeph': 'Zephaniah', 'zep': 'Zephaniah',
  'haggai': 'Haggai', 'hag': 'Haggai',
  'zechariah': 'Zechariah', 'zech': 'Zechariah', 'zec': 'Zechariah',
  'malachi': 'Malachi', 'mal': 'Malachi',
  'matthew': 'Matthew', 'matt': 'Matthew', 'mt': 'Matthew',
  'mark': 'Mark', 'mk': 'Mark',
  'luke': 'Luke', 'lk': 'Luke',
  'john': 'John', 'jn': 'John',
  'acts': 'Acts', 'act': 'Acts',
  'romans': 'Romans', 'rom': 'Romans', 'ro': 'Romans',
  '1 corinthians': '1 Corinthians', '1 cor': '1 Corinthians',
  '2 corinthians': '2 Corinthians', '2 cor': '2 Corinthians',
  'galatians': 'Galatians', 'gal': 'Galatians',
  'ephesians': 'Ephesians', 'eph': 'Ephesians',
  'philippians': 'Philippians', 'phil': 'Philippians',
  'colossians': 'Colossians', 'col': 'Colossians',
  '1 thessalonians': '1 Thessalonians', '1 thess': '1 Thessalonians', '1 th': '1 Thessalonians',
  '2 thessalonians': '2 Thessalonians', '2 thess': '2 Thessalonians', '2 th': '2 Thessalonians',
  '1 timothy': '1 Timothy', '1 tim': '1 Timothy', '1 ti': '1 Timothy',
  '2 timothy': '2 Timothy', '2 tim': '2 Timothy', '2 ti': '2 Timothy',
  'titus': 'Titus', 'tit': 'Titus',
  'philemon': 'Philemon', 'philem': 'Philemon', 'phm': 'Philemon',
  'hebrews': 'Hebrews', 'heb': 'Hebrews',
  'james': 'James', 'jas': 'James', 'jm': 'James',
  '1 peter': '1 Peter', '1 pet': '1 Peter', '1 pe': '1 Peter',
  '2 peter': '2 Peter', '2 pet': '2 Peter', '2 pe': '2 Peter',
  '1 john': '1 John', '1 jn': '1 John',
  '2 john': '2 John', '2 jn': '2 John',
  '3 john': '3 John', '3 jn': '3 John',
  'jude': 'Jude',
  'revelation': 'Revelation', 'rev': 'Revelation', 're': 'Revelation'
};

const WORD_TO_DIGIT = { 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10 };

const normalizeQuery = (text) => {
  let normalized = text.toLowerCase().replace(/[,?]/g, '');
  Object.keys(WORD_TO_DIGIT).forEach(word => {
    normalized = normalized.replace(new RegExp(`\\b${word}\\b`, 'g'), WORD_TO_DIGIT[word]);
  });
  return normalized.replace(/\bcolon\b/g, ':');
};

const parseReference = (text) => {
  const bookKeys = Object.keys(BIBLE_BOOKS).join('|');
  const pattern1 = new RegExp(`\\b(${bookKeys})\\s+(\\d+):(\\d+)(?:(?:-|\\s+to\\s+|\\s+through\\s+)(\\d+))?`);
  const pattern2 = new RegExp(`\\b(${bookKeys})\\s+(?:chapter\\s+)?(\\d+)(?:\\s+verse(?:s)?\\s+)?(\\d+)(?:(?:\\s+to\\s+|\\s+through\\s+|-)(\\d+))?`);

  for (const pattern of [pattern1, pattern2]) {
    const match = text.match(pattern);
    if (match) {
      const [, bookAbbr, chapter, startVerse, endVerse] = match;
      if (BIBLE_BOOKS[bookAbbr]) {
        return { book: BIBLE_BOOKS[bookAbbr], chapter, startVerse, endVerse: endVerse || null };
      }
    }
  }
  return null;
};

const fetchKJVVerse = async (ref) => {
  try {
    const verseRange = ref.endVerse ? `${ref.startVerse}-${ref.endVerse}` : ref.startVerse;
    const url = `https://bible-api.com/${ref.book} ${ref.chapter}:${verseRange}?translation=kjv`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    return data.verses.map(v => v.text.replace(/\n/g, ' ').trim()).join(' ');
  } catch (e) {
    console.error("Bible API fetch error:", e);
    return null;
  }
};

const getVerseFromText = async (text) => {
  const reference = parseReference(normalizeQuery(text));
  if (!reference) return null;

  const verseText = await fetchKJVVerse(reference);
  if (!verseText) return null;

  const refString = reference.endVerse ? `${reference.book} ${reference.chapter}:${reference.startVerse}-${reference.endVerse}` : `${reference.book} ${reference.chapter}:${reference.startVerse}`;
  return `Reference detected: ${refString}\n${verseText}`;
};

// --- End of Bible Verse Logic ---

/**
 * Custom hook for handling speech-to-text transcription via the LemonFox API.
 * It encapsulates the API call logic, loading state, and error handling.
 */
export const useLemonFox = () => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState(null);

  const transcribe = useCallback(async (audioBlob) => {
    if (!audioBlob) {
      setError('No audio blob provided.');
      return null;
    }

    setIsTranscribing(true);
    setError(null);

    // FIX: A new FormData object is created for each transcription call.
    // This prevents data from previous requests from being carried over,
    // which was causing the API to fail after the second call.
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'lemonfox-1');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LEMONFOX_API_KEY}`,
          // 'Content-Type' is set automatically by fetch for FormData.
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new Error(errorData.error?.message || 'Voice recognition failed.');
      }

      const result = await response.json();
      const transcribedText = result.text;

      // PRIORITY CHECK: Scan for a Bible verse reference first.
      const verseResult = await getVerseFromText(transcribedText);
      if (verseResult) {
        // If a verse is found, return the formatted verse text immediately.
        return verseResult;
      }

      // FALLBACK: If no verse is found, proceed as before by returning the transcription.
      return transcribedText;
    } catch (err) {
      console.error('LemonFox API error:', err);
      setError(err.message || 'Voice recognition failed. Please try again.');
      return null;
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  return { transcribe, isTranscribing, error };
};