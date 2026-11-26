// HOUSE PRESETS (owned by Building): themed room blueprints and ready-made house layouts.
// The "new house" wizard (Social) lets you pick a preset or customise: how many bedrooms and bathrooms, plus
// extra rooms (kitchen, study, cinema, garden, balcony, party room, pet corner, spa...). planRooms() turns those
// choices into an ordered list of rooms. The building stacks rooms two per floor in this order, so the entrance
// and the main room sit on the ground floor and the last rooms (balcony, spa...) crown the penthouse.
//
// Every room is a "blueprint": a name, an emoji, the catalogue items that go in it (the auto-layout arranges
// them like a real room) and optionally a vibe of its own (a spa is green, a party room is neon).

export const MAX_ROOMS = 12;

// vibe: omitted = use the style the player chose for the house
export const BLUEPRINTS = {
  // ---- the basics ----
  entrance: { name: 'Entrance', emoji: '🚪', items: ['welcome_sign', 'noticeboard', 'mailbox', 'rug', 'plant', 'lamp', 'armchair'] },
  living: { name: 'Living Room', emoji: '🛋️', items: ['tv', 'sofa', 'armchair', 'coffee_table', 'rug', 'fireplace', 'bookshelf', 'table_lamp', 'plant', 'painting'] },
  kitchen: { name: 'Kitchen', emoji: '🍳', items: ['fridge', 'stove', 'sink_counter', 'kitchen_island', 'table', 'chair', 'chair', 'coffee_machine', 'plant', 'calendar_board'] },
  bedroom: { name: 'Bedroom', emoji: '🛏️', items: ['bed', 'nightstand', 'nightstand', 'wardrobe', 'dresser', 'rug', 'table_lamp', 'curtains', 'mirror', 'plant'] },
  guest_bedroom: { name: 'Guest Bedroom', emoji: '🛌', items: ['single_bed', 'nightstand', 'closet', 'rug', 'table_lamp', 'painting', 'plant'] },
  kids_room: { name: "Kids' Room", emoji: '🧸', vibe: 'pastel', items: ['bunk_bed', 'toy_chest', 'play_tent', 'teddy', 'rug', 'easel', 'nightstand', 'table_lamp'] },
  sleepover_room: { name: 'Sleepover Room', emoji: '🌙', vibe: 'night', items: ['bunk_bed', 'beanbag', 'beanbag', 'floor_cushion', 'rug', 'string_lights', 'lava_lamp', 'board_games'] },
  bathroom: { name: 'Bathroom', emoji: '🛁', vibe: 'modern', items: ['bathtub', 'shower', 'toilet', 'bath_sink', 'towel_rack', 'bath_mat', 'laundry_basket', 'mirror', 'plant'] },
  powder_room: { name: 'Powder Room', emoji: '🚽', vibe: 'modern', items: ['toilet', 'sink', 'bath_mat', 'towel_rack', 'plant'] },
  // ---- the main room of each kind of house ----
  date_night: { name: 'Date Night', emoji: '💞', vibe: 'pastel', items: ['tv', 'sofa', 'rug', 'coffee_table', 'candles', 'heart_balloon', 'lamp', 'fireplace', 'wall_sconce'] },
  lounge: { name: 'Lounge', emoji: '🛋️', items: ['tv', 'sofa', 'beanbag', 'beanbag', 'coffee_table', 'jukebox', 'rug', 'lamp', 'board_games', 'string_lights'] },
  studio: { name: 'Studio', emoji: '🎨', items: ['desk', 'chair', 'photo_frame', 'link_board', 'checklist_board', 'bookshelf', 'tall_plant', 'beanbag', 'table_lamp'] },
  // ---- for couples ----
  memory_room: { name: 'Memory Room', emoji: '📸', vibe: 'pastel', items: ['photo_frame', 'photo_frame', 'polaroid_wall', 'calendar_board', 'link_board', 'armchair', 'plant', 'heart_balloon', 'flower_vase'] },
  dream_room: { name: 'Dream Room', emoji: '✨', vibe: 'pastel', items: ['gift_box', 'globe', 'trip_board', 'weather_window', 'checklist_board', 'bed', 'tall_plant', 'candles'] },
  trip_hq: { name: 'Trip HQ', emoji: '✈️', vibe: 'modern', items: ['globe', 'trip_board', 'calendar_board', 'link_board', 'checklist_board', 'table', 'chair', 'chair', 'weather_window'] },
  // ---- for friends ----
  game_room: { name: 'Game Room', emoji: '🎮', vibe: 'night', items: ['arcade', 'connect4_table', 'tictactoe_table', 'easel', 'trophy', 'beanbag', 'beanbag', 'pool_table'] },
  arcade: { name: 'Arcade', emoji: '🕹️', vibe: 'night', items: ['pinball', 'foosball', 'arcade', 'dartboard', 'trophy', 'beanbag', 'neon_sign', 'pool_table', 'speaker'] },
  hall_of_fame: { name: 'Hall of Fame', emoji: '🏆', items: ['trophy', 'photo_frame', 'photo_frame', 'polaroid_wall', 'big_button', 'bench', 'tall_plant', 'neon_sign'] },
  music_room: { name: 'Music Room', emoji: '🎵', vibe: 'retro', items: ['piano', 'jukebox', 'karaoke', 'speaker', 'beanbag', 'beanbag', 'rug', 'lamp'] },
  party_room: { name: 'Party Room', emoji: '🎉', vibe: 'night', items: ['dj_booth', 'speaker', 'speaker', 'disco_ball', 'party_table', 'balloon_arch', 'gift_pile', 'beanbag', 'neon_sign'] },
  // ---- for families ----
  wish_corner: { name: 'Wish Corner', emoji: '🎁', vibe: 'pastel', items: ['gift_box', 'gift_box', 'gift_pile', 'weather_window', 'bench', 'tree', 'calendar_board'] },
  playroom: { name: 'Playroom', emoji: '🧩', vibe: 'pastel', items: ['toy_chest', 'play_tent', 'teddy', 'easel', 'beanbag', 'rug', 'board_games', 'connect4_table'] },
  // ---- for anyone ----
  study: { name: 'Study', emoji: '📚', vibe: 'modern', items: ['desk', 'chair', 'bookshelf', 'checklist_board', 'calendar_board', 'table_lamp', 'plant', 'wall_shelf', 'painting'] },
  cinema: { name: 'Home Cinema', emoji: '🍿', vibe: 'night', items: ['tv', 'sofa', 'loveseat', 'beanbag', 'beanbag', 'rug', 'candles', 'speaker', 'string_lights'] },
  garden: { name: 'Garden', emoji: '🌳', vibe: 'nature', items: ['fountain', 'flower_bed', 'picnic_table', 'bbq', 'tree', 'bush', 'garden_lamp', 'fence', 'bench'] },
  balcony: { name: 'Balcony', emoji: '🌇', vibe: 'nature', items: ['hammock', 'patio_chair', 'patio_chair', 'patio_table', 'fire_pit', 'string_lights', 'plant'] },
  pet_corner: { name: 'Pet Corner', emoji: '🐾', vibe: 'cozy', items: ['pet_bed', 'cat_tree', 'fish_tank', 'rug', 'plant', 'floor_cushion'] },
  spa: { name: 'Spa', emoji: '🧖', vibe: 'nature', items: ['bathtub', 'towel_rack', 'bath_mat', 'candles', 'plant', 'tall_plant', 'deck_chair', 'mirror'] },
  meditation: { name: 'Zen Room', emoji: '🧘', vibe: 'nature', items: ['floor_cushion', 'floor_cushion', 'floor_cushion', 'plant', 'fern', 'candles', 'rug', 'painting'] },
  workshop: { name: 'Creator Corner', emoji: '🎬', vibe: 'night', items: ['desk', 'chair', 'easel', 'neon_sign', 'polaroid_wall', 'lava_lamp', 'beanbag', 'bookshelf'] },
};

// the style you choose for the house adds a couple of matching touches to its main rooms
const STYLE_TOUCHES = {
  cozy: ['candles', 'curtains'], pastel: ['flower_vase', 'heart_balloon'], modern: ['mirror', 'tall_plant'],
  retro: ['lava_lamp', 'clock'], nature: ['fern', 'cactus'], night: ['neon_sign', 'lava_lamp'],
};
const TOUCHED = new Set(['entrance', 'living', 'lounge', 'date_night', 'studio']);

/** Rooms you can add on top of the basics. `for` = which house types recommend it (shown first). */
export const EXTRAS = [
  { id: 'kitchen', name: 'Kitchen', emoji: '🍳', for: ['love', 'friends', 'family', 'solo'] },
  { id: 'study', name: 'Study', emoji: '📚', for: ['family', 'solo'] },
  { id: 'cinema', name: 'Home Cinema', emoji: '🍿', for: ['love', 'friends'] },
  { id: 'garden', name: 'Garden', emoji: '🌳', for: ['family', 'friends'] },
  { id: 'balcony', name: 'Balcony', emoji: '🌇', for: ['love', 'solo'] },
  { id: 'spa', name: 'Spa', emoji: '🧖', for: ['love', 'solo'] },
  { id: 'pet_corner', name: 'Pet Corner', emoji: '🐾', for: ['family', 'solo'] },
  { id: 'game_room', name: 'Game Room', emoji: '🎮', for: ['friends', 'family', 'solo'] },
  { id: 'arcade', name: 'Arcade', emoji: '🕹️', for: ['friends'] },
  { id: 'music_room', name: 'Music Room', emoji: '🎵', for: ['friends'] },
  { id: 'party_room', name: 'Party Room', emoji: '🎉', for: ['friends'] },
  { id: 'hall_of_fame', name: 'Hall of Fame', emoji: '🏆', for: ['friends'] },
  { id: 'memory_room', name: 'Memory Room', emoji: '📸', for: ['love'] },
  { id: 'dream_room', name: 'Dream Room', emoji: '✨', for: ['love'] },
  { id: 'trip_hq', name: 'Trip HQ', emoji: '✈️', for: ['love', 'friends'] },
  { id: 'wish_corner', name: 'Wish Corner', emoji: '🎁', for: ['family', 'love'] },
  { id: 'playroom', name: 'Playroom', emoji: '🧩', for: ['family'] },
  { id: 'meditation', name: 'Zen Room', emoji: '🧘', for: ['solo'] },
  { id: 'workshop', name: 'Creator Corner', emoji: '🎬', for: ['solo'] },
];

// which blueprint is the 1st, 2nd... bedroom / bathroom of each kind of house
const BEDROOMS = {
  love: ['bedroom', 'guest_bedroom', 'guest_bedroom', 'guest_bedroom'],
  friends: ['sleepover_room', 'guest_bedroom', 'guest_bedroom', 'guest_bedroom'],
  family: ['bedroom', 'kids_room', 'kids_room', 'guest_bedroom'],
  solo: ['bedroom', 'guest_bedroom', 'guest_bedroom', 'guest_bedroom'],
};
const BATHROOMS = ['bathroom', 'powder_room', 'bathroom'];
export const MAX_BEDROOMS = 4;
export const MAX_BATHROOMS = 3;

/** Ready-made layouts. `main` = the main room (ground floor, next to the entrance). */
const PRESETS = {
  love: [
    { id: 'cozy_two', name: 'Cozy for Two', emoji: '🕯️', blurb: 'A snug date-night nest with a bedroom and your memories', main: 'date_night', bedrooms: 1, bathrooms: 1, extras: ['kitchen', 'memory_room'] },
    { id: 'long_distance', name: 'Long-Distance Love', emoji: '🌍', blurb: 'Date nights, trips and wishes, for two homes far apart', main: 'date_night', bedrooms: 0, bathrooms: 0, extras: ['memory_room', 'dream_room', 'trip_hq', 'balcony'] },
    { id: 'first_apartment', name: 'Our First Apartment', emoji: '🔑', blurb: 'A real little home: kitchen, bedroom, bathroom, balcony', main: 'living', bedrooms: 1, bathrooms: 1, extras: ['kitchen', 'balcony'] },
  ],
  friends: [
    { id: 'squad_pad', name: 'Squad Pad', emoji: '🛋️', blurb: 'Lounge, games, a sleepover room and a wall of fame', main: 'lounge', bedrooms: 1, bathrooms: 1, extras: ['kitchen', 'game_room', 'hall_of_fame'] },
    { id: 'game_night', name: 'Game Night HQ', emoji: '🕹️', blurb: 'Arcade, game room, karaoke and snacks', main: 'lounge', bedrooms: 0, bathrooms: 1, extras: ['arcade', 'game_room', 'kitchen', 'music_room'] },
    { id: 'party_house', name: 'Party House', emoji: '🎉', blurb: 'DJ booth, garden, and bathrooms for the queue', main: 'lounge', bedrooms: 1, bathrooms: 2, extras: ['party_room', 'kitchen', 'garden'] },
  ],
  family: [
    { id: 'family_classic', name: 'Family Classic', emoji: '🏡', blurb: 'Living room, kitchen, parents and kids, a wish corner', main: 'living', bedrooms: 2, bathrooms: 1, extras: ['kitchen', 'wish_corner'] },
    { id: 'big_family', name: 'Big Family', emoji: '👨‍👩‍👧‍👦', blurb: 'More beds, two bathrooms, a playroom and a garden', main: 'living', bedrooms: 3, bathrooms: 2, extras: ['kitchen', 'playroom', 'garden'] },
    { id: 'grandmas_place', name: "Grandma's Place", emoji: '🧶', blurb: 'Piano, kitchen, a study and a flower garden', main: 'living', bedrooms: 1, bathrooms: 1, extras: ['kitchen', 'garden', 'study'] },
  ],
  solo: [
    { id: 'creator_studio', name: 'Creator Studio', emoji: '🎨', blurb: 'A studio, a creator corner and a game break', main: 'studio', bedrooms: 0, bathrooms: 0, extras: ['workshop', 'game_room', 'music_room'] },
    { id: 'tiny_home', name: 'Tiny Home', emoji: '🏠', blurb: 'Everything you need and nothing you do not', main: 'living', bedrooms: 1, bathrooms: 1, extras: ['kitchen'] },
    { id: 'zen_retreat', name: 'Zen Retreat', emoji: '🧘', blurb: 'Calm living room, spa, zen room and a balcony', main: 'living', bedrooms: 1, bathrooms: 1, extras: ['spa', 'meditation', 'balcony'] },
  ],
};

export const MAIN_ROOMS = {
  love: [{ id: 'date_night', name: 'Date Night', emoji: '💞' }, { id: 'living', name: 'Living Room', emoji: '🛋️' }],
  friends: [{ id: 'lounge', name: 'Lounge', emoji: '🛋️' }, { id: 'living', name: 'Living Room', emoji: '🏠' }],
  family: [{ id: 'living', name: 'Living Room', emoji: '🛋️' }],
  solo: [{ id: 'studio', name: 'Studio', emoji: '🎨' }, { id: 'living', name: 'Living Room', emoji: '🛋️' }],
};

export const presetsFor = (type) => PRESETS[type] || PRESETS.solo;
export const defaultChoices = (type) => ({ preset: presetsFor(type)[0].id, ...choicesOf(presetsFor(type)[0]) });
export const choicesOf = (p) => ({ main: p.main, bedrooms: p.bedrooms, bathrooms: p.bathrooms, extras: [...p.extras] });
export const presetById = (type, id) => presetsFor(type).find((p) => p.id === id) || null;

/** The choices -> an ordered list of rooms: [{ blueprint, name }]. Entrance first, then the main room and the kitchen
 *  (ground floor), the extras, bedrooms, bathrooms, and finally the airy rooms (balcony, garden, spa) on top. */
export function planRooms(type, choices = {}) {
  const c = { ...choicesOf(presetsFor(type)[0]), ...choices };
  const top = new Set(['balcony', 'garden', 'spa', 'meditation']);
  const extras = EXTRAS.map((e) => e.id).filter((id) => (c.extras || []).includes(id));
  const ids = ['entrance', c.main];
  if (extras.includes('kitchen')) ids.push('kitchen');
  ids.push(...extras.filter((id) => id !== 'kitchen' && !top.has(id)));
  const beds = Math.max(0, Math.min(MAX_BEDROOMS, c.bedrooms | 0)); const baths = Math.max(0, Math.min(MAX_BATHROOMS, c.bathrooms | 0));
  for (let i = 0; i < beds; i++) ids.push(BEDROOMS[type]?.[i] || 'guest_bedroom');
  for (let i = 0; i < baths; i++) ids.push(BATHROOMS[i]);
  ids.push(...extras.filter((id) => top.has(id)));
  // never more than MAX_ROOMS: drop from the end (the optional extras go first)
  const kept = ids.slice(0, MAX_ROOMS).filter((id) => BLUEPRINTS[id]);
  const seen = {};
  return kept.map((id) => { seen[id] = (seen[id] || 0) + 1; const base = BLUEPRINTS[id].name; return { blueprint: id, name: seen[id] > 1 ? `${base} ${seen[id]}` : base }; });
}

/** The catalogue items of one room of the plan, with the house style's touches added to the main rooms. */
export function itemsFor(blueprint, vibe) {
  const bp = BLUEPRINTS[blueprint];
  if (!bp) return [];
  const touches = TOUCHED.has(blueprint) ? (STYLE_TOUCHES[vibe] || []) : [];
  return [...bp.items, ...touches];
}

export const roomVibe = (blueprint, houseVibe) => BLUEPRINTS[blueprint]?.vibe || houseVibe;
export const summaryOf = (plan) => ({ rooms: plan.length, floors: Math.ceil(plan.length / 2) });
