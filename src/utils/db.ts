import { TCGCard } from '../types/tcg';

const DB_NAME = 'sonny_pocket_tcg_db';
const DB_VERSION = 1;
const STORE_CARDS = 'custom_cards';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_CARDS)) {
        db.createObjectStore(STORE_CARDS, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllStoredCards(): Promise<TCGCard[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CARDS, 'readonly');
      const store = tx.objectStore(STORE_CARDS);
      const req = store.getAll();
      req.onsuccess = () => {
        const list = (req.result as TCGCard[]) || [];
        list.sort((a, b) => a.setNumber - b.setNumber);
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('IndexedDB read fallback:', e);
    return [];
  }
}

export async function saveStoredCards(cards: TCGCard[]): Promise<void> {
  const db = await openDB();
  // Save in batches of 25 transactions so huge sets never block IndexedDB
  const batchSize = 25;
  for (let i = 0; i < cards.length; i += batchSize) {
    const slice = cards.slice(i, i + batchSize);
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_CARDS, 'readwrite');
      const store = tx.objectStore(STORE_CARDS);
      for (const card of slice) {
        store.put(card);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export async function deleteStoredCard(cardId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CARDS, 'readwrite');
    const store = tx.objectStore(STORE_CARDS);
    store.delete(cardId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearAllStoredCards(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CARDS, 'readwrite');
    const store = tx.objectStore(STORE_CARDS);
    store.clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Resizes and compresses an image Blob/File into a lightweight, crisp WebP/JPEG DataURL (~35-55 KB per card)
 * so even 200-500 photos weigh only a few megabytes total!
 */
export async function blobToCompressedDataUrl(
  blob: Blob,
  maxDimension = 640,
  quality = 0.74
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      // Try WebP first (much smaller), fallback to JPEG
      const webp = canvas.toDataURL('image/webp', quality);
      if (webp.startsWith('data:image/webp')) {
        resolve(webp);
      } else {
        resolve(canvas.toDataURL('image/jpeg', quality));
      }
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

/**
 * Re-compresses an existing DataURL string to lightweight 600px WebP/JPEG (~40 KB)
 */
export async function recompressDataUrl(
  dataUrl: string,
  maxDimension = 600,
  quality = 0.72
): Promise<string> {
  if (!dataUrl || dataUrl.length < 70_000) {
    // Already under ~50KB
    return dataUrl;
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const webp = canvas.toDataURL('image/webp', quality);
      if (webp.startsWith('data:image/webp')) {
        resolve(webp);
      } else {
        resolve(canvas.toDataURL('image/jpeg', quality));
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Streams a potentially huge (e.g. 300 MB+) exported JSON pack file chunk-by-chunk
 * without loading the whole file into a single JS string (avoiding V8's max string length crash),
 * and compresses each card's image on the fly so it fits easily in IndexedDB and RAM!
 */
export async function parseHugePackFileStreaming(
  file: File,
  onProgress: (count: number, bytesPct: number) => void
): Promise<{ childName?: string; cards: TCGCard[] }> {
  const reader = file.stream().getReader();
  const decoder = new TextDecoder('utf-8');

  let childName: string | undefined;
  const cards: TCGCard[] = [];

  let inCardsArray = false;
  let braceDepth = 0;
  let inString = false;
  let escapeNext = false;
  let currentObjectChunks: string[] = [];
  let currentObjectStartIdx = -1;
  let headerBuffer = '';

  let bytesRead = 0;
  const totalBytes = file.size || 1;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    bytesRead += value.byteLength;
    const chunk = decoder.decode(value, { stream: true });

    let startScanIdx = 0;

    if (!inCardsArray) {
      headerBuffer += chunk;
      // Extract childName if present in header
      if (!childName) {
        const m = headerBuffer.match(/"childName"\s*:\s*"([^"]+)"/);
        if (m) childName = m[1];
      }
      const cardsKeyMatch = headerBuffer.match(/"cards"\s*:\s*\[/);
      if (cardsKeyMatch && cardsKeyMatch.index !== undefined) {
        inCardsArray = true;
        const afterBracketIdx = cardsKeyMatch.index + cardsKeyMatch[0].length;
        const remainder = headerBuffer.slice(afterBracketIdx);
        headerBuffer = ''; // free memory
        await processChunkText(remainder);
      } else {
        // Keep only the tail in case "cards":[ spans across two chunks
        if (headerBuffer.length > 2048) {
          headerBuffer = headerBuffer.slice(-512);
        }
      }
      continue;
    }

    await processChunkText(chunk.slice(startScanIdx));
  }

  async function processChunkText(text: string) {
    currentObjectStartIdx = braceDepth > 0 ? 0 : -1;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (ch === '\\' && inString) {
        escapeNext = true;
        continue;
      }

      if (ch === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (ch === '{') {
        if (braceDepth === 0) {
          currentObjectStartIdx = i;
          currentObjectChunks = [];
        }
        braceDepth++;
      } else if (ch === '}') {
        braceDepth--;
        if (braceDepth === 0 && currentObjectStartIdx !== -1) {
          currentObjectChunks.push(text.slice(currentObjectStartIdx, i + 1));
          const rawCardJson = currentObjectChunks.join('');
          currentObjectChunks = [];
          currentObjectStartIdx = -1;

          try {
            const parsedCard = JSON.parse(rawCardJson) as TCGCard;
            if (parsedCard && parsedCard.imageUrl) {
              parsedCard.imageUrl = await recompressDataUrl(parsedCard.imageUrl, 600, 0.72);
              cards.push(parsedCard);
              onProgress(cards.length, Math.min(99, Math.round((bytesRead / totalBytes) * 100)));
            }
          } catch (e) {
            console.warn('Skipped malformed card in stream:', e);
          }
        }
      } else if (ch === ']' && braceDepth === 0) {
        // End of cards array
        inCardsArray = false;
        return;
      }
    }

    if (braceDepth > 0 && currentObjectStartIdx !== -1) {
      currentObjectChunks.push(text.slice(currentObjectStartIdx));
    }
  }

  return { childName, cards };
}
