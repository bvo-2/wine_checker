/** Browser features kept behind small functions so screens stay easy to test. */

/** Offers `text` to the user as a file download. */
export function downloadTextFile(fileName: string, text: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before freeing the data.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export type StorageStatus = 'persistent' | 'best-effort' | 'unknown';

/**
 * Asks the browser to keep this site's data even when the device runs low on
 * space. Browsers may say no; the backup export is the real safety net.
 */
export async function requestPersistentStorage(): Promise<StorageStatus> {
  try {
    if (!navigator.storage?.persist) return 'unknown';
    if (await navigator.storage.persisted()) return 'persistent';
    return (await navigator.storage.persist()) ? 'persistent' : 'best-effort';
  } catch {
    return 'unknown';
  }
}

export async function storageStatus(): Promise<StorageStatus> {
  try {
    if (!navigator.storage?.persisted) return 'unknown';
    return (await navigator.storage.persisted()) ? 'persistent' : 'best-effort';
  } catch {
    return 'unknown';
  }
}

/** Registers the offline cache (production builds only; sw.js is generated at build time). */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((error: unknown) => {
      console.warn('Offline mode is not available', error);
    });
  });
}
