import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

// A small persistence layer: Base44 entities when signed in, this device otherwise.
const local = {
  read(key, fallback) {
    try { const v = localStorage.getItem('eternal-camino:' + key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  },
  write(key, value) {
    try { localStorage.setItem('eternal-camino:' + key, JSON.stringify(value)); } catch { /* private mode */ }
  },
};

export function useSetting(key, initial) {
  const [value, setValue] = useState(() => local.read(key, initial));
  useEffect(() => local.write(key, value), [key, value]);
  return [value, setValue];
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!base44);
  useEffect(() => {
    if (!base44) return;
    base44.auth.me().then(setUser).catch(() => setUser(null)).finally(() => setReady(true));
  }, []);
  return {
    user, ready, available: !!base44,
    signIn: () => base44?.auth.redirectToLogin(window.location.href),
    signOut: () => base44?.auth.logout(window.location.href),
  };
}

// Generic collection hook. `entity` is the Base44 entity name; local key mirrors it.
export function useCollection(entity, user) {
  const remote = base44 && user ? base44.entities[entity] : null;
  const [items, setItems] = useState(() => local.read(entity, []));

  useEffect(() => {
    if (!remote) { setItems(local.read(entity, [])); return; }
    let live = true;
    remote.list('-created_date', 1000).then((rows) => {
      if (!live) return;
      // First sign-in: carry over anything gathered on this device.
      const pending = local.read(entity, []).filter((l) => !rows.some((r) => sameItem(entity, r, l)));
      if (pending.length) {
        remote.bulkCreate(pending.map(strip)).then((made) => { if (live) setItems([...made, ...rows]); local.write(entity, []); });
      } else setItems(rows);
    }).catch(() => {});
    return () => { live = false; };
  }, [remote, entity]);

  useEffect(() => { if (!remote) local.write(entity, items); }, [items, remote, entity]);

  const add = useCallback(async (data) => {
    if (remote) { const row = await remote.create(data); setItems((s) => [row, ...s]); return row; }
    const row = { ...data, id: 'local-' + Date.now() + Math.random().toString(36).slice(2, 6), created_date: new Date().toISOString() };
    setItems((s) => [row, ...s]);
    return row;
  }, [remote]);

  const remove = useCallback(async (id) => {
    setItems((s) => s.filter((r) => r.id !== id));
    if (remote && !String(id).startsWith('local-')) await remote.delete(id).catch(() => {});
  }, [remote]);

  const update = useCallback(async (id, data) => {
    setItems((s) => s.map((r) => (r.id === id ? { ...r, ...data } : r)));
    if (remote && !String(id).startsWith('local-')) await remote.update(id, data).catch(() => {});
  }, [remote]);

  return { items, add, remove, update };
}

function strip(r) { const { id, created_date, ...rest } = r; return rest; }
function sameItem(entity, a, b) {
  return entity === 'Visit' ? a.country_key === b.country_key : a.label === b.label && a.amount === b.amount && a.date === b.date;
}
