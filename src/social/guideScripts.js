// WHAT PIP SAYS (owned by Social). All the jokes live here, so anyone can add or fix a line.
// Keep lines short (one or two sentences), friendly and family safe. No real people.
// A step is { say, mood, room, point, choices }; see guide.js for what each field does.

// ---------- house type flavour ----------
const INTRO = {
  love: (n) => ({ say: `Welcome to ${n}! A Love Nest: where "thinking of you" is a feature, not a clingy text.`, mood: 'love' }),
  friends: (n) => ({ say: `Welcome to ${n}! The Friends Crib: group chat, but with furniture and fewer unread messages.`, mood: 'wow' }),
  family: (n) => ({ say: `Welcome to ${n}! A Family Home: everybody's here, nobody's doing the dishes. Perfect.`, mood: 'wink' }),
  solo: (n) => ({ say: `Welcome to ${n}! A Solo Studio: a party of one (for now). Invite people whenever you like.`, mood: 'happy' }),
};

// ---------- rooms (by room name) ----------
const ROOM_TIPS = {
  'Entrance': { say: 'The Entrance. The welcome sign has your invite links, the mailbox sends "thinking of you" nudges.', mood: 'happy' },
  'Game Room': { say: 'The Game Room: Connect Four, Tic-Tac-Toe and a drawing easel. Friendly competition. "Friendly".', mood: 'wink' },
  'Date Night': { say: 'Date Night: TV, sofa, candles and a fireplace. Peak romance engineering. Movie picks are on the TV.', mood: 'love' },
  'Memory Room': { say: 'The Memory Room: photos with captions, a shared calendar and a countdown to the next meetup.', mood: 'love' },
  'Dream Room': { say: 'The Dream Room: a wish list with secret gift claiming, the travel globe and the weather window.', mood: 'wow' },
  'Lounge': { say: 'The Lounge: sofa, beanbags and a jukebox. Official headquarters of doing nothing together.', mood: 'happy' },
  'Trip HQ': { say: 'Trip HQ: globe, calendar, link board, checklist. Where plans go to be 90% planned.', mood: 'think' },
  'Hall of Fame': { say: 'The Hall of Fame: trophies, photos and a big button. Do not press the button. Okay, press it.', mood: 'wink' },
  'Living Room': { say: 'The Living Room: TV, fireplace, piano. Somebody will play it badly. It will be adorable.', mood: 'happy' },
  'Kitchen': { say: 'The Kitchen: the fridge holds notes, the calendar settles "whose turn is it to cook?".', mood: 'wink' },
  'Wish Corner': { say: 'The Wish Corner: gift boxes for wish lists. Others can claim a gift secretly. Surprise-safe!', mood: 'love' },
  'Studio': { say: 'The Studio: desk, bookshelf, checklist. Where Solo Studio owners pretend to be productive.', mood: 'think' },
};

// ---------- objects (by catalog id), then by activity as a fallback ----------
const ITEM_TIPS = {
  welcome_sign: 'Welcome sign: tap it for invite links. Doorbell energy.',
  noticeboard: 'The noticeboard is your house chat. Gossip responsibly.',
  mailbox: 'Mailbox: send a "thinking of you" nudge. Cheaper than flowers.',
  arcade: 'Arcade machine: tap it to pick a game. High scores mean bragging rights.',
  connect4_table: 'Connect Four: play live or turn by turn. Revenge is allowed.',
  tictactoe_table: 'Tic-Tac-Toe: quick, ruthless, mostly draws.',
  easel: 'Easel: Draw & Guess. Stick figures are welcome. Encouraged, even.',
  trophy: 'Trophy stand: leaderboards and win records. Humility not included.',
  pool_table: 'Pool table: part game, mostly decor. Like most pool tables.',
  tv: 'TV: movie night. Pick something everyone agrees on (good luck).',
  portal: 'Portal: a doorway to any website. Not Narnia. Probably.',
  jukebox: 'Jukebox: link a song or playlist. Please no 10-hour loops.',
  bookshelf: 'Bookshelf: notes and lists. Smart-looking storage.',
  photo_frame: 'Memory gallery: photos with captions. "On this day" brings back old memories.',
  link_board: 'Link board: pin the links that matter. Recipes, trips, memes.',
  calendar_board: 'Calendar: shared dates plus a countdown to the next meetup.',
  clock: 'Grandfather clock: opens the calendar. Ticks like it knows something.',
  checklist_board: 'Checklist and notes: the house to-do list. Ticking things off feels great.',
  weather_window: 'Weather window: the weather in each of your cities. Small talk, solved.',
  globe: 'Travel globe: plan trips with smart links. Passport not required.',
  gift_box: 'Wish list: add gifts you want, others claim them in secret. Surprise-safe.',
  big_button: 'The big button opens a link. Press it responsibly.',
  fridge: 'Fridge: sticky notes for the house. "We are out of milk" lives here.',
  desk: 'A desk. For serious work. And serious snacking.',
  sofa: 'Sofa: peak sitting technology.',
  armchair: 'Armchair: for dramatic sighs and cozy chats.',
  beanbag: 'Beanbag: once you sit, you live here now.',
  bed: 'A bed. For decor purposes only. We swear.',
  bathtub: 'A bathtub. Rubber duck sold separately.',
  piano: 'Piano: purely decorative, which is a mercy.',
  fireplace: 'Fireplace: warmth with zero smoke and zero firewood.',
  candles: 'Candles: mood lighting, no fire department.',
  heart_balloon: 'Heart balloons: pure vibes, zero helium costs.',
  lamp: 'Floor lamp: mood lighting, no subscription.',
  plant: 'A plant. Please do not ask who waters it.',
  tall_plant: 'Tall plant: it grows without sunlight. Relatable.',
  tree: 'An indoor tree. Ambition!',
  rug: 'A rug. It really ties the room together.',
};
const ACTIVITY_TIPS = {
  games: 'Tap it to open the games.', connect4: 'Tap it to play Connect Four.', tictactoe: 'Tap it to play Tic-Tac-Toe.', draw: 'Tap it to play Draw & Guess.',
  leaderboard: 'Tap it for scores and win records.', movies: 'Tap it for movie night.', portal: 'Tap it to open a link.', notes: 'Tap it for notes and lists.',
  gallery: 'Tap it for your photo gallery.', links: 'Tap it for pinned links.', calendar: 'Tap it for the shared calendar.', weather: 'Tap it for the weather.',
  travel: 'Tap it to plan a trip.', wishlist: 'Tap it for the wish list.', nudge: 'Tap it to say "thinking of you".', invite: 'Tap it for invite links.', chat: 'Tap it to open the chat.',
};

/** One object explained. `def` is the catalog entry (name, activity) or null. */
export function itemSteps(item, def) {
  const name = def?.name || 'This thing';
  const tip = ITEM_TIPS[item?.kind] || (def?.activity && ACTIVITY_TIPS[def.activity]) || `${name}: it is here to look good. Relatable.`;
  const how = def?.activity && ITEM_TIPS[item?.kind] ? ' Tap it again to use it.' : '';
  return [{ say: `${tip}${how}`, mood: def?.activity ? 'happy' : 'wink' }];
}

/** One room explained (used by "Explain this room" and inside the house tour). */
export function roomSteps(room, house, defOf) {
  const tip = ROOM_TIPS[room.name];
  const stepOne = tip ? { ...tip } : (() => {
    const names = [...new Set((room.items || []).map((it) => defOf(it.kind)?.name).filter(Boolean))].slice(0, 3);
    return { say: `${room.name}: ${names.length ? `you have ${names.join(', ')}` : 'a blank canvas'}. Make it yours in Build mode!`, mood: 'happy' };
  })();
  stepOne.room = room.id;
  // one extra line about the most interesting object here, if there is one
  const fun = (room.items || []).map((it) => ({ it, def: defOf(it.kind) })).find((x) => x.def?.activity && ITEM_TIPS[x.it.kind] && !(tip && tip.say.toLowerCase().includes((x.def.name || '').toLowerCase().split(' ')[0])));
  return fun ? [stepOne, { say: ITEM_TIPS[fun.it.kind], mood: 'wink' }] : [stepOne];
}

/** First time ever: who am I, how do I move. */
export function welcomeSteps(me) {
  return [
    { say: `Hi ${me?.username || 'there'}! I'm Pip, your tour guide. I'm legally required to be adorable.`, mood: 'happy' },
    { say: 'AURA is a cozy little world you build with your people. Live, or at different times. No rush, no rules.', mood: 'wow' },
    { say: 'Tap the floor to walk. Pinch to zoom. Tap things to use them. That is the whole control scheme.', mood: 'wink' },
  ];
}

/** Every new house: ask first, never force. */
export function offerSteps(house, role) {
  const who = role === 'guest' ? `You're a guest in ${house.name}. ` : '';
  return [{ say: `${who}Want a quick tour of ${house.name}? I promise jokes. Some of them are even good.`, mood: 'wink',
    choices: [{ label: 'Show me!', value: 'yes' }, { label: "I'll explore", value: 'no' }] }];
}

/** The tour of this specific house: type, its real rooms, then the toolbox. Guests get a shorter, tailored version. */
export function houseTourSteps(house, role, defOf) {
  const editor = role === 'owner' || role === 'housemate';
  const steps = [(INTRO[house.type] || INTRO.solo)(house.name)];
  for (const room of house.rooms || []) steps.push(...roomSteps(room, house, defOf).slice(0, 1)); // one line per room keeps it fast
  steps.push({ say: 'The bar at the bottom is your toolbox. 🚪 Rooms: hop around, or ask AI to invent one. "Sauna, but haunted" is allowed.', mood: 'wow', point: 'rooms' });
  steps.push(editor
    ? { say: '🛠️ Build: place, move, rotate, delete. Furniture has no feelings. Probably.', mood: 'wink', point: 'build' }
    : { say: `You're a guest, so you can look, chat and play. Rearranging the furniture is above your pay grade.`, mood: 'wink' });
  steps.push({ say: '💬 Chat is in the bar. 👥 People lives under ⋯ More: invite codes, who is home, roles. Owners can open the house to visitors.', mood: 'happy', point: 'people' });
  steps.push({ say: '🤝 Friends: add people by username, visit their open houses, even when they are not home.', mood: 'wow', point: 'friends' });
  steps.push({ say: '👕 Wardrobe: outfits! And 🏆 points for everything. Nothing is locked behind them. Just glory.', mood: 'love', point: 'wardrobe' });
  steps.push({ say: `That's the tour! Find me any time under ⋯ More → ❓ Guide: replay the tour, or ask about a room or an object.`, mood: 'love' });
  return steps;
}

/** The feature list, for the cheat sheet panel. */
export const CHEAT_SHEET = [
  ['🚪 Rooms', 'Switch rooms, add rooms, or let AI build one from a sentence.'],
  ['🛠️ Build', 'Housemates place, move, rotate and delete furniture.'],
  ['⋯ More', 'The ribbon on the right edge holds People, Friends, Scores, Wardrobe and this Guide.'],
  ['👕 Wardrobe', 'Change your look any time.'],
  ['🎲 Play', 'Connect Four, Tic-Tac-Toe, Draw & Guess. Live or turn by turn.'],
  ['💬 Chat', 'Talk, send nudges, see speech bubbles.'],
  ['👥 People', 'Invite codes and links, roles, and the "friends can visit" switch.'],
  ['🤝 Friends', 'Add friends by username and visit their open houses.'],
  ['🏆 Scores', 'Points, streaks and win records. Nothing is locked behind points.'],
  ['📸 Objects', 'Tap furniture to use it: gallery, calendar, wish list, travel, weather, movies and more.'],
];
