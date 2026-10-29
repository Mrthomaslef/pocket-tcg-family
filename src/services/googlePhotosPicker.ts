import { blobToCompressedDataUrl } from '../utils/db';

const PICKER_SCOPE = 'https://www.googleapis.com/auth/photospicker.mediaitems.readonly';
const PICKER_API_BASE = 'https://photospicker.googleapis.com/v1';

export interface PickedGooglePhoto {
  googleMediaId: string;
  dataUrl: string;
  createTime?: string;
  filename?: string;
}

export type PickerStatusCallback = (status: {
  step: 'auth' | 'session' | 'waiting_user' | 'downloading' | 'done' | 'error';
  message: string;
  progress?: { current: number; total: number };
  pickerUri?: string;
}) => void;

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string; error_description?: string }) => void;
            error_callback?: (err: { type?: string; message?: string }) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

// Cache token in memory for quick re-picks without re-prompting OAuth every time
let cachedAccessToken: string | null = null;
let cachedTokenExpiry = 0;

/**
 * Requests an OAuth 2.0 Bearer token using Google Identity Services
 */
function requestGoogleAccessToken(clientId: string): Promise<string> {
  if (cachedAccessToken && Date.now() < cachedTokenExpiry) {
    return Promise.resolve(cachedAccessToken);
  }

  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(
        new Error(
          "Le script Google Identity Services n'est pas encore chargé. Vérifiez votre connexion internet."
        )
      );
      return;
    }

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId.trim(),
      scope: PICKER_SCOPE,
      callback: (resp) => {
        if (resp.error || !resp.access_token) {
          reject(new Error(resp.error_description || resp.error || 'Autorisation Google annulée.'));
          return;
        }
        cachedAccessToken = resp.access_token;
        cachedTokenExpiry = Date.now() + 50 * 60 * 1000; // 50 mins
        resolve(resp.access_token);
      },
      error_callback: (err) => {
        reject(new Error(err.message || err.type || 'Erreur de popup OAuth Google.'));
      },
    });

    tokenClient.requestAccessToken({ prompt: '' });
  });
}

interface PickerSessionResponse {
  id: string;
  pickerUri: string;
  mediaItemsSet?: boolean;
  pollingConfig?: {
    pollInterval?: string;
  };
}

interface PickedMediaItem {
  id: string;
  createTime?: string;
  type?: string;
  mediaFile?: {
    baseUrl: string;
    mimeType?: string;
    filename?: string;
  };
}

/**
 * Fisher-Yates shuffle to randomize selected photos
 */
function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Launches the full Google Photos Picker flow:
 * 1. OAuth token
 * 2. Create Picker Session
 * 3. Open Google Photos Picker UI popup
 * 4. Poll until selection complete
 * 5. Shuffle & randomly sample `randomSampleCount` photos (if specified) so the user gets a surprise random draw!
 * 6. Download & compress selected images in parallel into persistent DataURLs
 */
export async function launchGooglePhotosPickerFlow(
  clientId: string,
  onStatus: PickerStatusCallback,
  abortSignal?: AbortSignal,
  options?: {
    randomSampleCount?: number; // 0 or undefined = import all; >0 = randomly pick N items from the user's bulk selection
    excludeMediaIds?: Set<string>;
  }
): Promise<PickedGooglePhoto[]> {
  // Step 1: OAuth
  onStatus({
    step: 'auth',
    message: 'Connexion à votre compte Google...',
  });

  const accessToken = await requestGoogleAccessToken(clientId);

  // Step 2: Create Picker Session
  onStatus({
    step: 'session',
    message: 'Création de la session Google Photos Picker...',
  });

  const sessionRes = await fetch(`${PICKER_API_BASE}/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pickingConfig: {
        maxItemCount: '2000',
      },
    }),
  });

  if (!sessionRes.ok) {
    const errText = await sessionRes.text();
    throw new Error(
      `Impossible de créer la session Google Photos Picker (${sessionRes.status}). Vérifiez que l'API "Google Photos Picker API" est activée dans Google Cloud Console. Détail: ${errText}`
    );
  }

  const session: PickerSessionResponse = await sessionRes.json();
  const pickerUrlWithAutoclose = `${session.pickerUri}/autoclose`;

  // Open popup window with Google Photos Picker
  const popup = window.open(
    pickerUrlWithAutoclose,
    'GooglePhotosPicker',
    'width=1020,height=780,menubar=no,toolbar=no,location=yes,status=no'
  );

  onStatus({
    step: 'waiting_user',
    message: popup
      ? 'Astuce Sélection Rapide au Hasard : Cliquez sur la 1re photo de votre fils, descendez tout en bas et faites MAJ + CLIC (Shift + Clic) pour sélectionner 200+ photos d’un coup sans regarder !'
      : 'Session prête ! Cliquez sur le bouton vert ci-dessous pour ouvrir Google Photos :',
    pickerUri: session.pickerUri,
  });

  // Step 3: Poll session until mediaItemsSet is true
  let mediaItemsSet = false;
  const maxAttempts = 180; // up to ~6 minutes
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (abortSignal?.aborted) {
      if (popup && !popup.closed) popup.close();
      throw new Error('Sélection annulée.');
    }

    await new Promise((r) => setTimeout(r, 2000));

    const pollRes = await fetch(`${PICKER_API_BASE}/sessions/${encodeURIComponent(session.id)}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (pollRes.ok) {
      const polled: PickerSessionResponse = await pollRes.json();
      if (polled.mediaItemsSet) {
        mediaItemsSet = true;
        break;
      }
    }
  }

  if (popup && !popup.closed) {
    popup.close();
  }

  if (!mediaItemsSet) {
    throw new Error('Aucune photo sélectionnée ou délai dépassé.');
  }

  // Step 4: List all selected media items
  onStatus({
    step: 'downloading',
    message: 'Lecture de votre sélection et tirage au sort aléatoire...',
  });

  const allItems: PickedMediaItem[] = [];
  let pageToken: string | undefined = undefined;

  do {
    const url = new URL(`${PICKER_API_BASE}/mediaItems`);
    url.searchParams.set('sessionId', session.id);
    url.searchParams.set('pageSize', '100');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const listRes = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!listRes.ok) {
      throw new Error(`Erreur lors de la lecture des photos (${listRes.status}).`);
    }

    const data: { mediaItems?: PickedMediaItem[]; nextPageToken?: string } = await listRes.json();
    if (data.mediaItems) {
      allItems.push(...data.mediaItems);
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  let photoItems = allItems.filter((item) => item.mediaFile?.baseUrl);
  if (photoItems.length === 0) {
    throw new Error('Aucune photo compatible trouvée dans la sélection.');
  }

  // Filter out already imported photos if possible, unless all are already imported
  if (options?.excludeMediaIds && options.excludeMediaIds.size > 0) {
    const unseen = photoItems.filter((item) => !options.excludeMediaIds!.has(item.id));
    if (unseen.length > 0) {
      photoItems = unseen;
    }
  }

  // Always shuffle so the order and rarities are 100% unpredictable!
  photoItems = shuffleArray(photoItems);

  // If user requested a random sample (e.g. 20 random photos out of 300 Shift+Clicked photos), slice!
  if (options?.randomSampleCount && options.randomSampleCount > 0 && photoItems.length > options.randomSampleCount) {
    photoItems = photoItems.slice(0, options.randomSampleCount);
  }

  // Step 5: Download photos in parallel batches of 5 for fast import
  const results: PickedGooglePhoto[] = [];
  let completed = 0;
  const total = photoItems.length;
  const concurrency = 5;

  for (let i = 0; i < total; i += concurrency) {
    if (abortSignal?.aborted) break;
    const batch = photoItems.slice(i, i + concurrency);

    const batchResults = await Promise.all(
      batch.map(async (item) => {
        const downloadUrl = `${item.mediaFile!.baseUrl}=w1080-h1440`;
        try {
          const imgRes = await fetch(downloadUrl, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          if (!imgRes.ok) return null;
          const blob = await imgRes.blob();
          const dataUrl = await blobToCompressedDataUrl(blob, 900);
          return {
            googleMediaId: item.id,
            dataUrl,
            createTime: item.createTime,
            filename: item.mediaFile?.filename,
          } as PickedGooglePhoto;
        } catch (err) {
          console.warn('Erreur sur une photo Google Photos:', err);
          return null;
        } finally {
          completed++;
          onStatus({
            step: 'downloading',
            message: `Tirage surprise : création de la carte ${completed} sur ${total}...`,
            progress: { current: completed, total },
          });
        }
      })
    );

    for (const r of batchResults) {
      if (r) results.push(r);
    }
  }

  // Clean up session on Google side (best effort)
  fetch(`${PICKER_API_BASE}/sessions/${encodeURIComponent(session.id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  }).catch(() => {});

  onStatus({
    step: 'done',
    message: `🎲 ${results.length} photo(s) tirée(s) au sort et transformée(s) en cartes secrètes !`,
  });

  return results;
}
