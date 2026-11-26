// OurPlace boot file (owned by the lead).
// Creates the shared context, then starts each area. Social goes last because it
// starts the login flow, which uses services from the other areas.

import './styles.css';
import { pickBackend } from './core/backend/index.js';
import { createContext } from './core/context.js';
import { createUI } from './core/ui.js';
import { initHud } from './core/hud.js';
import { initWorld } from './world/index.js';
import { initBuild } from './build/index.js';
import { initActivities } from './activities/index.js';
import { initSocial } from './social/index.js';

const ui = createUI(document.getElementById('ui'));
const ctx = createContext({ backend: pickBackend(), ui });
window.__ourplace = ctx; // handy for debugging in the browser console

initHud(ctx);
initBuild(ctx);
initWorld(ctx);
initActivities(ctx);
initSocial(ctx);

// Ask the browser to keep our saved data (including the login) and not clear it when space is low
// or after a few days away. Harmless if the browser says no.
navigator.storage?.persist?.().catch(() => {});
