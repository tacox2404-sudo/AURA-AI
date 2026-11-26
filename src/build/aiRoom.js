// AI ROOM CREATOR (owned by Building).
// 1. Ask the backend (Supabase function -> Gemini) for a room spec.
// 2. If there is no AI (demo mode, no key, quota used up), use the keyword generator below.
// 3. Always VALIDATE: only catalog items and known activities survive, so the AI can
//    never break the game's style.

import { CATALOG, CATALOG_BY_ID } from './catalog.js';
import { VIBES, makeRoom } from './templates.js';

const THEMES = [
  { words: ['movie', 'cinema', 'film', 'netflix', 'tv', 'date'], name: 'Movie Room', vibe: 'night', items: ['tv', 'sofa', 'beanbag', 'beanbag', 'rug', 'coffee_table', 'candles', 'lamp'] },
  { words: ['travel', 'trip', 'vacation', 'holiday', 'flight', 'plan'], name: 'Travel HQ', vibe: 'modern', items: ['globe', 'trip_board', 'link_board', 'calendar_board', 'checklist_board', 'weather_window', 'table', 'chair', 'chair'] },
  { words: ['game', 'arcade', 'play', 'pool', 'fun'], name: 'Arcade', vibe: 'night', items: ['arcade', 'arcade', 'pool_table', 'connect4_table', 'tictactoe_table', 'trophy', 'beanbag'] },
  { words: ['memory', 'memories', 'photo', 'art', 'gallery', 'museum'], name: 'Memory Gallery', vibe: 'pastel', items: ['photo_frame', 'photo_frame', 'photo_frame', 'easel', 'bench', 'tall_plant', 'heart_balloon'] },
  { words: ['spa', 'relax', 'calm', 'wellness', 'sauna'], name: 'Spa', vibe: 'nature', items: ['bathtub', 'towel_rack', 'bath_mat', 'candles', 'plant', 'tall_plant', 'deck_chair'] },
  { words: ['bathroom', 'bath', 'shower', 'toilet', 'wash'], name: 'Bathroom', vibe: 'modern', items: ['bathtub', 'shower', 'toilet', 'bath_sink', 'towel_rack', 'bath_mat', 'plant'] },
  { words: ['kitchen', 'cook', 'food', 'recipe', 'dinner', 'breakfast', 'coffee', 'cafe', 'bake'], name: 'Kitchen', vibe: 'cozy', items: ['fridge', 'stove', 'kitchen_sink', 'counter', 'kitchen_island', 'coffee_machine', 'table', 'chair', 'chair'] },
  { words: ['party', 'dance', 'disco', 'dj', 'birthday', 'celebrate', 'club'], name: 'Party Room', vibe: 'night', items: ['dj_booth', 'speaker', 'speaker', 'disco_ball', 'party_table', 'balloon_arch', 'gift_pile', 'beanbag'] },
  { words: ['music', 'karaoke', 'jukebox', 'band', 'song', 'piano'], name: 'Music Room', vibe: 'retro', items: ['jukebox', 'piano', 'speaker', 'big_button', 'beanbag', 'beanbag', 'rug', 'lamp'] },
  { words: ['study', 'work', 'office', 'focus', 'school'], name: 'Study', vibe: 'modern', items: ['desk', 'chair', 'bookshelf', 'checklist_board', 'calendar_board', 'lamp', 'plant'] },
  { words: ['pet', 'cat', 'dog', 'kitten', 'puppy', 'fish'], name: 'Pet Corner', vibe: 'cozy', items: ['pet_bed', 'cat_tree', 'fish_tank', 'rug', 'plant', 'floor_cushion'] },
  { words: ['balcony', 'terrace', 'sunset', 'hammock'], name: 'Balcony', vibe: 'nature', items: ['hammock', 'bbq', 'patio_chair', 'patio_chair', 'patio_table', 'fire_pit', 'string_lights', 'plant'] },
  { words: ['garden', 'plant', 'green', 'nature', 'outdoor', 'flower', 'bbq', 'picnic', 'patio'], name: 'Garden', vibe: 'nature', items: ['fountain', 'flower_bed', 'picnic_table', 'bbq', 'tree', 'bush', 'garden_lamp', 'fence'] },
  { words: ['gift', 'wish', 'christmas', 'present'], name: 'Gift Room', vibe: 'pastel', items: ['gift_box', 'gift_pile', 'link_board', 'calendar_board', 'heart_balloon', 'armchair'] },
  { words: ['bed', 'sleep', 'bedroom', 'cozy', 'nap'], name: 'Bedroom', vibe: 'cozy', items: ['bed', 'nightstand', 'closet', 'dresser', 'rug', 'lamp', 'plant'] },
  { words: ['kids', 'kid', 'child', 'children', 'toy', 'sleepover', 'baby'], name: 'Kids Room', vibe: 'pastel', items: ['bunk_bed', 'teddy', 'beanbag', 'easel', 'gift_pile', 'rug', 'nightstand'] },
  { words: ['love', 'romantic', 'heart', 'anniversary', 'us'], name: 'Love Room', vibe: 'pastel', items: ['heart_balloon', 'heart_balloon', 'photo_frame', 'candles', 'loveseat', 'mailbox', 'calendar_board'] },
];

/** Keyword fallback: picks the best matching theme and mixes in extras. */
export function keywordRoom(prompt) {
  const p = prompt.toLowerCase();
  const scored = THEMES.map((t) => ({ t, s: t.words.filter((w) => p.includes(w)).length })).sort((a, b) => b.s - a.s);
  const best = scored[0].s > 0 ? scored[0].t : THEMES[Math.floor(Math.random() * THEMES.length)];
  // second matching theme adds a couple of items
  const extra = scored[1]?.s > 0 ? scored[1].t.items.slice(0, 2) : [];
  const vibe = Object.keys(VIBES).find((v) => p.includes(v)) || best.vibe;
  return { name: titleFrom(prompt) || best.name, vibe, items: [...best.items, ...extra] };
}

function titleFrom(prompt) {
  const clean = prompt.replace(/^(a|an|the|make|create|build)\s+/i, '').trim();
  if (!clean || clean.length > 28) return null;
  return clean.replace(/\b\w/g, (c) => c.toUpperCase());
}

const HEX = /^#[0-9a-f]{6}$/i;

/** Turn any spec (from AI or keywords) into a safe room. */
export function specToRoom(spec, fallbackVibe = 'cozy') {
  const vibe = VIBES[spec.vibe] ? spec.vibe : fallbackVibe;
  const base = VIBES[vibe];
  const theme = {
    floor: HEX.test(spec.theme?.floor || '') ? spec.theme.floor : base.floor,
    wall: HEX.test(spec.theme?.wall || '') ? spec.theme.wall : base.wall,
    accent: HEX.test(spec.theme?.accent || '') ? spec.theme.accent : base.accent,
    wood: base.wood,
  };
  const kinds = (spec.items || []).map((i) => (typeof i === 'string' ? i : i.kind)).filter((k) => CATALOG_BY_ID[k]).slice(0, 14);
  const room = makeRoom({ name: String(spec.name || 'New Room').slice(0, 30), vibe, theme, kinds: kinds.length ? kinds : ['rug', 'plant', 'lamp'] });
  // optional per-item activity overrides from the AI (e.g. a portal with a URL)
  (spec.items || []).forEach((src, idx) => {
    if (typeof src !== 'object' || !room.items[idx]) return;
    if (src.label) room.items[idx].data = { ...(room.items[idx].data || {}), label: String(src.label).slice(0, 40) };
    if (src.url && /^https?:\/\//.test(src.url)) room.items[idx].data = { ...(room.items[idx].data || {}), url: src.url };
  });
  return room;
}

export async function createAiRoom(backend, prompt, fallbackVibe) {
  let spec = null;
  try { spec = await backend.generateRoom(prompt, CATALOG.map((c) => c.id), ['connect4', 'tictactoe', 'draw', 'gallery', 'links', 'calendar', 'notes', 'wishlist', 'travel', 'weather', 'movies', 'portal']); }
  catch (e) { console.warn('AI room failed, using keywords', e); }
  const usedAi = !!spec;
  return { room: specToRoom(spec || keywordRoom(prompt), fallbackVibe), usedAi };
}
