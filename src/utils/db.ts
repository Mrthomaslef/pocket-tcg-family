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
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CARDS, 'readwrite');
    const store = tx.objectStore(STORE_CARDS);
    for (const card of cards) {
      store.put(card);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
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
 * Resizes and compresses an image Blob or File into a high-quality JPEG DataURL (max 900px)
 * so hundreds of photos from Google Photos can be stored smoothly in IndexedDB.
 */
export async function blobToCompressedDataUrl(blob: Blob, maxDimension = 900): Promise<string> {
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
      resolve(canvas.toDataURL('image/jpeg', 0.86));
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}
