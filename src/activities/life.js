// REAL-LIFE ACTIVITIES (owned by Activities): things that connect the game to life outside it.
// gallery, calendar, wishlist, weather, movies, travel, links, notes, portal, chat, invite, nudge
import './gallery.css';

// replaceChildren that skips null/false (so conditional children don't print "null")
const fill = (el, ...kids) => el.replaceChildren(...kids.flat().filter((k) => k != null && k !== false));
const newId = () => Math.random().toString(36).slice(2, 9);
const daysUntil = (date) => Math.ceil((new Date(date + 'T00:00:00') - new Date(new Date().toDateString())) / 864e5);
const safeUrl = (u) => (/^https?:\/\//i.test(u || '') ? u : null);

/** Small helper: a list stored in shared state, re-rendered on any change. */
function sharedList(api, render) {
  let list = [];
  const root = api.h('div', {});
  const update = async (fn) => { list = fn([...list]); draw(); await api.save(list); };
  const draw = () => fill(root, render(list, update));
  api.load().then((v) => { list = v || []; draw(); });
  api.onRemote((v) => { list = v || []; draw(); });
  draw();
  return root;
}

/** Downscale an image file to a small JPEG data URL. */
function shrink(file, max = 900) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = img.width * s; c.height = img.height * s;
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/jpeg', 0.75));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

const WMO = { 0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️', 51: '🌦️', 53: '🌦️', 55: '🌧️', 61: '🌧️', 63: '🌧️', 65: '🌧️', 71: '🌨️', 73: '🌨️', 75: '❄️', 80: '🌦️', 81: '🌧️', 82: '⛈️', 95: '⛈️', 96: '⛈️', 99: '⛈️' };

export const LIFE = {
  gallery: {
    title: 'Memory gallery', icon: '🖼️', wide: true,
    // Day 2: every photo has a caption and the date it HAPPENED (not the upload day).
    // Photos are grouped by month, tap one to see it big and edit or delete it,
    // and an "On this day" card brings back memories from the same date in past years.
    // Photos are still small JPEGs saved in the house state (max 30) until Storage is ready.
    open: (api) => {
      const { h } = api;
      let photos = [];
      let draft = null;   // a photo picked but not added yet: { src }
      let viewing = null; // id of the photo shown big
      let editing = false;
      const root = h('div', {});
      const draw = () => fill(root, draft ? draftForm() : viewing ? bigView() : grid());
      const update = async (fn) => { photos = fn([...photos]); draw(); await api.save(photos); };
      api.load().then((v) => { photos = v || []; draw(); });
      api.onRemote((v) => { photos = v || []; draw(); });

      const MAX = 30;
      const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
      const dayOf = (p) => p.date || new Date(p.at).toLocaleDateString('en-CA'); // old photos have no date
      const pretty = (d) => new Date(d + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
      const monthName = (d) => new Date(d + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      const canChange = (p) => p.by === api.me.id || api.canEdit;
      const sorted = () => [...photos].sort((a, b) => dayOf(b).localeCompare(dayOf(a)) || b.at - a.at);
      const captionInput = (value = '') => h('input', { placeholder: 'Caption, e.g. Our first trip to Porto', maxlength: 120, value });
      const dateInput = (value) => h('input', { type: 'date', value, max: today() });

      const file = h('input', { type: 'file', accept: 'image/*', style: { display: 'none' }, onchange: async () => {
        const f = file.files[0]; file.value = ''; if (!f) return;
        try { draft = { src: await shrink(f) }; draw(); } catch { api.toast("That photo couldn't be opened"); }
      } });

      // Step 2 of adding: the picked photo with a caption and "when was this?"
      function draftForm() {
        const caption = captionInput();
        const date = dateInput(today());
        return h('div', { class: 'card form mg-form' },
          h('img', { src: draft.src, class: 'mg-preview' }),
          h('label', { class: 'field' }, h('span', {}, 'Caption'), caption),
          h('label', { class: 'field' }, h('span', {}, 'When was this?'), date),
          h('div', { class: 'row-btns' },
            h('button', { onclick: () => { draft = null; draw(); } }, 'Cancel'),
            h('button', { class: 'primary', onclick: () => {
              const p = { id: newId(), src: draft.src, caption: caption.value.trim(), date: date.value || today(), by: api.me.id, at: Date.now() };
              draft = null;
              // keep the newest 30 uploads (photos live in the shared state for now)
              update((l) => [...l, p].sort((a, b) => a.at - b.at).slice(-MAX));
              api.award(5, 'shared a memory');
            } }, 'Add memory')));
      }

      // One photo, big, with its story and Edit / Delete
      function bigView() {
        const p = photos.find((x) => x.id === viewing);
        if (!p) { viewing = null; editing = false; return grid(); } // deleted by someone else
        const back = h('button', { onclick: () => { viewing = null; editing = false; draw(); } }, '← All memories');
        if (editing) {
          const caption = captionInput(p.caption || '');
          const date = dateInput(dayOf(p));
          return h('div', {}, back, h('div', { class: 'card form mg-form' },
            h('img', { src: p.src, class: 'mg-preview' }),
            h('label', { class: 'field' }, h('span', {}, 'Caption'), caption),
            h('label', { class: 'field' }, h('span', {}, 'When was this?'), date),
            h('div', { class: 'row-btns' },
              h('button', { onclick: () => { editing = false; draw(); } }, 'Cancel'),
              h('button', { class: 'primary', onclick: () => { editing = false; update((l) => l.map((x) => (x.id === p.id ? { ...x, caption: caption.value.trim(), date: date.value || dayOf(x) } : x))); } }, 'Save'))));
        }
        return h('div', {}, back,
          h('figure', { class: 'mg-big' },
            h('img', { src: p.src }),
            h('figcaption', {}, p.caption ? h('h3', {}, p.caption) : null,
              h('div', { class: 'muted' }, `📅 ${pretty(dayOf(p))} · added by ${api.nameOf(p.by)}`))),
          canChange(p) ? h('div', { class: 'row-btns' },
            h('button', { onclick: () => { editing = true; draw(); } }, '✏️ Edit'),
            h('button', { onclick: async () => {
              if (!(await api.ctx.ui.confirm('Delete this memory?', 'It disappears for everyone in the house.', 'Delete'))) return;
              viewing = null; update((l) => l.filter((x) => x.id !== p.id));
            } }, '🗑 Delete')) : null);
      }

      // A small square that opens the big view
      const tile = (p) => h('figure', { class: 'mg-tile', role: 'button', tabindex: 0, onclick: () => { viewing = p.id; draw(); } },
        h('img', { src: p.src, loading: 'lazy' }),
        h('figcaption', {}, p.caption || '', h('small', {}, pretty(dayOf(p)))));

      // All photos, newest memory first, one heading per month
      function grid() {
        const list = sorted();
        const t = today();
        const onThisDay = list.filter((p) => dayOf(p).slice(5) === t.slice(5) && dayOf(p) < t);
        const months = [];
        for (const p of list) {
          const m = dayOf(p).slice(0, 7);
          if (months[months.length - 1]?.m !== m) months.push({ m, items: [] });
          months[months.length - 1].items.push(p);
        }
        return h('div', {},
          h('div', { class: 'row-btns' }, file,
            h('button', { class: 'primary', onclick: () => file.click() }, '📷 Add a memory'),
            photos.length ? h('span', { class: 'muted small mg-count' }, `${photos.length} of ${MAX} photos`) : null),
          onThisDay.length ? h('div', { class: 'card mg-otd' },
            h('h4', {}, '✨ On this day'),
            ...onThisDay.map((p) => {
              const years = Number(t.slice(0, 4)) - Number(dayOf(p).slice(0, 4));
              return h('div', { class: 'row', role: 'button', onclick: () => { viewing = p.id; draw(); } },
                h('img', { src: p.src, class: 'thumb' }),
                h('span', { class: 'row-main' }, p.caption || 'A memory', h('small', {}, `${years} year${years === 1 ? '' : 's'} ago today`)));
            })) : null,
          ...months.map(({ m, items }) => h('section', {},
            h('h4', { class: 'mg-month' }, monthName(m + '-01')),
            h('div', { class: 'gallery' }, ...items.map(tile)))),
          !photos.length ? h('p', { class: 'muted' }, 'No memories yet. Add your first photo together!') : null);
      }

      draw();
      return root;
    },
  },

  calendar: {
    title: 'Calendar + countdown', icon: '📅',
    open: (api) => sharedList(api, (events, update) => {
      const { h } = api;
      const upcoming = events.filter((e) => daysUntil(e.date) >= 0).sort((a, b) => a.date.localeCompare(b.date));
      const meetup = upcoming.find((e) => e.big);
      const title = h('input', { placeholder: 'What? e.g. Next visit, Anniversary, Game night' });
      const date = h('input', { type: 'date' });
      const big = h('input', { type: 'checkbox' });
      return h('div', {},
        meetup ? h('div', { class: 'countdown' }, h('div', { class: 'big-num' }, daysUntil(meetup.date)), h('div', {}, `days until ${meetup.title}`)) : null,
        h('div', { class: 'list' }, ...upcoming.map((e) => h('div', { class: 'row' },
          h('span', { class: 'row-main' }, (e.big ? '⭐ ' : '') + e.title, h('small', {}, `${e.date} · in ${daysUntil(e.date)} days`)),
          h('button', { class: 'icon-btn', onclick: () => update((l) => l.filter((x) => x.id !== e.id)) }, '🗑')))),
        !upcoming.length ? h('p', { class: 'muted' }, 'Nothing planned yet.') : null,
        h('div', { class: 'card form' }, title, date, h('label', {}, big, ' Big countdown (e.g. next time we meet)'),
          h('button', { class: 'primary', onclick: () => { if (!title.value || !date.value) return api.toast('Add a title and a date'); update((l) => [...l, { id: newId(), title: title.value.trim(), date: date.value, big: big.checked, by: api.me.id }]); api.award(3, 'planned something'); } }, 'Add')));
    }),
  },

  wishlist: {
    title: 'Gift wish list', icon: '🎁',
    open: (api) => sharedList(api, (items, update) => {
      const { h, me } = api;
      const title = h('input', { placeholder: 'What would you love? e.g. Polaroid camera' });
      const url = h('input', { placeholder: 'Link (optional) https://…' });
      const add = async () => {
        if (!title.value.trim()) return api.toast('Add what you wish for');
        const link = safeUrl(url.value.trim());
        const preview = link ? await api.linkPreview(link).catch(() => null) : null;
        update((l) => [...l, { id: newId(), title: title.value.trim(), url: link, image: preview?.image || null, owner: me.id, claimedBy: null }]);
      };
      const byOwner = {};
      for (const it of items) (byOwner[it.owner] ||= []).push(it);
      return h('div', {},
        ...Object.entries(byOwner).map(([owner, list]) => h('div', { class: 'card' }, h('h4', {}, owner === me.id ? 'My wishes' : `${api.nameOf(owner)}'s wishes`),
          ...list.map((it) => h('div', { class: 'row wish' },
            it.image ? h('img', { src: it.image, class: 'thumb' }) : h('span', { class: 'thumb' }, '🎁'),
            h('span', { class: 'row-main' }, it.url ? h('a', { href: it.url, target: '_blank', rel: 'noopener' }, it.title) : it.title,
              // the owner never sees if a gift was claimed: surprises stay surprises
              owner !== me.id && it.claimedBy ? h('small', {}, it.claimedBy === me.id ? 'You are getting this' : `${api.nameOf(it.claimedBy)} is getting this`) : null),
            owner === me.id ? h('button', { class: 'icon-btn', onclick: () => update((l) => l.filter((x) => x.id !== it.id)) }, '🗑')
              : !it.claimedBy ? h('button', { onclick: () => { update((l) => l.map((x) => (x.id === it.id ? { ...x, claimedBy: me.id } : x))); api.award(5, 'planned a gift'); } }, "I'll get it")
              : it.claimedBy === me.id ? h('button', { onclick: () => update((l) => l.map((x) => (x.id === it.id ? { ...x, claimedBy: null } : x))) }, 'Undo') : null)))),
        !items.length ? h('p', { class: 'muted' }, 'Add things you would love. Others can secretly claim them as gifts.') : null,
        h('div', { class: 'card form' }, title, url, h('button', { class: 'primary', onclick: add }, 'Add to my wishes')));
    }),
  },

  weather: {
    title: 'Weather where you are', icon: '🌦️',
    open: (api) => {
      const { h } = api;
      const root = h('div', {}, h('p', { class: 'muted' }, 'Loading weather…'));
      const cities = api.house.cities?.length ? api.house.cities : [];
      async function one(city) {
        const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`).then((r) => r.json());
        const p = geo.results?.[0]; if (!p) return h('div', { class: 'card' }, `${city}: not found`);
        const w = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.latitude}&longitude=${p.longitude}&current=temperature_2m,weather_code&timezone=auto`).then((r) => r.json());
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: p.timezone });
        return h('div', { class: 'card weather' }, h('div', { class: 'big' }, WMO[w.current?.weather_code] || '🌡️'),
          h('div', {}, h('b', {}, `${p.name}, ${p.country_code}`), h('div', {}, `${Math.round(w.current?.temperature_2m)}°C · local time ${time}`)));
      }
      async function load(list) {
        if (!list.length) { fill(root, h('p', { class: 'muted' }, 'No cities set for this house yet.'), form()); return; }
        try { fill(root, ...(await Promise.all(list.map(one))), form(), h('p', { class: 'muted small' }, 'Weather data by Open-Meteo.com (CC BY 4.0)')); }
        catch { fill(root, h('p', { class: 'error' }, "Couldn't reach the weather service from here."), form()); }
      }
      function form() {
        const input = h('input', { placeholder: 'Add a city, e.g. Tokyo' });
        return h('div', { class: 'chat-input' }, input, h('button', { onclick: async () => {
          const c = input.value.trim(); if (!c) return;
          const house = { ...api.house, cities: [...(api.house.cities || []), c].slice(-4) };
          api.house = house; await api.ctx.use('house.save')(house); load(house.cities);
        } }, 'Add'));
      }
      load(cities);
      return root;
    },
  },

  movies: {
    title: 'Movie night', icon: '🍿',
    open: (api) => sharedList(api, (list, update) => {
      const { h } = api;
      const title = h('input', { placeholder: 'Add a movie or show to watch together' });
      const unwatched = list.filter((m) => !m.watched);
      return h('div', {},
        h('div', { class: 'row-btns' },
          h('button', { class: 'primary', onclick: () => { if (!unwatched.length) return api.toast('Add some movies first'); const pick = unwatched[Math.floor(Math.random() * unwatched.length)]; api.toast(`🎬 Tonight: ${pick.title}`); api.ctx.use('chat.send')(`🎬 Movie night pick: ${pick.title}`); } }, '🎲 Pick for us'),
          h('a', { class: 'btn', href: 'https://www.youtube.com/', target: '_blank', rel: 'noopener' }, '▶ Open YouTube')),
        h('div', { class: 'list' }, ...list.map((m) => h('div', { class: 'row' },
          h('span', { class: 'row-main' + (m.watched ? ' done' : '') }, m.title, h('small', {}, `added by ${api.nameOf(m.by)}`)),
          h('button', { onclick: () => update((l) => l.map((x) => (x.id === m.id ? { ...x, watched: !x.watched } : x))) }, m.watched ? 'Unwatch' : '✓ Watched'),
          h('button', { class: 'icon-btn', onclick: () => update((l) => l.filter((x) => x.id !== m.id)) }, '🗑')))),
        h('div', { class: 'chat-input' }, title, h('button', { onclick: () => { if (title.value.trim()) update((l) => [...l, { id: newId(), title: title.value.trim(), by: api.me.id, watched: false }]); } }, 'Add')),
        h('p', { class: 'muted small' }, 'Tip: start a watch party on your favourite service and paste the link in the house chat.'));
    }),
  },

  travel: {
    title: 'Travel planner', icon: '🌍',
    open: (api) => {
      const { h } = api;
      const root = h('div', {});
      let plan = { from: '', to: '', depart: '', ret: '', checklist: [] };
      const smart = (p) => {
        const q = encodeURIComponent;
        return [
          ['✈️ Google Flights', `https://www.google.com/travel/flights?q=${q(`Flights from ${p.from} to ${p.to} on ${p.depart}${p.ret ? ` returning ${p.ret}` : ''}`)}`],
          ['🏨 Booking.com', `https://www.booking.com/searchresults.html?ss=${q(p.to)}${p.depart ? `&checkin=${p.depart}` : ''}${p.ret ? `&checkout=${p.ret}` : ''}`],
          ['🏠 Airbnb', `https://www.airbnb.com/s/${q(p.to)}/homes${p.depart ? `?checkin=${p.depart}&checkout=${p.ret || ''}` : ''}`],
          ['🔎 Skyscanner', 'https://www.skyscanner.net/'],
          ['🗺️ Google Maps', `https://www.google.com/maps/search/${q(p.to)}`],
        ];
      };
      const draw = () => {
        const f = {}; for (const k of ['from', 'to', 'depart', 'ret']) f[k] = h('input', { value: plan[k] || '', type: k === 'depart' || k === 'ret' ? 'date' : 'text', placeholder: { from: 'From (city)', to: 'To (city)' }[k] });
        const item = h('input', { placeholder: 'Packing or to-do item' });
        fill(root, 
          h('button', { class: 'primary wide', onclick: () => api.open('trip', { key: 'house:trip-planner' }) }, '✨ Where should we go next? (ideas + Skyscanner)'),
          h('div', { class: 'card form' }, h('div', { class: 'grid2' }, f.from, f.to, f.depart, f.ret),
            h('button', { class: 'primary', onclick: () => { for (const k in f) plan[k] = f[k].value; api.save(plan); draw(); api.award(3, 'planned a trip'); } }, 'Save trip')),
          plan.to ? h('div', { class: 'card' }, h('h4', {}, `Trip to ${plan.to}`), plan.depart ? h('p', {}, `⏳ ${daysUntil(plan.depart)} days to go`) : null,
            h('div', { class: 'row-btns' }, ...smart(plan).map(([l, u]) => h('a', { class: 'btn', href: u, target: '_blank', rel: 'noopener' }, l)))) : null,
          h('div', { class: 'card' }, h('h4', {}, 'Checklist'),
            ...plan.checklist.map((c, i) => h('label', { class: 'check' + (c.done ? ' done' : '') }, h('input', { type: 'checkbox', checked: c.done, onchange: () => { plan.checklist[i].done = !c.done; api.save(plan); draw(); } }), c.text)),
            h('div', { class: 'chat-input' }, item, h('button', { onclick: () => { if (!item.value.trim()) return; plan.checklist.push({ text: item.value.trim(), done: false }); api.save(plan); draw(); } }, 'Add'))));
      };
      api.load().then((v) => { if (v) plan = { checklist: [], ...v }; draw(); });
      api.onRemote((v) => { plan = { checklist: [], ...v }; draw(); });
      draw();
      return root;
    },
  },

  links: {
    title: 'Link board', icon: '📌',
    open: (api) => sharedList(api, (links, update) => {
      const { h } = api;
      const title = h('input', { placeholder: 'Title, e.g. Our playlist' });
      const url = h('input', { placeholder: 'https://…' });
      return h('div', {},
        h('div', { class: 'list' }, ...links.map((l) => h('div', { class: 'row' },
          l.image ? h('img', { src: l.image, class: 'thumb' }) : h('span', { class: 'thumb' }, '🔗'),
          h('a', { class: 'row-main', href: l.url, target: '_blank', rel: 'noopener' }, l.title, h('small', {}, new URL(l.url).hostname)),
          h('button', { class: 'icon-btn', onclick: () => update((x) => x.filter((y) => y.id !== l.id)) }, '🗑')))),
        !links.length ? h('p', { class: 'muted' }, 'Pin useful links: playlists, booking pages, games you play together…') : null,
        h('div', { class: 'card form' }, title, url, h('button', { class: 'primary', onclick: async () => {
          const u = safeUrl(url.value.trim()); if (!u) return api.toast('Add a link starting with https://');
          const prev = await api.linkPreview(u).catch(() => null);
          update((x) => [...x, { id: newId(), title: title.value.trim() || prev?.title || u, url: u, image: prev?.image || null }]);
        } }, 'Pin link')));
    }),
  },

  notes: {
    title: 'Notes + checklist', icon: '📝',
    open: (api) => sharedList(api, (notes, update) => {
      const { h } = api;
      const input = h('input', { placeholder: 'Add a note or to-do…', onkeydown: (e) => { if (e.key === 'Enter') add(); } });
      const add = () => { if (input.value.trim()) update((l) => [...l, { id: newId(), text: input.value.trim(), done: false, by: api.me.id }]); };
      return h('div', {},
        ...notes.map((n) => h('div', { class: 'row' },
          h('label', { class: 'check row-main' + (n.done ? ' done' : '') }, h('input', { type: 'checkbox', checked: n.done, onchange: () => update((l) => l.map((x) => (x.id === n.id ? { ...x, done: !x.done } : x))) }), n.text, h('small', {}, ` · ${api.nameOf(n.by)}`)),
          h('button', { class: 'icon-btn', onclick: () => update((l) => l.filter((x) => x.id !== n.id)) }, '🗑'))),
        h('div', { class: 'chat-input' }, input, h('button', { class: 'primary', onclick: add }, 'Add')));
    }),
  },

  portal: {
    title: 'Portal', icon: '🌀',
    open: (api) => {
      const { h } = api;
      const url = safeUrl(api.item?.data?.url);
      if (url) return h('div', {}, h('p', {}, `This portal goes to: ${new URL(url).hostname}`), h('a', { class: 'btn primary', href: url, target: '_blank', rel: 'noopener', onclick: () => api.award(2, 'used a portal') }, '🌀 Go through the portal'));
      return h('div', {}, h('p', { class: 'muted' }, 'This portal has no link yet.'),
        api.canEdit ? h('p', {}, 'Open 🛠️ Build, tap this object, then "🔗 Link" to connect it to a watch party, a game, a playlist or a booking page.') : h('p', {}, 'Ask a housemate to connect it.'));
    },
  },

  chat: { title: 'Chat', icon: '💬', open: (api) => { api.ctx.use('chat.open')(); return null; } },
  invite: { title: 'Invite', icon: '✉️', open: (api) => { api.ctx.use('social.openPeople')(); return null; } },
  nudge: {
    title: 'Mailbox', icon: '💌',
    open: (api) => {
      const { h } = api;
      const love = api.house.type === 'love';
      return h('div', {}, h('p', {}, love ? 'Let them know you are thinking of them. They get it in the house chat.' : 'Send a quick wave to everyone in the house.'),
        h('button', { class: 'primary wide', onclick: () => { api.ctx.use('chat.nudge')(); api.close(); } }, love ? '💌 Send "thinking of you"' : '👋 Send a wave'));
    },
  },
};
