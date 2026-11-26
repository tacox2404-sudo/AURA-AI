// TRIP PLANNER (owned by Activities): "Where should we go next?"
// Pick WHEN (summer, Christmas, New Year's Eve...), a vibe and a budget, and we suggest
// the best places from a small hand-picked list (no paid APIs, no AI: simple points).
// Every idea has a Skyscanner button with dates for that period already filled in.
// Tap ♥ on ideas you like: when two people heart the same place, it's a match.
// "Close the distance" = a button that opens Skyscanner for a flight to the other person's city.
//
// Where the cities come from: when a house is made, the creator types "your city" and
// "your partner's city" (saved in house.cities, first = creator). Anyone can fix their own
// city here; that fix is saved in this activity's shared state (cities: { userId: 'Lisbon' }).
// Everything is saved under one house-wide key, so the globe and the ⋯ More button show the same plan.

const KEY = 'house:trip-planner';

const fill = (el, ...kids) => el.replaceChildren(...kids.flat().filter((k) => k != null && k !== false));
// "São Paulo " -> "sao paulo" so typed cities match our list
const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// ---- WHEN: each period has a label and the dates we pre-fill on Skyscanner ----
// [startMonth, startDay, nights] (months 1-12). 'weekend' = next Friday, 'anytime' = no dates.
export const PERIODS = [
  { id: 'summer', label: '☀️ Summer', dates: [7, 15, 10] },
  { id: 'christmas', label: '🎄 Christmas', dates: [12, 22, 5] },
  { id: 'nye', label: "🎆 New Year's Eve", dates: [12, 29, 4] },
  { id: 'valentine', label: '💝 Valentine’s', dates: [2, 13, 3] },
  { id: 'snow', label: '❄️ Winter snow', dates: [2, 5, 5] },
  { id: 'spring', label: '🌸 Spring / Easter', dates: [4, 10, 5] },
  { id: 'autumn', label: '🍂 Autumn', dates: [10, 10, 5] },
  { id: 'weekend', label: '🧳 A long weekend', dates: 'weekend' },
  { id: 'anytime', label: '🗓️ Anytime', dates: null },
];
export const VIBES = [
  { id: 'any', label: '✨ Surprise us' }, { id: 'beach', label: '🏖️ Beach' }, { id: 'city', label: '🏙️ City' },
  { id: 'romantic', label: '💞 Romantic' }, { id: 'nature', label: '🌲 Nature' }, { id: 'food', label: '🍝 Food' },
  { id: 'snow', label: '⛷️ Snow' }, { id: 'party', label: '🎉 Party' },
];
export const BUDGETS = [{ id: 1, label: '€ Cheap' }, { id: 2, label: '€€ Medium' }, { id: 3, label: '€€€ Treat us' }];

// ---- WHERE: the hand-picked destinations ----
// code = airport code Skyscanner understands. when = best periods. budget 1-3. near = good for a weekend from Europe.
export const DESTINATIONS = [
  { name: 'Lisbon', country: 'Portugal', code: 'lis', when: ['spring', 'autumn', 'nye', 'weekend', 'summer'], vibes: ['city', 'food', 'romantic'], budget: 1, near: true, why: 'Sunny hills, trams, pastéis de nata and sunsets over the river.' },
  { name: 'Barcelona', country: 'Spain', code: 'bcn', when: ['spring', 'summer', 'autumn', 'weekend'], vibes: ['city', 'beach', 'food', 'party'], budget: 2, near: true, why: 'Beach in the morning, Gaudí in the afternoon, tapas until late.' },
  { name: 'Rome', country: 'Italy', code: 'fco', when: ['spring', 'autumn', 'christmas', 'weekend'], vibes: ['city', 'food', 'romantic'], budget: 2, near: true, why: 'Pasta, piazzas and throwing a coin in the Trevi fountain together.' },
  { name: 'Paris', country: 'France', code: 'cdg', when: ['valentine', 'spring', 'christmas', 'weekend'], vibes: ['romantic', 'city', 'food'], budget: 3, near: true, why: 'The classic: croissants, the Eiffel Tower sparkling at night.' },
  { name: 'Vienna', country: 'Austria', code: 'vie', when: ['christmas', 'nye', 'autumn'], vibes: ['city', 'romantic', 'food'], budget: 2, near: true, why: 'The prettiest Christmas markets, hot punch and a New Year’s waltz.' },
  { name: 'Prague', country: 'Czechia', code: 'prg', when: ['christmas', 'nye', 'weekend', 'autumn'], vibes: ['city', 'romantic', 'party'], budget: 1, near: true, why: 'Fairytale old town, cheap and cosy, fireworks over the bridge.' },
  { name: 'Copenhagen', country: 'Denmark', code: 'cph', when: ['christmas', 'summer'], vibes: ['city', 'food'], budget: 3, near: true, why: 'Tivoli lights, hygge cafés and bikes everywhere.' },
  { name: 'Amsterdam', country: 'Netherlands', code: 'ams', when: ['spring', 'nye', 'weekend'], vibes: ['city', 'party'], budget: 3, near: true, why: 'Tulips in spring, canal walks and wild New Year fireworks.' },
  { name: 'Edinburgh', country: 'Scotland', code: 'edi', when: ['nye', 'summer', 'christmas'], vibes: ['city', 'party', 'nature'], budget: 2, near: true, why: 'Hogmanay is one of the best New Year parties in the world.' },
  { name: 'Berlin', country: 'Germany', code: 'ber', when: ['nye', 'summer', 'weekend'], vibes: ['city', 'party'], budget: 2, near: true, why: 'Huge New Year party at the Brandenburg Gate, museums by day.' },
  { name: 'Budapest', country: 'Hungary', code: 'bud', when: ['christmas', 'nye', 'weekend', 'autumn'], vibes: ['city', 'romantic', 'party'], budget: 1, near: true, why: 'Warm thermal baths under the stars, even in winter.' },
  { name: 'Rovaniemi (Lapland)', country: 'Finland', code: 'rvn', when: ['christmas', 'snow', 'nye'], vibes: ['snow', 'nature', 'romantic'], budget: 3, why: 'Northern lights, husky rides and visiting Santa’s village.' },
  { name: 'Tromsø', country: 'Norway', code: 'tos', when: ['snow', 'nye', 'christmas'], vibes: ['snow', 'nature'], budget: 3, why: 'Chase the northern lights wrapped in one blanket.' },
  { name: 'Innsbruck (Alps)', country: 'Austria', code: 'inn', when: ['snow', 'christmas'], vibes: ['snow', 'nature'], budget: 2, near: true, why: 'Ski in the day, cheese fondue in a wooden hut at night.' },
  { name: 'Geneva (Alps)', country: 'Switzerland', code: 'gva', when: ['snow', 'summer'], vibes: ['snow', 'nature'], budget: 3, near: true, why: 'Lakes and mountains, chocolate in every shop.' },
  { name: 'Reykjavík', country: 'Iceland', code: 'kef', when: ['nye', 'snow', 'summer'], vibes: ['nature', 'snow', 'romantic'], budget: 3, why: 'Waterfalls, hot springs and the whole city lighting fireworks.' },
  { name: 'Tenerife', country: 'Spain', code: 'tfs', when: ['christmas', 'snow', 'valentine', 'spring', 'nye'], vibes: ['beach', 'nature'], budget: 1, near: true, why: 'Beach weather even in winter, a volcano to hike.' },
  { name: 'Madeira', country: 'Portugal', code: 'fnc', when: ['nye', 'spring', 'autumn'], vibes: ['nature', 'romantic'], budget: 2, near: true, why: 'Green cliffs, flowers and a famous New Year fireworks show.' },
  { name: 'Mallorca', country: 'Spain', code: 'pmi', when: ['summer', 'spring'], vibes: ['beach', 'party'], budget: 2, near: true, why: 'Turquoise coves and little stone villages.' },
  { name: 'Crete', country: 'Greece', code: 'her', when: ['summer', 'autumn'], vibes: ['beach', 'food', 'nature'], budget: 1, near: true, why: 'Long beaches, Greek salads and warm sea until October.' },
  { name: 'Santorini', country: 'Greece', code: 'jtr', when: ['summer', 'autumn'], vibes: ['romantic', 'beach'], budget: 3, why: 'White houses, blue domes and the most famous sunset ever.' },
  { name: 'Dubrovnik', country: 'Croatia', code: 'dbv', when: ['summer', 'spring', 'autumn'], vibes: ['beach', 'city', 'romantic'], budget: 2, near: true, why: 'Walk the old city walls, then jump in the sea.' },
  { name: 'Naples + Amalfi', country: 'Italy', code: 'nap', when: ['summer', 'spring'], vibes: ['food', 'beach', 'romantic'], budget: 2, near: true, why: 'The best pizza on Earth and coastal roads full of lemons.' },
  { name: 'Seville', country: 'Spain', code: 'svq', when: ['spring', 'autumn', 'valentine'], vibes: ['city', 'romantic', 'food'], budget: 1, near: true, why: 'Orange trees, flamenco and warm evenings early in the year.' },
  { name: 'Marrakech', country: 'Morocco', code: 'rak', when: ['spring', 'autumn', 'christmas'], vibes: ['city', 'food'], budget: 1, why: 'Colourful markets, mint tea and desert trips.' },
  { name: 'Dubai', country: 'UAE', code: 'dxb', when: ['christmas', 'nye', 'snow'], vibes: ['city', 'beach', 'party'], budget: 3, why: 'Winter sun and New Year fireworks on the tallest tower.' },
  { name: 'Bali', country: 'Indonesia', code: 'dps', when: ['summer', 'autumn'], vibes: ['beach', 'nature', 'romantic'], budget: 2, why: 'Rice terraces, temples and lazy beach days.' },
  { name: 'Bangkok + islands', country: 'Thailand', code: 'bkk', when: ['christmas', 'nye', 'snow'], vibes: ['food', 'beach', 'party'], budget: 1, why: 'Street food heaven, then an island in the sun.' },
  { name: 'Tokyo', country: 'Japan', code: 'hnd', when: ['spring', 'autumn'], vibes: ['city', 'food'], budget: 3, why: 'Cherry blossoms in spring, red leaves in autumn, ramen always.' },
  { name: 'New York', country: 'USA', code: 'jfk', when: ['christmas', 'nye', 'autumn'], vibes: ['city', 'party', 'food'], budget: 3, why: 'Skating under the big tree and the Times Square ball drop.' },
  { name: 'Cancún', country: 'Mexico', code: 'cun', when: ['christmas', 'snow', 'valentine'], vibes: ['beach', 'party'], budget: 2, why: 'Caribbean beaches in the middle of winter.' },
  { name: 'Cape Town', country: 'South Africa', code: 'cpt', when: ['christmas', 'nye', 'valentine'], vibes: ['nature', 'beach', 'food'], budget: 2, why: 'It is summer there at Christmas: mountains, penguins and wine.' },
  { name: 'Sydney', country: 'Australia', code: 'syd', when: ['christmas', 'nye'], vibes: ['city', 'beach', 'party'], budget: 3, why: 'Christmas on the beach and the world-famous harbour fireworks.' },
  { name: 'Maldives', country: 'Maldives', code: 'mle', when: ['valentine', 'christmas', 'snow', 'spring'], vibes: ['beach', 'romantic'], budget: 3, why: 'A tiny island, crystal water: the dream treat.' },
];

// Home cities we know an airport for (anyone can also type a 3-letter airport code like MXP)
const AIRPORTS = {
  milan: 'mxp', milano: 'mxp', rome: 'fco', roma: 'fco', turin: 'trn', torino: 'trn', naples: 'nap', napoli: 'nap',
  florence: 'flr', firenze: 'flr', venice: 'vce', venezia: 'vce', bologna: 'blq', bari: 'bri', palermo: 'pmo', catania: 'cta',
  genoa: 'goa', genova: 'goa', verona: 'vrn', pisa: 'psa', cagliari: 'cag', lisbon: 'lis', lisboa: 'lis', porto: 'opo',
  madrid: 'mad', barcelona: 'bcn', valencia: 'vlc', seville: 'svq', malaga: 'agp', paris: 'cdg', nice: 'nce', lyon: 'lys',
  marseille: 'mrs', london: 'lhr', manchester: 'man', edinburgh: 'edi', dublin: 'dub', berlin: 'ber', munich: 'muc',
  frankfurt: 'fra', hamburg: 'ham', amsterdam: 'ams', brussels: 'bru', zurich: 'zrh', geneva: 'gva', vienna: 'vie',
  prague: 'prg', budapest: 'bud', warsaw: 'waw', krakow: 'krk', athens: 'ath', istanbul: 'ist', bucharest: 'otp',
  stockholm: 'arn', copenhagen: 'cph', oslo: 'osl', helsinki: 'hel', reykjavik: 'kef', 'new york': 'jfk', nyc: 'jfk',
  boston: 'bos', chicago: 'ord', miami: 'mia', 'los angeles': 'lax', 'san francisco': 'sfo', seattle: 'sea',
  toronto: 'yyz', montreal: 'yul', vancouver: 'yvr', 'mexico city': 'mex', 'sao paulo': 'gru', rio: 'gig',
  'rio de janeiro': 'gig', 'buenos aires': 'eze', bogota: 'bog', lima: 'lim', santiago: 'scl', tokyo: 'hnd',
  seoul: 'icn', singapore: 'sin', 'hong kong': 'hkg', bangkok: 'bkk', dubai: 'dxb', mumbai: 'bom', delhi: 'del',
  sydney: 'syd', melbourne: 'mel', auckland: 'akl', 'cape town': 'cpt', johannesburg: 'jnb', cairo: 'cai', marrakech: 'rak',
};

/** City name (or airport code) -> airport code, or null if we don't know it. */
export function airportOf(city) {
  const n = norm(city);
  if (!n) return null;
  if (AIRPORTS[n]) return AIRPORTS[n];
  if (/^[a-z]{3}$/.test(n)) return n; // already an airport code, e.g. "mxp"
  const d = DESTINATIONS.find((x) => norm(x.name).startsWith(n));
  return d ? d.code : null;
}

/** Next start/end dates for a period, as JS Dates (or null for 'anytime'). */
export function periodDates(periodId, today = new Date()) {
  const p = PERIODS.find((x) => x.id === periodId);
  if (!p?.dates) return null;
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let start;
  if (p.dates === 'weekend') { start = new Date(t); start.setDate(t.getDate() + (((5 - t.getDay()) + 7) % 7 || 7)); }
  else {
    const [m, d] = p.dates;
    start = new Date(t.getFullYear(), m - 1, d);
    if (start <= t) start = new Date(t.getFullYear() + 1, m - 1, d); // already passed this year: next year
  }
  const end = new Date(start); end.setDate(start.getDate() + (p.dates === 'weekend' ? 3 : p.dates[2]));
  return { start, end };
}

// Skyscanner wants dates as yymmdd (e.g. 261229)
const yymmdd = (d) => String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');

/** A Skyscanner link from one city to an airport code, with the period's dates if any. */
export function skyscannerLink(fromCity, toCode, periodId) {
  const from = airportOf(fromCity);
  const dates = periodDates(periodId);
  const when = dates ? `${yymmdd(dates.start)}/${yymmdd(dates.end)}/` : '';
  if (from) return `https://www.skyscanner.net/transport/flights/${from}/${toCode}/${when}?adultsv2=2`;
  // We don't know where they fly from: Skyscanner's "flights to" page lets them pick
  return `https://www.skyscanner.net/transport/flights-to/${toCode}/`;
}

/** Simple points: right period +3, right vibe +2, fits the budget +1 (too expensive -2). */
export function suggest({ period = 'anytime', vibe = 'any', budget = 2, fromCity = '' } = {}) {
  const home = airportOf(fromCity);
  return DESTINATIONS
    .filter((d) => d.code !== home)
    .map((d) => {
      let score = 0;
      if (period === 'weekend') score += d.near ? 3 : -3;
      else if (period !== 'anytime' && d.when.includes(period)) score += 3;
      if (vibe !== 'any' && d.vibes.includes(vibe)) score += 2;
      if (d.budget <= budget) score += 1; else if (d.budget - budget >= 2) score -= 2;
      if (d.budget === budget) score += 0.5;
      return { ...d, score };
    })
    .sort((a, b) => b.score - a.score);
}

export const TRIPS = {
  trip: {
    title: 'Where should we go next?', icon: '✈️', wide: true,
    open: (api) => {
      const { h } = api;
      let plan = { period: 'summer', vibe: 'any', budget: 2, cities: {}, hearts: {} };
      let page = 0; // which 3 ideas we show ("Other ideas" moves to the next 3)
      const root = h('div', { class: 'trip' });

      const house = () => api.ctx.store.get().house || api.house;
      const meId = api.me.id;
      // The other person: first member that isn't me (housemates before guests)
      const partner = () => {
        const others = Object.entries(api.members).filter(([id]) => id !== meId);
        others.sort((a, b) => (a[1].role === 'guest') - (b[1].role === 'guest'));
        return others[0] ? { id: others[0][0], name: others[0][1].name || 'them' } : null;
      };
      // house.cities = [creator's city, partner's city] from onboarding. A city typed here wins.
      const cityOf = (uid) => {
        if (plan.cities?.[uid]) return plan.cities[uid];
        const c = house().cities || [];
        if (!uid) return '';
        if (uid === house().ownerId) return c[0] || '';
        return c[1] || '';
      };
      const save = () => api.save(plan, KEY);
      const setCity = (uid, value) => { plan.cities = { ...plan.cities, [uid]: value.trim() }; save(); draw(); };

      // A row of tap-able chips (wraps on phones)
      const chips = (list, value, onPick) => h('div', { class: 'trip-chips' },
        ...list.map((o) => h('button', { class: 'chip' + (o.id === value ? ' active' : ''), onclick: () => { onPick(o.id); page = 0; save(); draw(); } }, o.label)));

      const cityInput = (uid, placeholder) => {
        const input = h('input', { placeholder, value: cityOf(uid), list: 'trip-cities' });
        return h('div', { class: 'chat-input' }, input, h('button', { onclick: () => { if (input.value.trim()) setCity(uid, input.value); } }, 'Save'));
      };

      function idea(d) {
        const hearts = plan.hearts?.[d.code] || [];
        const mine = hearts.includes(meId);
        const match = hearts.length >= 2;
        return h('div', { class: 'card trip-idea' + (match ? ' match' : '') },
          h('div', { class: 'trip-idea-head' },
            h('b', {}, d.name), h('small', { class: 'muted' }, ` ${d.country} · ${'€'.repeat(d.budget)}`)),
          h('p', { class: 'small' }, d.why),
          match ? h('p', { class: 'trip-match' }, `💞 It's a match! ${hearts.map((u) => (u === meId ? 'You' : api.nameOf(u))).join(' + ')}`) : null,
          h('div', { class: 'row-btns' },
            h('a', { class: 'btn primary', href: skyscannerLink(cityOf(meId), d.code, plan.period), target: '_blank', rel: 'noopener', onclick: () => api.award(2, 'looked at flights') }, '✈️ Skyscanner'),
            h('button', { onclick: () => {
              const now = mine ? hearts.filter((u) => u !== meId) : [...hearts, meId];
              plan.hearts = { ...plan.hearts, [d.code]: now };
              if (!mine && now.length >= 2) { api.toast(`💞 You both love ${d.name}!`); api.award(5, 'matched a trip'); }
              save(); draw();
            } }, mine ? '💖 Loved' : '🤍 Love it'),
            h('button', { class: 'icon-btn', title: 'Share in chat', onclick: () => {
              const when = PERIODS.find((p) => p.id === plan.period)?.label || '';
              api.ctx.use('chat.send')(`✈️ Trip idea: ${d.name} (${when})? ${d.why}`);
              api.toast('Shared in the house chat');
            } }, '💬')));
      }

      // "Close the distance": fly to the other person's city
      function closeTheDistance() {
        const p = partner();
        const love = house().type === 'love';
        const name = p?.name || (love ? 'your partner' : 'them');
        const myCity = cityOf(meId);
        const theirCity = p ? cityOf(p.id) : (plan.cities?.partner || (house().cities || [])[1] || '');
        const theirCode = airportOf(theirCity);
        return h('div', { class: 'card trip-distance' },
          h('h4', {}, love ? '💞 Close the distance' : '🧳 Go visit'),
          theirCity
            ? h('p', { class: 'small' }, `${myCity ? `You: ${myCity}` : 'You: (add your city below)'} · ${name}: ${theirCity}`)
            : h('p', { class: 'small muted' }, `Where is ${name}? Add their city and the button will find flights there.`),
          theirCity && theirCode
            ? h('a', { class: 'btn primary wide', href: skyscannerLink(myCity, theirCode, 'anytime'), target: '_blank', rel: 'noopener', onclick: () => api.award(3, 'closing the distance') }, `✈️ Fly to ${name}`)
            : theirCity ? h('p', { class: 'small error' }, `We don't know the airport for "${theirCity}" yet. Type its 3-letter airport code instead (e.g. MXP).`) : null,
          h('details', {}, h('summary', { class: 'small' }, '📍 Change cities'),
            h('label', { class: 'field' }, h('span', {}, 'My city'), cityInput(meId, 'e.g. Milan')),
            h('label', { class: 'field' }, h('span', {}, `${p ? p.name : 'Their'} city`), cityInput(p?.id || 'partner', 'e.g. São Paulo'))));
      }

      function draw() {
        const ideas = suggest({ ...plan, fromCity: cityOf(meId) });
        const shown = ideas.slice(page * 3, page * 3 + 3);
        const loved = DESTINATIONS.filter((d) => (plan.hearts?.[d.code] || []).length);
        fill(root,
          h('datalist', { id: 'trip-cities' }, ...Object.keys(AIRPORTS).filter((c) => c.length > 3).map((c) => h('option', { value: c.replace(/\b\w/g, (x) => x.toUpperCase()) }))),
          closeTheDistance(),
          h('div', { class: 'card' },
            h('h4', {}, '🗺️ Plan our next trip'),
            h('div', { class: 'opt-label small' }, 'When?'), chips(PERIODS, plan.period, (v) => { plan.period = v; }),
            h('div', { class: 'opt-label small' }, 'What vibe?'), chips(VIBES, plan.vibe, (v) => { plan.vibe = v; }),
            h('div', { class: 'opt-label small' }, 'Budget?'), chips(BUDGETS, plan.budget, (v) => { plan.budget = v; })),
          h('h4', {}, page === 0 ? '✨ Our best picks for you' : '✨ More ideas'),
          ...shown.map(idea),
          h('div', { class: 'row-btns' }, h('button', { onclick: () => { page = (page + 1) % Math.ceil(ideas.length / 3); draw(); } }, '🔀 Other ideas')),
          loved.length ? h('div', { class: 'card' }, h('h4', {}, '💖 Our shortlist'),
            ...loved.map((d) => {
              const hs = plan.hearts[d.code];
              return h('div', { class: 'row' },
                h('span', { class: 'row-main' }, (hs.length >= 2 ? '💞 ' : '') + d.name, h('small', {}, `loved by ${hs.map((u) => (u === meId ? 'you' : api.nameOf(u))).join(' + ')}`)),
                h('a', { class: 'btn', href: skyscannerLink(cityOf(meId), d.code, plan.period), target: '_blank', rel: 'noopener' }, '✈️'));
            })) : null,
          h('p', { class: 'muted small' }, 'Dates are a starting point: change them on Skyscanner. Flights open in a new tab.'));
      }

      api.load(KEY).then((v) => { if (v) plan = { ...plan, ...v }; draw(); });
      api.onRemote((v) => { plan = { ...plan, ...v }; draw(); }, KEY);
      draw();
      return root;
    },
  },
};
