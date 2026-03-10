import { useState, useCallback, useRef } from 'react';
import { GtfsSqlJs } from 'gtfs-sqljs';
import type { GtfsSelectionResult } from 'react-gtfs-selector';

export interface ProgressInfo {
  phase: string;
  currentFile: string | null;
  percentComplete: number;
  message: string;
}

// Convert https URL to proxy URL to avoid CORS issues
function getProxyUrl(httpsUrl: string): string {
  if (!httpsUrl.startsWith('https://')) {
    throw new Error('URL must start with https://');
  }
  // Remove https:// prefix
  const withoutProtocol = httpsUrl.substring(8);
  return `https://gtfs-proxy.sys-dev-run.re/proxy/${withoutProtocol}`;
}

export function useGtfsLoader() {
  const [gtfs, setGtfs] = useState<GtfsSqlJs | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sourceTitle, setSourceTitle] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const load = useCallback(async (result: GtfsSelectionResult) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    setProgress(null);
    setGtfs(null);

    try {
      const url = result.type === 'url' ? getProxyUrl(result.url) : URL.createObjectURL(result.blob);
      const title = result.type === 'url' ? result.title : result.fileName;
      try {
        const instance = await GtfsSqlJs.fromZip(url, {
          skipFiles: ['shapes.txt'],
          onProgress: (p) => setProgress(p),
          locateFile: (file: string) => `${import.meta.env.BASE_URL}${file}`,
        });
        setGtfs(instance);
        setSourceTitle(title);
      } finally {
        if (result.type === 'file') URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  const reset = useCallback(() => {
    setGtfs(null);
    setLoading(false);
    setProgress(null);
    setError(null);
    setSourceTitle(null);
    loadingRef.current = false;
  }, []);

  return { gtfs, loading, progress, error, sourceTitle, load, reset };
}
