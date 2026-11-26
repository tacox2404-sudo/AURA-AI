// CATALOGUE TEXT (owned by Building): the cluster, a one-line description and style tags of EVERY item.
// This is what the catalogue screen shows. To add a new item: add its model in catalog.js / catalogMore.js
// and one line here. Styles use the same names as the room vibes: cozy, pastel, modern, retro, nature, night.

export const CLUSTERS = [
  { id: 'living', icon: '🛋️', name: 'Living', blurb: 'Sofas, tables and everything for hanging out' },
  { id: 'bedroom', icon: '🛏️', name: 'Bedroom', blurb: 'Beds, storage and sleepy things' },
  { id: 'kitchen', icon: '🍳', name: 'Kitchen & dining', blurb: 'Cook, eat, repeat' },
  { id: 'bath', icon: '🛁', name: 'Bathroom', blurb: 'The splash zone' },
  { id: 'fun', icon: '🎮', name: 'Games & fun', blurb: 'Play together, live or later' },
  { id: 'memories', icon: '🖼️', name: 'Memories & boards', blurb: 'Photos, plans and wishes that live here' },
  { id: 'light', icon: '💡', name: 'Lighting', blurb: 'Set the mood' },
  { id: 'decor', icon: '🌿', name: 'Plants & decor', blurb: 'Make it feel alive' },
  { id: 'walls', icon: '🪟', name: 'Walls & windows', blurb: 'Paintings, mirrors and curtains' },
  { id: 'kids', icon: '🧸', name: 'Kids & pets', blurb: 'Little ones and furry friends' },
  { id: 'outdoor', icon: '🌤️', name: 'Outdoor & balcony', blurb: 'A corner of fresh air' },
];

export const STYLES = ['cozy', 'pastel', 'modern', 'retro', 'nature', 'night'];

/** What tapping an item DOES, in plain words (shown on the card as "✨ ..."). */
export const ACTIVITY_WHAT = {
  connect4: 'Play Connect Four, live or turn by turn', tictactoe: 'Play Tic-Tac-Toe, live or turn by turn', draw: 'Draw & Guess with your people',
  games: 'Opens the games menu', leaderboard: 'Scores, streaks and win records', movies: 'Pick a movie for movie night', portal: 'Opens a link you choose (a playlist, a stream, a game...)',
  notes: 'Shared notes and checklists', gallery: 'Your photo gallery with captions and "On this day"', links: 'Pinned links the house shares', calendar: 'Shared dates with a countdown',
  weather: 'The weather in each of your cities', travel: 'Plan trips together', trip: 'Find your next trip: ideas, flights and "fly to your partner"', wishlist: 'Wish list with secret gift claiming',
  nudge: 'Send a "thinking of you"', invite: 'Invite links and codes', chat: 'The house chat',
};

// id: [cluster, description, [styles]]
export const INFO = {
  // living
  sofa: ['living', 'Room for two. Official home of movie nights and long chats.', ['cozy', 'retro']],
  armchair: ['living', 'Your own corner. Great for reading or dramatic sighing.', ['cozy', 'retro']],
  beanbag: ['living', 'Squishy, floppy, and impossible to sit in elegantly.', ['cozy', 'pastel']],
  bench: ['living', 'A simple seat for two, in a hall or by a window.', ['modern', 'nature']],
  coffee_table: ['living', 'Where snacks, remotes and cups live together.', ['cozy', 'modern']],
  side_table: ['living', 'A little round table for a lamp, a drink or a plant.', ['cozy', 'modern']],
  ottoman: ['living', 'A cushy seat or footrest that also hides clutter.', ['cozy', 'pastel']],
  floor_cushion: ['living', 'Sit low, hang out lazy. Stackable in spirit.', ['cozy', 'pastel']],
  desk: ['living', 'A proper workspace with a screen. Snacks allowed.', ['modern']],
  bookshelf: ['living', 'Notes and lists, and books to look smart.', ['cozy', 'retro']],
  rug: ['living', 'Ties the room together. Walkable.', ['cozy', 'pastel', 'retro']],
  fireplace: ['living', 'Warm glow, zero smoke, no firewood to carry.', ['cozy', 'retro']],
  // bedroom
  bed: ['bedroom', 'A big bed for two, with pillows on top of pillows.', ['cozy', 'pastel']],
  single_bed: ['bedroom', 'A neat single bed for a guest, kid or nap.', ['cozy', 'modern']],
  nightstand: ['bedroom', 'A little drawer for a book, a lamp and secrets.', ['cozy', 'modern']],
  wardrobe: ['bedroom', 'Big storage for all the outfits you will not wear.', ['cozy', 'retro']],
  dresser: ['bedroom', 'Drawers, drawers, and a flat top for photos.', ['cozy', 'retro']],
  vanity: ['bedroom', 'A little table with a mirror for getting ready.', ['pastel', 'retro']],
  // kitchen
  table: ['kitchen', 'Dinner, homework, board games. Seats a crowd.', ['cozy', 'modern']],
  chair: ['kitchen', 'A trusty wooden chair. Pulls up to any table.', ['cozy', 'modern']],
  fridge: ['kitchen', 'Sticky notes live here: "we are out of milk".', ['modern', 'retro']],
  counter: ['kitchen', 'A kitchen counter with a sink-shaped dent.', ['cozy', 'modern']],
  stove: ['kitchen', 'Four burners and an oven. Cooking sounds not included.', ['modern', 'retro']],
  kitchen_island: ['kitchen', 'A middle-of-the-room counter with a fruit bowl.', ['modern', 'cozy']],
  sink_counter: ['kitchen', 'A counter with a sink and a tap that never drips.', ['modern', 'cozy']],
  bar_stool: ['kitchen', 'Tall seat for the island. Spins in your imagination.', ['modern', 'retro']],
  // bath
  bathtub: ['bath', 'Bubbles not included. Rubber duck sold separately.', ['pastel', 'modern']],
  toilet: ['bath', 'Every house needs one. We will not show a demo.', ['modern']],
  sink: ['bath', 'A pedestal sink with a mirror strip above it.', ['modern', 'pastel']],
  shower: ['bath', 'A glass shower corner. Hot water is imaginary.', ['modern']],
  bathmat: ['bath', 'A fluffy mat to step on. Walkable.', ['pastel', 'cozy']],
  towel_rack: ['bath', 'Two towels, always slightly damp.', ['modern', 'pastel']],
  laundry_basket: ['bath', 'Where socks go to wait.', ['cozy', 'nature']],
  // fun
  connect4_table: ['fun', 'Four in a row wins. Revenge games are encouraged.', ['retro', 'cozy']],
  tictactoe_table: ['fun', 'Quick, ruthless, mostly draws.', ['retro', 'modern']],
  easel: ['fun', 'Draw & Guess. Stick figures are welcome.', ['pastel', 'nature']],
  arcade: ['fun', 'A glowing cabinet that picks a game for you.', ['retro', 'night']],
  pool_table: ['fun', 'Half game, half furniture. Cues not included.', ['retro', 'night']],
  trophy: ['fun', 'Leaderboards and win records. Humility not included.', ['modern', 'retro']],
  tv: ['fun', 'Movie night central. Pick something everyone agrees on.', ['modern', 'night']],
  portal: ['fun', 'A doorway to any website. Not Narnia. Probably.', ['night', 'modern']],
  jukebox: ['fun', 'Link a song or playlist and set the whole mood.', ['retro', 'night']],
  piano: ['fun', 'Pure decoration, which is a mercy.', ['retro', 'cozy']],
  big_button: ['fun', 'One big button that opens a link. Press responsibly.', ['retro', 'night']],
  foosball: ['fun', 'Spin the rods, yell at the ball. A classic.', ['retro', 'night']],
  dartboard: ['fun', 'A dartboard on a stand. Safe: the darts are invisible.', ['retro', 'cozy']],
  pinball: ['fun', 'Flashing lights and a very serious tiny ball.', ['retro', 'night']],
  board_games: ['fun', 'A shelf of board games, all missing one piece.', ['cozy', 'retro']],
  karaoke: ['fun', 'Two speakers, a screen and a mic. Everyone is a star.', ['night', 'retro']],
  // memories & boards
  photo_frame: ['memories', 'A frame for your memory gallery: captions, dates, "On this day".', ['cozy', 'pastel']],
  link_board: ['memories', 'Pin the links that matter: recipes, trips, memes.', ['modern', 'cozy']],
  calendar_board: ['memories', 'Shared dates with a countdown to the next meetup.', ['modern', 'cozy']],
  checklist_board: ['memories', 'The house to-do list. Ticking things off feels great.', ['modern', 'cozy']],
  weather_window: ['memories', 'The weather in each of your cities. Small talk, solved.', ['nature', 'modern']],
  globe: ['memories', 'Plan trips together. Passport not required.', ['retro', 'cozy']],
  gift_box: ['memories', 'Add gifts you want; others claim them secretly. Surprise-safe.', ['pastel', 'cozy']],
  mailbox: ['memories', 'Send a "thinking of you" nudge. Cheaper than flowers.', ['pastel', 'retro']],
  welcome_sign: ['memories', 'Invite links and codes, right at the door.', ['cozy', 'nature']],
  noticeboard: ['memories', 'The house chat, pinned on a board. Gossip responsibly.', ['cozy', 'retro']],
  trip_board: ['memories', 'A map board for your next trip: ideas, flights, "fly to you".', ['modern', 'nature']],
  sticker_wall: ['memories', 'A wall of colourful notes and stickers for little reminders.', ['pastel', 'retro']],
  polaroid_wall: ['memories', 'Little instant photos pinned up: your gallery on the wall.', ['pastel', 'cozy']],
  // lighting
  lamp: ['light', 'A tall floor lamp with a soft glow.', ['cozy', 'modern']],
  table_lamp: ['light', 'A small lamp for a nightstand or side table.', ['cozy', 'retro']],
  wall_sconce: ['light', 'A wall light that adds a warm pool of glow.', ['cozy', 'retro']],
  string_lights: ['light', 'Fairy lights strung between two poles. Instant party.', ['pastel', 'night']],
  lava_lamp: ['light', 'Blobs go up, blobs go down. Hypnotic.', ['retro', 'night']],
  neon_sign: ['light', 'A glowing neon sign for a late-night room.', ['night', 'retro']],
  candles: ['light', 'Mood lighting, no fire department.', ['cozy', 'pastel']],
  // decor
  plant: ['decor', 'A leafy friend. Please do not ask who waters it.', ['nature', 'cozy']],
  tall_plant: ['decor', 'Grows without sunlight. Relatable.', ['nature', 'modern']],
  tree: ['decor', 'An indoor tree. Ambition!', ['nature']],
  cactus: ['decor', 'Needs almost no care and has opinions.', ['nature', 'modern']],
  flower_vase: ['decor', 'Fresh-looking flowers that never wilt.', ['pastel', 'nature']],
  fern: ['decor', 'A fluffy fern for a green corner.', ['nature', 'cozy']],
  heart_balloon: ['decor', 'Heart balloons: pure vibes, zero helium costs.', ['pastel']],
  clock: ['decor', 'A grandfather clock that opens your calendar.', ['retro', 'cozy']],
  // walls
  painting: ['walls', 'A framed painting to fill a blank wall.', ['cozy', 'modern', 'retro']],
  mirror: ['walls', 'A tall standing mirror: check the outfit, check the vibe.', ['modern', 'pastel']],
  window_frame: ['walls', 'A window with a sky view, for rooms that lack one.', ['modern', 'nature']],
  curtains: ['walls', 'Soft curtains in your accent colour.', ['cozy', 'pastel']],
  wall_shelf: ['walls', 'A little shelf with books and a plant on it.', ['cozy', 'nature']],
  // kids & pets
  toy_chest: ['kids', 'A chest of toys. Always one on the floor.', ['pastel', 'retro']],
  play_tent: ['kids', 'A tiny tent for hiding, secrets and snacks.', ['pastel', 'cozy']],
  pet_bed: ['kids', 'A round, soft bed for your pet.', ['cozy', 'pastel']],
  cat_tree: ['kids', 'Climb, perch, knock things off. Cats approved.', ['cozy', 'nature']],
  fish_tank: ['kids', 'A tank with fish that are always fed.', ['nature', 'modern']],
  // outdoor
  bbq: ['outdoor', 'Sizzle-free barbecue for the balcony.', ['retro', 'nature']],
  hammock: ['outdoor', 'Swing, nap, repeat. Two trees not required.', ['nature', 'cozy']],
  patio_chair: ['outdoor', 'A wicker chair for sunny corners.', ['nature', 'cozy']],
  patio_table: ['outdoor', 'A small round table for coffee outside.', ['nature', 'cozy']],
  fire_pit: ['outdoor', 'A glowing fire pit. Marshmallows are imaginary.', ['nature', 'night']],
};
