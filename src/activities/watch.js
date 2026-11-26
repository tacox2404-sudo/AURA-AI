// WHAT SHOULD WE WATCH NEXT? (owned by Activities)
// Pick one or more genres, how much time you have, and (optional) which streaming services
// you have. We suggest a movie that fits, from a small hand-picked list (no paid APIs, no AI:
// simple points), and say where it usually streams, with a button to search it there.
// Streaming catalogues change by country and over time, so every movie also has a
// "Where is it in my country?" button (a Google search that shows local platforms).
// Tap 🍿 on movies you want to see: when two people pick the same one, it's a match.
// Everything is saved under one house-wide key, so everyone in the house sees the same picks.

const KEY = 'house:watch-next';

const fill = (el, ...kids) => el.replaceChildren(...kids.flat().filter((k) => k != null && k !== false));
const enc = encodeURIComponent;

export const GENRES = [
  { id: 'animation', label: '🎨 Animation' }, { id: 'comedy', label: '😂 Comedy' }, { id: 'romance', label: '💞 Romance' },
  { id: 'adventure', label: '🗺️ Adventure' }, { id: 'action', label: '💥 Action' }, { id: 'scifi', label: '🚀 Sci-fi' },
  { id: 'fantasy', label: '🧚 Fantasy' }, { id: 'mystery', label: '🕵️ Mystery' }, { id: 'drama', label: '🎭 Drama' },
  { id: 'musical', label: '🎤 Musical' }, { id: 'feelgood', label: '☀️ Feel-good' }, { id: 'christmas', label: '🎄 Christmas' },
];

// How much time we have -> the longest movie (in minutes) we suggest
export const TIMES = [
  { id: 'short', label: '🕐 Quick (up to 1h40)', max: 100 },
  { id: 'mid', label: '🕑 About 2 hours', max: 125 },
  { id: 'long', label: '🕒 Up to 2h40', max: 160 },
  { id: 'any', label: '🌙 All night', max: 999 },
];

// Streaming services. search(title) opens that service's search for the movie.
export const SERVICES = {
  netflix: { label: 'Netflix', color: '#e50914', search: (t) => `https://www.netflix.com/search?q=${enc(t)}` },
  disney: { label: 'Disney+', color: '#113ccf', search: (t) => `https://www.disneyplus.com/search?q=${enc(t)}` },
  prime: { label: 'Prime Video', color: '#00a8e1', search: (t) => `https://www.primevideo.com/search/?phrase=${enc(t)}` },
  apple: { label: 'Apple TV+', color: '#333', search: (t) => `https://tv.apple.com/search?term=${enc(t)}` },
  max: { label: 'HBO Max', color: '#5822b4', search: (t) => `https://play.hbomax.com/search?q=${enc(t)}` },
  paramount: { label: 'Paramount+', color: '#0064ff', search: (t) => `https://www.paramountplus.com/search/?q=${enc(t)}` },
  rent: { label: 'Rent or buy', color: '#8a6d3b', search: (t) => `https://www.google.com/search?q=${enc(`${t} rent online`)}` },
};

// The hand-picked movies. min = runtime in minutes. on = where it USUALLY streams (first = most likely).
// Family friendly only (rated G / PG / PG-13 at most). Add more freely: same shape.
export const MOVIES = [
  // Disney+
  { id: 'toy-story', title: 'Toy Story', year: 1995, min: 81, g: ['animation', 'comedy', 'adventure'], on: ['disney'], why: 'The toys come alive when you leave the room. Pure comfort.' },
  { id: 'up', title: 'Up', year: 2009, min: 96, g: ['animation', 'adventure', 'feelgood', 'drama'], on: ['disney'], why: 'A flying house, a talking dog and the most famous first 10 minutes ever. Tissues ready.' },
  { id: 'inside-out', title: 'Inside Out', year: 2015, min: 95, g: ['animation', 'comedy', 'feelgood'], on: ['disney'], why: 'Meet the little voices in your head: Joy, Sadness, Anger and friends.' },
  { id: 'inside-out-2', title: 'Inside Out 2', year: 2024, min: 96, g: ['animation', 'comedy', 'feelgood'], on: ['disney'], why: 'Riley grows up and Anxiety moves in. Funny and very true.' },
  { id: 'coco', title: 'Coco', year: 2017, min: 105, g: ['animation', 'musical', 'fantasy', 'drama'], on: ['disney'], why: 'A boy, a guitar and a glowing land of the dead full of family.' },
  { id: 'moana', title: 'Moana', year: 2016, min: 107, g: ['animation', 'musical', 'adventure'], on: ['disney'], why: 'Sail the ocean with a brave girl and a demigod. Songs you will sing for days.' },
  { id: 'frozen', title: 'Frozen', year: 2013, min: 102, g: ['animation', 'musical', 'fantasy'], on: ['disney'], why: 'Two sisters, a snowman and one song you definitely know.' },
  { id: 'zootopia', title: 'Zootopia', year: 2016, min: 108, g: ['animation', 'comedy', 'mystery'], on: ['disney'], why: 'A bunny cop and a fox solve a mystery in a city of animals.' },
  { id: 'ratatouille', title: 'Ratatouille', year: 2007, min: 111, g: ['animation', 'comedy', 'feelgood'], on: ['disney'], why: 'A rat who wants to be a chef in Paris. Watch it hungry.' },
  { id: 'wall-e', title: 'WALL-E', year: 2008, min: 98, g: ['animation', 'scifi', 'romance'], on: ['disney'], why: 'A tiny robot falls in love in space. Almost no words, all heart.' },
  { id: 'incredibles', title: 'The Incredibles', year: 2004, min: 115, g: ['animation', 'action', 'comedy'], on: ['disney'], why: 'A family of superheroes trying to live a normal life.' },
  { id: 'encanto', title: 'Encanto', year: 2021, min: 102, g: ['animation', 'musical', 'fantasy'], on: ['disney'], why: 'A magical house and a family where everyone has a gift. Except Mirabel.' },
  { id: 'soul', title: 'Soul', year: 2020, min: 100, g: ['animation', 'drama', 'fantasy'], on: ['disney'], why: 'A jazz teacher gets a second chance. Makes you want to enjoy every day.' },
  { id: 'luca', title: 'Luca', year: 2021, min: 95, g: ['animation', 'adventure', 'feelgood'], on: ['disney'], why: 'A summer on the Italian Riviera with two sea monster friends.' },
  { id: 'elemental', title: 'Elemental', year: 2023, min: 101, g: ['animation', 'romance'], on: ['disney'], why: 'Fire falls for water. They really should not touch.' },
  { id: 'enchanted', title: 'Enchanted', year: 2007, min: 107, g: ['romance', 'comedy', 'musical', 'fantasy'], on: ['disney'], why: 'A cartoon princess lands in real New York and keeps singing.' },
  { id: 'princess-bride', title: 'The Princess Bride', year: 1987, min: 98, g: ['romance', 'fantasy', 'comedy', 'adventure'], on: ['disney'], why: 'Pirates, giants, sword fights and true love. As you wish.' },
  { id: 'home-alone', title: 'Home Alone', year: 1990, min: 103, g: ['comedy', 'christmas'], on: ['disney'], why: 'Kevin defends the house from burglars with genius traps.' },
  { id: 'free-guy', title: 'Free Guy', year: 2021, min: 115, g: ['comedy', 'action', 'scifi'], on: ['disney'], why: 'A video game character finds out he is in a video game.' },
  { id: 'greatest-showman', title: 'The Greatest Showman', year: 2017, min: 105, g: ['musical', 'drama', 'feelgood'], on: ['disney'], why: 'Circus, big dreams and songs that make you want to dance.' },
  { id: 'hidden-figures', title: 'Hidden Figures', year: 2016, min: 127, g: ['drama', 'feelgood'], on: ['disney'], why: 'The true story of the women whose maths sent astronauts to space.' },
  { id: 'guardians', title: 'Guardians of the Galaxy', year: 2014, min: 121, g: ['action', 'scifi', 'comedy'], on: ['disney'], why: 'A team of misfits, a talking raccoon and an awesome mixtape.' },
  { id: 'star-wars', title: 'Star Wars: A New Hope', year: 1977, min: 121, g: ['scifi', 'adventure', 'action'], on: ['disney'], why: 'Where it all started: farm boy, princess, space wizards.' },
  { id: 'pirates', title: 'Pirates of the Caribbean: The Curse of the Black Pearl', year: 2003, min: 143, g: ['adventure', 'action', 'fantasy', 'comedy'], on: ['disney'], why: 'Captain Jack Sparrow, cursed pirates and a lot of rum jokes.' },
  { id: 'avatar', title: 'Avatar', year: 2009, min: 162, g: ['scifi', 'adventure', 'action'], on: ['disney'], why: 'A glowing jungle planet. Best on the biggest screen you have.' },
  { id: 'endgame', title: 'Avengers: Endgame', year: 2019, min: 181, g: ['action', 'scifi', 'adventure'], on: ['disney'], why: 'Three hours of every Marvel hero at once. Snacks needed.' },
  { id: 'sound-of-music', title: 'The Sound of Music', year: 1965, min: 174, g: ['musical', 'romance', 'drama'], on: ['disney'], why: 'The hills are alive! A classic for a long cosy evening.' },
  // Netflix
  { id: 'klaus', title: 'Klaus', year: 2019, min: 96, g: ['animation', 'christmas', 'comedy'], on: ['netflix'], why: 'How a lazy postman and a lonely toymaker invented Santa.' },
  { id: 'mitchells', title: 'The Mitchells vs. the Machines', year: 2021, min: 114, g: ['animation', 'comedy', 'scifi'], on: ['netflix'], why: 'The weirdest family road trip, during a robot uprising.' },
  { id: 'kpop-demon-hunters', title: 'KPop Demon Hunters', year: 2025, min: 100, g: ['animation', 'musical', 'action', 'fantasy'], on: ['netflix'], why: 'A K-pop girl group fights demons with their songs.' },
  { id: 'leo', title: 'Leo', year: 2023, min: 102, g: ['animation', 'comedy', 'musical'], on: ['netflix'], why: 'An old class lizard gives fifth graders life advice.' },
  { id: 'nimona', title: 'Nimona', year: 2023, min: 101, g: ['animation', 'fantasy', 'action'], on: ['netflix'], why: 'A shape-shifting girl and a knight with a robot arm.' },
  { id: 'sea-beast', title: 'The Sea Beast', year: 2022, min: 115, g: ['animation', 'adventure', 'fantasy'], on: ['netflix'], why: 'Monster hunters at sea find out the monsters are not so bad.' },
  { id: 'chicken-run-2', title: 'Chicken Run: Dawn of the Nugget', year: 2023, min: 101, g: ['animation', 'comedy', 'adventure'], on: ['netflix'], why: 'The chickens break IN this time. Clay animation chaos.' },
  { id: 'wallace-gromit', title: 'Wallace & Gromit: Vengeance Most Fowl', year: 2024, min: 79, g: ['animation', 'comedy', 'mystery'], on: ['netflix'], note: 'BBC iPlayer in the UK', why: 'The evil penguin is back. Short, clever and very British.' },
  { id: 'over-the-moon', title: 'Over the Moon', year: 2020, min: 95, g: ['animation', 'musical', 'fantasy'], on: ['netflix'], why: 'A girl builds a rocket to meet the moon goddess.' },
  { id: 'spirited-away', title: 'Spirited Away', year: 2001, min: 125, g: ['animation', 'fantasy'], on: ['netflix', 'max'], note: 'HBO Max in the US', why: 'A magical bathhouse for spirits. Studio Ghibli at its best.' },
  { id: 'totoro', title: 'My Neighbor Totoro', year: 1988, min: 86, g: ['animation', 'fantasy', 'feelgood'], on: ['netflix', 'max'], note: 'HBO Max in the US', why: 'Two sisters and a giant fluffy forest spirit. The cosiest movie.' },
  { id: 'howl', title: "Howl's Moving Castle", year: 2004, min: 119, g: ['animation', 'fantasy', 'romance'], on: ['netflix', 'max'], note: 'HBO Max in the US', why: 'A walking castle, a wizard and a girl under a spell.' },
  { id: 'glass-onion', title: 'Glass Onion', year: 2022, min: 139, g: ['mystery', 'comedy'], on: ['netflix'], why: 'A murder mystery game on a billionaire’s island. Guess who did it.' },
  { id: 'enola-holmes', title: 'Enola Holmes', year: 2020, min: 123, g: ['mystery', 'adventure'], on: ['netflix'], why: 'Sherlock’s little sister is the better detective.' },
  { id: 'murder-mystery', title: 'Murder Mystery', year: 2019, min: 97, g: ['mystery', 'comedy'], on: ['netflix'], why: 'A couple on holiday get caught in a murder. Light and silly.' },
  { id: 'adam-project', title: 'The Adam Project', year: 2022, min: 106, g: ['scifi', 'action', 'comedy'], on: ['netflix'], why: 'A time traveller teams up with his 12-year-old self.' },
  { id: 'red-notice', title: 'Red Notice', year: 2021, min: 118, g: ['action', 'comedy'], on: ['netflix'], why: 'Art thieves, an FBI agent and a lot of jokes.' },
  { id: 'set-it-up', title: 'Set It Up', year: 2018, min: 105, g: ['romance', 'comedy'], on: ['netflix'], why: 'Two assistants set up their bosses... and fall for each other.' },
  { id: 'to-all-the-boys', title: "To All the Boys I've Loved Before", year: 2018, min: 99, g: ['romance', 'comedy'], on: ['netflix'], why: 'Secret love letters get sent by mistake. Sweet and funny.' },
  { id: 'christmas-chronicles', title: 'The Christmas Chronicles', year: 2018, min: 104, g: ['christmas', 'comedy', 'adventure'], on: ['netflix'], why: 'Two kids help a very cool Santa save Christmas.' },
  { id: 'mario', title: 'The Super Mario Bros. Movie', year: 2023, min: 92, g: ['animation', 'comedy', 'adventure'], on: ['netflix', 'rent'], note: 'Peacock in the US', why: 'Mario and Luigi in the Mushroom Kingdom. Full of game jokes.' },
  { id: 'despicable-me', title: 'Despicable Me', year: 2010, min: 95, g: ['animation', 'comedy'], on: ['netflix', 'rent'], note: 'Peacock in the US', why: 'A supervillain adopts three girls. Minions everywhere.' },
  // Prime Video
  { id: 'red-one', title: 'Red One', year: 2024, min: 123, g: ['christmas', 'action', 'comedy'], on: ['prime'], why: 'Santa gets kidnapped and his bodyguard needs help.' },
  { id: 'cinderella-2021', title: 'Cinderella', year: 2021, min: 113, g: ['musical', 'romance', 'comedy'], on: ['prime'], why: 'A pop-music Cinderella who wants her own fashion shop.' },
  { id: 'your-christmas-or-mine', title: 'Your Christmas or Mine?', year: 2022, min: 96, g: ['christmas', 'romance', 'comedy'], on: ['prime'], why: 'A couple swap trains to surprise each other for Christmas.' },
  { id: 'knives-out', title: 'Knives Out', year: 2019, min: 130, g: ['mystery', 'comedy'], on: ['prime', 'rent'], why: 'A famous writer dies and the whole family is a suspect.' },
  // Apple TV+
  { id: 'coda', title: 'CODA', year: 2021, min: 111, g: ['drama', 'feelgood', 'musical'], on: ['apple'], why: 'The only hearing person in a deaf family wants to sing.' },
  { id: 'wolfwalkers', title: 'Wolfwalkers', year: 2020, min: 103, g: ['animation', 'fantasy', 'adventure'], on: ['apple'], why: 'A girl in old Ireland befriends a wild wolf girl. Gorgeous drawings.' },
  { id: 'luck', title: 'Luck', year: 2022, min: 105, g: ['animation', 'comedy', 'fantasy'], on: ['apple'], why: 'The unluckiest girl in the world finds the Land of Luck.' },
  { id: 'spirited', title: 'Spirited', year: 2022, min: 127, g: ['christmas', 'musical', 'comedy'], on: ['apple'], why: 'A musical twist on A Christmas Carol with big dance numbers.' },
  { id: 'greyhound', title: 'Greyhound', year: 2020, min: 91, g: ['action', 'drama'], on: ['apple'], why: 'A tense World War II battle at sea, short and gripping.' },
  { id: 'f1', title: 'F1', year: 2025, min: 155, g: ['action', 'drama'], on: ['apple'], why: 'A veteran driver comes back to Formula 1. Loud and fast.' },
  // HBO Max
  { id: 'barbie', title: 'Barbie', year: 2023, min: 114, g: ['comedy', 'fantasy', 'feelgood'], on: ['max'], why: 'Barbie leaves Barbieland for the real world. Pink and very funny.' },
  { id: 'wonka', title: 'Wonka', year: 2023, min: 116, g: ['musical', 'fantasy', 'comedy'], on: ['max', 'rent'], why: 'Young Willy Wonka and his first chocolate shop.' },
  { id: 'elf', title: 'Elf', year: 2003, min: 97, g: ['christmas', 'comedy'], on: ['max', 'rent'], why: 'A human raised by elves goes to New York to find his dad.' },
  { id: 'dune', title: 'Dune', year: 2021, min: 155, g: ['scifi', 'adventure', 'drama'], on: ['max', 'rent'], why: 'A desert planet, giant sandworms and an epic story.' },
  { id: 'harry-potter-1', title: "Harry Potter and the Philosopher's Stone", year: 2001, min: 152, g: ['fantasy', 'adventure'], on: ['max', 'rent'], note: 'changes a lot by country', why: 'Your letter to Hogwarts has arrived.' },
  { id: 'lotr-1', title: 'The Lord of the Rings: The Fellowship of the Ring', year: 2001, min: 178, g: ['fantasy', 'adventure', 'action'], on: ['max', 'prime'], why: 'Nine friends, one ring, a very long walk. Perfect for a long night.' },
  // Paramount+
  { id: 'top-gun-maverick', title: 'Top Gun: Maverick', year: 2022, min: 131, g: ['action', 'drama'], on: ['paramount'], why: 'Fighter jets, big speeches and a great soundtrack.' },
  // Usually rent / changes a lot
  { id: 'paddington-2', title: 'Paddington 2', year: 2017, min: 103, g: ['comedy', 'feelgood', 'adventure'], on: ['rent'], why: 'The politest bear in London ends up in prison. Maybe the nicest movie ever.' },
  { id: 'back-to-the-future', title: 'Back to the Future', year: 1985, min: 116, g: ['scifi', 'comedy', 'adventure'], on: ['rent'], why: 'A time-travelling car and a very awkward trip to 1955.' },
  { id: 'jurassic-park', title: 'Jurassic Park', year: 1993, min: 127, g: ['scifi', 'adventure', 'action'], on: ['rent'], why: 'Welcome to an island full of real dinosaurs. What could go wrong?' },
  { id: 'notting-hill', title: 'Notting Hill', year: 1999, min: 124, g: ['romance', 'comedy'], on: ['rent'], why: 'A London bookshop owner and a movie star. Classic rom-com.' },
  { id: 'mamma-mia', title: 'Mamma Mia!', year: 2008, min: 108, g: ['musical', 'romance', 'comedy'], on: ['rent'], why: 'ABBA songs on a Greek island. Sing along, no shame.' },
  { id: 'the-holiday', title: 'The Holiday', year: 2006, min: 136, g: ['romance', 'christmas', 'comedy'], on: ['rent'], why: 'Two women swap houses for Christmas and find love.' },
  { id: 'wicked', title: 'Wicked', year: 2024, min: 160, g: ['musical', 'fantasy', 'drama'], on: ['rent'], note: 'Peacock in the US', why: 'The witches of Oz before Dorothy arrived. Huge songs.' },
];

/** "1h 45m" from minutes. */
export const hm = (min) => `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m`;

/** A Google search that shows where the movie streams in YOUR country. */
export const whereLink = (m) => `https://www.google.com/search?q=${enc(`${m.title} ${m.year} where to watch`)}`;

/** A number from 0 to 1.5 that is the same all day for a movie, and different tomorrow. */
function dailyLuck(id, day = new Date().toDateString()) {
  let n = 0;
  for (const c of id + day) n = (n * 31 + c.charCodeAt(0)) % 1000;
  return (n / 1000) * 1.5;
}

/**
 * Simple points. Movies longer than our time are left out, watched ones too.
 * Each matching genre +2, a service we have +3, and a little bonus for using the time well.
 * If no movie matches a picked genre, we still show the rest (so there is always a suggestion).
 */
export function suggest({ genres = [], time = 'mid', services = [], watched = [] } = {}) {
  const max = (TIMES.find((t) => t.id === time) || TIMES[1]).max;
  const fits = MOVIES.filter((m) => m.min <= max && !watched.includes(m.id));
  const scored = fits.map((m) => {
    const hits = genres.filter((g) => m.g.includes(g)).length;
    let score = hits * 2;
    if (services.length && m.on.some((s) => services.includes(s))) score += 3;
    if (max < 999) score += (m.min / max) * 0.5; // closer to the time we have = a bit better
    score += dailyLuck(m.id); // a little shuffle that changes every day (same for everyone in the house)
    return { ...m, hits, score };
  });
  const withGenre = genres.length ? scored.filter((m) => m.hits > 0) : scored;
  return (withGenre.length ? withGenre : scored).sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
}

export const WATCH = {
  watch: {
    title: 'What should we watch next?', icon: '🎬', wide: true,
    open: (api) => {
      const { h } = api;
      // genres: picked genres, time: how long, services: what we have, hearts: { movieId: [userIds] }, watched: [movieIds]
      let plan = { genres: [], time: 'mid', services: [], hearts: {}, watched: [] };
      let page = 0; // "Something else" shows the next 3
      const root = h('div', { class: 'trip watch' });
      const meId = api.me.id;
      const save = () => api.save(plan, KEY);
      const names = (uids) => uids.map((u) => (u === meId ? 'You' : api.nameOf(u))).join(' + ');

      // A row of chips. multi = several can be on at once (genres, services).
      const chips = (list, isOn, onTap) => h('div', { class: 'trip-chips' },
        ...list.map((o) => h('button', { class: 'chip' + (isOn(o.id) ? ' active' : ''), onclick: () => { onTap(o.id); page = 0; save(); draw(); } }, o.label)));
      const toggle = (arr, id) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

      // Little coloured badges: "Netflix · Disney+"
      const badges = (m) => h('div', { class: 'watch-badges' },
        ...m.on.map((s) => h('a', { class: 'watch-badge', style: `background:${SERVICES[s].color}`, href: SERVICES[s].search(m.title), target: '_blank', rel: 'noopener' }, SERVICES[s].label)),
        m.note ? h('small', { class: 'muted' }, ` (${m.note})`) : null);

      function card(m, big) {
        const hearts = plan.hearts?.[m.id] || [];
        const mine = hearts.includes(meId);
        const match = hearts.length >= 2;
        const main = SERVICES[m.on[0]];
        return h('div', { class: 'card trip-idea' + (big ? ' watch-top' : '') + (match ? ' match' : '') },
          h('div', { class: 'trip-idea-head' },
            h('b', {}, m.title), h('small', { class: 'muted' }, ` ${m.year} · ⏱️ ${hm(m.min)}`)),
          h('p', { class: 'small' }, m.why),
          h('div', { class: 'small' }, '📺 Usually on: ', badges(m)),
          match ? h('p', { class: 'trip-match' }, `💞 It's a match! ${names(hearts)} want to watch it`) : null,
          h('div', { class: 'row-btns' },
            h('a', { class: 'btn primary', href: main.search(m.title), target: '_blank', rel: 'noopener', onclick: () => api.award(2, 'picked a movie') }, `▶ ${main.label}`),
            h('button', { onclick: () => {
              const now = mine ? hearts.filter((u) => u !== meId) : [...hearts, meId];
              plan.hearts = { ...plan.hearts, [m.id]: now };
              if (!mine && now.length >= 2) { api.toast(`💞 You both want to watch ${m.title}!`); api.award(5, 'matched a movie'); }
              save(); draw();
            } }, mine ? '🍿 Want it' : '🤍 Want it'),
            h('button', { class: 'icon-btn', title: 'Share in chat', onclick: () => {
              api.ctx.use('chat.send')(`🎬 What about "${m.title}" (${hm(m.min)}, ${main.label})? ${m.why}`);
              api.toast('Shared in the house chat');
            } }, '💬')),
          h('div', { class: 'row-btns' },
            h('a', { class: 'btn small', href: whereLink(m), target: '_blank', rel: 'noopener' }, '🔎 Where is it in my country?'),
            h('button', { class: 'small', onclick: () => {
              plan.watched = [...(plan.watched || []), m.id];
              plan.hearts = { ...plan.hearts, [m.id]: [] };
              api.toast(`✓ ${m.title} marked as watched`); api.award(3, 'movie night');
              save(); draw();
            } }, '✓ We watched it')));
      }

      function draw() {
        const list = suggest(plan);
        const pages = Math.max(1, Math.ceil(list.length / 3));
        if (page >= pages) page = 0;
        const shown = list.slice(page * 3, page * 3 + 3);
        const wanted = MOVIES.filter((m) => (plan.hearts?.[m.id] || []).length);
        const watched = MOVIES.filter((m) => (plan.watched || []).includes(m.id));
        const noGenreHit = plan.genres.length && list.length && !list[0].hits;
        fill(root,
          h('div', { class: 'card' },
            h('h4', {}, '🍿 Movie night: what do we feel like?'),
            h('div', { class: 'opt-label small' }, 'Genres (pick one or more)'),
            chips([{ id: '*', label: '✨ Anything' }, ...GENRES], (id) => (id === '*' ? !plan.genres.length : plan.genres.includes(id)),
              (id) => { plan.genres = id === '*' ? [] : toggle(plan.genres, id); }),
            h('div', { class: 'opt-label small' }, 'How much time do we have?'),
            chips(TIMES, (id) => id === plan.time, (id) => { plan.time = id; }),
            h('div', { class: 'opt-label small' }, 'What do we have? (optional)'),
            chips(Object.entries(SERVICES).filter(([id]) => id !== 'rent').map(([id, s]) => ({ id, label: s.label })),
              (id) => plan.services.includes(id), (id) => { plan.services = toggle(plan.services, id); })),
          !list.length ? h('p', { class: 'muted' }, 'You have watched everything that fits! Try more time, or un-watch something below.') : null,
          noGenreHit ? h('p', { class: 'small muted' }, 'Nothing fits all of that, so here are other ideas that fit your time.') : null,
          shown.length ? h('h4', {}, page === 0 ? '🎬 Tonight we watch...' : '🎬 Or maybe...') : null,
          ...shown.map((m, i) => card(m, i === 0 && page === 0)),
          list.length > 3 ? h('div', { class: 'row-btns' }, h('button', { onclick: () => { page = (page + 1) % pages; draw(); } }, '🔀 Something else')) : null,
          wanted.length ? h('div', { class: 'card' }, h('h4', {}, '🍿 Our watch list'),
            ...wanted.map((m) => {
              const hs = plan.hearts[m.id];
              return h('div', { class: 'row' },
                h('span', { class: 'row-main' }, (hs.length >= 2 ? '💞 ' : '') + m.title, h('small', {}, `${hm(m.min)} · ${SERVICES[m.on[0]].label} · wanted by ${names(hs).replace(/^You/, 'you')}`)),
                h('a', { class: 'btn', href: SERVICES[m.on[0]].search(m.title), target: '_blank', rel: 'noopener' }, '▶'));
            })) : null,
          watched.length ? h('details', { class: 'card' }, h('summary', { class: 'small' }, `✓ Already watched (${watched.length})`),
            ...watched.map((m) => h('div', { class: 'row' },
              h('span', { class: 'row-main done' }, m.title),
              h('button', { class: 'small', onclick: () => { plan.watched = plan.watched.filter((x) => x !== m.id); save(); draw(); } }, 'Un-watch')))) : null,
          h('p', { class: 'muted small' }, 'Where a movie streams changes by country and over time. Tap 🔎 to check yours. Links open in a new tab.'));
      }

      api.load(KEY).then((v) => { if (v) plan = { ...plan, ...v }; draw(); });
      api.onRemote((v) => { plan = { ...plan, ...v }; draw(); }, KEY);
      draw();
      return root;
    },
  },
};
