import { createClient } from '@base44/sdk';

// Set VITE_BASE44_APP_ID (in .env.local) once the app exists on Base44.
// Without it, Eternal Camino keeps everything on this device.
const appId = import.meta.env.VITE_BASE44_APP_ID;

export const base44 = appId ? createClient({ appId }) : null;
