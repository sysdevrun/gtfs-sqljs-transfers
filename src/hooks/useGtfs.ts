import { useState, useEffect, useRef } from 'react';
import { GtfsSqlJs } from 'gtfs-sqljs';

export interface ProgressInfo {
  phase: string;
  currentFile: string | null;
  percentComplete: number;
  message: string;
}

const GTFS_URL = 'https://gtfs-proxy.sys-dev-run.re/proxy/pysae.com/api/v2/groups/car-jaune/gtfs/pub';

export function useGtfs() {
  const [gtfs, setGtfs] = useState<GtfsSqlJs | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<ProgressInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    async function load() {
      try {
        const instance = await GtfsSqlJs.fromZip(GTFS_URL, {
          skipFiles: ['shapes.txt'],
          onProgress: (p) => setProgress(p),
        });
        setGtfs(instance);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return { gtfs, loading, progress, error };
}
