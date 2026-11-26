// VIDEO CALL (owned by Activities): "📞 Call" your partner (or anyone in the house)
// with FaceTime or Google Meet. We never run the call ourselves: we just open the right app.
//
// - FaceTime (iPhone, iPad, Mac only): you type your partner's FaceTime phone number or
//   email ONCE. It is kept only on THIS device (localStorage), never sent to the server.
//   The button opens facetime://... and the Apple app does the rest.
// - Google Meet (works everywhere): "Start a Meet" opens meet.google.com/new in a new tab.
//   You copy the link Google gives you and paste it here: we save it in the house state
//   (key 'house:video-call') so everyone in the house sees a big "Join" button, get a toast,
//   and (optional) we also post it in the house chat.
// Works in demo mode too (house state syncs between tabs).

export const CALL_KEY = 'house:video-call';
const FRESH_MS = 3 * 60 * 60 * 1000; // a shared Meet link counts as "live" for 3 hours

const fill = (el, ...kids) => el.replaceChildren(...kids.flat().filter((k) => k != null && k !== false));
const isApple = () => /iPhone|iPad|iPod|Macintosh|Mac OS X/i.test(navigator.userAgent || '');
// Only real Google Meet links are accepted (so nobody can share a strange link here)
const cleanMeet = (u) => {
  const m = String(u || '').trim().match(/^(https:\/\/)?meet\.google\.com\/[a-z0-9-]{3,}(\?[^\s]*)?$/i);
  return m ? (m[1] ? m[0] : 'https://' + m[0]) : null;
};
// A FaceTime contact = a phone number or an email address (cleaned, so it is safe to put in the link as is)
const cleanContact = (c) => {
  const s = String(c || '').trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return s;
  if (/^\+?[\d\s().-]{5,20}$/.test(s)) return s.replace(/[\s().-]/g, '');
  return null;
};
const ago = (at) => { const m = Math.round((Date.now() - at) / 60000); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`; };

// Device-only storage for FaceTime contacts (try/catch: private windows can block it)
const ftKey = (houseId, uid) => `ourplace:facetime:${houseId}:${uid}`;
const readFt = (houseId, uid) => { try { return localStorage.getItem(ftKey(houseId, uid)) || ''; } catch { return ''; } };
const writeFt = (houseId, uid, v) => { try { v ? localStorage.setItem(ftKey(houseId, uid), v) : localStorage.removeItem(ftKey(houseId, uid)); } catch {} };

export const CALL = {
  call: {
    title: 'Video call', icon: '📞',
    open: (api) => {
      const { h } = api;
      const houseId = api.house.id;
      const meId = api.me.id;
      let state = {};          // { meet: { url, by, at } }
      let pasting = false;     // showing the "paste your Meet link" box
      let editingFt = false;   // showing the "FaceTime contact" box
      const others = () => Object.keys(api.members).filter((u) => u !== meId);
      let who = others()[0] || null; // who we call (the partner in a Love Nest)

      const root = h('div', { class: 'call' });
      api.load().then((v) => { state = v || {}; draw(); });
      api.onRemote((v) => { state = v || {}; draw(); });

      function draw() {
        const people = others();
        if (!people.length) {
          return fill(root, h('p', {}, 'Nobody else lives here yet. Invite your partner first, then you can call them from here. 💌'));
        }
        if (!people.includes(who)) who = people[0];
        fill(root,
          people.length > 1 ? h('div', { class: 'row-btns' }, h('span', { class: 'muted' }, 'Call:'),
            ...people.map((u) => h('button', { class: 'chip' + (u === who ? ' active' : ''), onclick: () => { who = u; editingFt = false; draw(); } }, api.nameOf(u)))) : null,
          liveCard(),
          facetimeCard(),
          meetCard(),
          h('p', { class: 'muted call-note' }, 'The call happens in FaceTime or Google Meet, not inside OurPlace.'),
        );
      }

      // Somebody shared a Meet link in the last 3 hours: show a big Join button
      function liveCard() {
        const m = state.meet;
        if (!m || Date.now() - m.at > FRESH_MS) return null;
        const mine = m.by === meId;
        return h('div', { class: 'card call-live' },
          h('b', {}, mine ? '🟢 Your Google Meet is shared' : `🟢 ${api.nameOf(m.by)} is waiting in Google Meet`),
          h('small', { class: 'muted' }, ` (${ago(m.at)})`),
          h('div', { class: 'row-btns' },
            h('a', { class: 'btn primary', href: m.url, target: '_blank', rel: 'noopener' }, '🎥 Join the call'),
            h('button', { onclick: async () => { state = { ...state, meet: null }; draw(); await api.save(state); } }, '✖ End')));
      }

      function facetimeCard() {
        const saved = readFt(houseId, who);
        const name = api.nameOf(who);
        if (!isApple()) {
          return h('div', { class: 'card' }, h('b', {}, '🍎 FaceTime'),
            h('p', { class: 'muted' }, 'FaceTime only works on iPhone, iPad and Mac. Use Google Meet below instead.'));
        }
        if (!saved || editingFt) {
          const input = h('input', { placeholder: `${name}'s phone number or Apple ID email`, value: saved, inputmode: 'email', autocomplete: 'off' });
          return h('div', { class: 'card' }, h('b', {}, `🍎 FaceTime ${name}`),
            h('p', { class: 'muted' }, 'Saved only on this device, nobody else sees it.'),
            input,
            h('div', { class: 'row-btns' },
              h('button', { class: 'primary', onclick: () => {
                const c = cleanContact(input.value);
                if (!c) return api.toast('Type a phone number (like +39 333 1234567) or an email');
                writeFt(houseId, who, c); editingFt = false; draw();
              } }, 'Save'),
              saved ? h('button', { onclick: () => { editingFt = false; draw(); } }, 'Cancel') : null));
        }
        return h('div', { class: 'card' }, h('b', {}, `🍎 FaceTime ${name}`),
          h('div', { class: 'row-btns' },
            h('a', { class: 'btn primary', href: `facetime:${saved}`, onclick: () => api.award(2, 'video call') }, '📹 Video call'),
            h('a', { class: 'btn', href: `facetime-audio:${saved}` }, '📞 Audio only'),
            h('button', { class: 'small', onclick: () => { editingFt = true; draw(); } }, '✏️ Change'),
            h('button', { class: 'small', onclick: () => { writeFt(houseId, who, ''); draw(); } }, '🗑️ Forget')));
      }

      function meetCard() {
        if (pasting) {
          const input = h('input', { placeholder: 'meet.google.com/abc-defg-hij', inputmode: 'url', autocomplete: 'off' });
          let toChat = true;
          return h('div', { class: 'card' }, h('b', {}, '🎥 Share your Google Meet'),
            h('p', { class: 'muted' }, 'In the Meet tab, copy the link (it looks like meet.google.com/abc-defg-hij) and paste it here.'),
            input,
            h('label', { class: 'row' }, h('input', { type: 'checkbox', checked: true, onchange: (e) => { toChat = e.target.checked; } }), 'Also post it in the house chat'),
            h('div', { class: 'row-btns' },
              h('button', { class: 'primary', onclick: async () => {
                const url = cleanMeet(input.value);
                if (!url) return api.toast('That is not a Google Meet link');
                state = { ...state, meet: { url, by: meId, at: Date.now() } };
                pasting = false; draw();
                await api.save(state);
                if (toChat) { try { api.ctx.use('chat.send')(`📞 I started a video call, join me: ${url}`); } catch {} }
                api.toast(`Shared! ${api.nameOf(who)} will see a Join button`);
                api.award(2, 'video call');
              } }, 'Share the link'),
              h('button', { onclick: () => { pasting = false; draw(); } }, 'Cancel')));
        }
        return h('div', { class: 'card' }, h('b', {}, '🎥 Google Meet'),
          h('p', { class: 'muted' }, 'Works on every phone and computer (you need a Google account to start one).'),
          h('div', { class: 'row-btns' },
            h('a', { class: 'btn primary', href: 'https://meet.google.com/new', target: '_blank', rel: 'noopener', onclick: () => { pasting = true; setTimeout(draw, 300); } }, '1. Start a Meet'),
            h('button', { onclick: () => { pasting = true; draw(); } }, '2. Paste the link')));
      }

      draw();
      return root;
    },
  },
};
