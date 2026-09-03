import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { fetchNeeds } from './data';
import type { SchoolNeed } from './types';

/**
 * Subscribes to realtime changes on school_needs and donations tables.
 * When a donation is inserted/updated/deleted, the database trigger
 * recomputes the need's pledged/received/status. Supabase then pushes
 * the updated school_needs row via realtime, and this hook re-fetches
 * so the progress bars update instantly — no manual refresh needed.
 */
export function useRealtimeNeeds(initialFetch = true): {
  needs: SchoolNeed[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [needs, setNeeds] = useState<SchoolNeed[]>([]);
  const [loading, setLoading] = useState(initialFetch);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      const data = await fetchNeeds();
      setNeeds(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load needs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialFetch) refetch();

    const channel = supabase
      .channel('school_needs_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'school_needs' },
        () => { void refetch(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'donations' },
        () => { void refetch(); }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refetch, initialFetch]);

  return { needs, loading, error, refetch };
}
