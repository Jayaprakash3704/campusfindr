import { useState, useEffect, useCallback } from 'react';
import { fetchActive } from '../services/api';

const POLL_INTERVAL_MS = 30_000; // refresh every 30 seconds

/**
 * Custom hook that manages lost/found item state,
 * handles loading/error, and provides a refresh function.
 *
 * @returns {{
 *   lostItems: Item[],
 *   foundItems: Item[],
 *   loading: boolean,
 *   error: string | null,
 *   refresh: () => Promise<void>,
 *   removeItem: (id: string) => void,
 *   addItem: (item: Item) => void,
 * }}
 */
export function useItems() {
  const [lostItems, setLostItems]   = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const { lost, found } = await fetchActive();
      setLostItems(lost);
      setFoundItems(found);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    load();
  }, [load]);

  // Background polling
  useEffect(() => {
    const interval = setInterval(() => load(true), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  /** Remove a single item from the correct column after it's been archived */
  const removeItem = useCallback((id) => {
    setLostItems((prev)  => prev.filter((i) => i._id !== id));
    setFoundItems((prev) => prev.filter((i) => i._id !== id));
  }, []);

  /** Prepend a newly reported item to the correct column */
  const addItem = useCallback((item) => {
    if (item.reportType === 'lost') {
      setLostItems((prev) => [item, ...prev]);
    } else {
      setFoundItems((prev) => [item, ...prev]);
    }
  }, []);

  return {
    lostItems,
    foundItems,
    loading,
    error,
    refresh: () => load(true),
    removeItem,
    addItem,
  };
}
