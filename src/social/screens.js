// LOGIN, HOUSE PICKER and ONBOARDING screens (owned by Social).
import { tagline, loadingLine } from './fun.js';

// Turns technical errors (from Supabase or the browser) into short, friendly sentences.
export function friendly(message = '') {
  const m = String(message).toLowerCase();
  if (m.includes('invalid login')) return 'Wrong username or password.';
  if (m.includes('already registered') || m.includes('already been registered') || m.includes('duplicate key') || m.includes('username is taken')) return 'That username is taken. Pick another one, or log in if it is yours.';
  if (m.includes('at least 6')) return 'Password needs at least 6 characters.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Too many tries. Wait a minute and try again.';
  if (m.includes('failed to fetch') || m.includes('network')) return 'No connection. Check your internet and try again.';
  if (m.includes('no house found')) return 'No house found with that code. Check it with the person who invited you (codes are 6 letters or numbers).';
  return message;
}

// The landing page + login. Looks like a small website: what AURA is, what you can do,
// how it works, the ways to join, and the login form. Styles are injected below because
// this folder can't edit src/styles.css.
const FEATURES = [
  ['🏠', 'Build your home', 'Place furniture, add rooms and pick a vibe. AI can even invent a room from one sentence.'],
  ['🧑‍🤝‍🧑', 'Hang out live, or later', 'See each other walk around, chat and wave. Or visit when nobody is home and leave a note.'],
  ['🎲', 'Play together', 'Connect Four, Tic-Tac-Toe and Draw & Guess, live or turn by turn.'],
  ['📸', 'Keep memories', 'A gallery, shared calendar with countdowns, and a gift wish list with secret claiming.'],
  ['🌍', 'Plan and explore', 'Weather in each of your cities, movie night, a travel planner and link boards.'],
  ['📱', 'Made for phones', 'Tap to walk and build. Works in any browser, nothing to install.'],
];
const STEPS = [
  ['1', 'Make an account', 'Just a username and a password. No email needed.'],
  ['2', 'Create or join a house', 'Pick Love Nest, Friends Crib, Family Home or Solo Studio, or enter an invite code.'],
  ['3', 'Invite your people', 'Share a link. Housemates can build, guests can visit, chat and play.'],
];
const WAYS = [
  ['🔑', 'Username + password', 'Create an account in ten seconds. Your houses follow you to any device.'],
  ['💌', 'Invite link', 'Got a link from a friend? Open it, make an account, and you are in their house automatically.'],
  ['🧪', 'Demo mode', 'Just looking? Try it with no account. Everything stays in your browser.'],
];

function injectLandingStyles() {
  if (document.getElementById('aura-landing-css')) return;
  const st = document.createElement('style');
  st.id = 'aura-landing-css';
  st.textContent = `
  .al { max-width: 1040px; margin: 0 auto; padding: calc(env(safe-area-inset-top) + 20px) 18px 48px; color: var(--ink); }
  .al h1 { font-size: clamp(2.6rem, 8vw, 4.2rem); margin: .1em 0; letter-spacing: -.02em; }
  .al h2 { font-size: 1.5rem; margin: 2.2rem 0 .8rem; text-align: center; }
  .al .al-top { display: grid; gap: 22px; align-items: center; }
  .al .al-hero { text-align: center; }
  .al .al-logo { font-size: 3.6rem; }
  .al .al-tag { font-size: 1.15rem; color: var(--ink-2); min-height: 2.8em; transition: opacity .3s; }
  .al .al-lead { max-width: 34em; margin: .4em auto 1em; line-height: 1.5; }
  .al .al-cta { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
  .al .al-form { margin: 0; }
  .al .al-grid { display: grid; gap: 12px; grid-template-columns: 1fr; }
  .al .al-card { background: var(--card); border-radius: var(--radius); padding: 16px; box-shadow: 0 4px 16px rgba(43,35,80,.08); text-align: left; }
  .al .al-card .big { font-size: 1.8rem; }
  .al .al-card b { display: block; margin: .2em 0; }
  .al .al-card p { margin: 0; color: var(--ink-2); font-size: .95rem; line-height: 1.4; }
  .al .al-step { display: flex; gap: 12px; align-items: flex-start; }
  .al .al-num { flex: none; width: 2rem; height: 2rem; border-radius: 50%; background: var(--accent); color: #fff; display: grid; place-items: center; font-weight: 700; }
  .al .al-foot { text-align: center; margin-top: 2.4rem; color: var(--ink-2); font-size: .9rem; }
  @media (min-width: 860px) {
    .al .al-top { grid-template-columns: 1.15fr .85fr; }
    .al .al-hero { text-align: left; }
    .al .al-lead { margin-left: 0; }
    .al .al-cta { justify-content: flex-start; }
    .al .al-grid.f { grid-template-columns: repeat(3, 1fr); }
    .al .al-grid.s, .al .al-grid.w { grid-template-columns: repeat(3, 1fr); }
  }
  @media (min-width: 560px) and (max-width: 859px) { .al .al-grid.f { grid-template-columns: repeat(2, 1fr); } }
  `;
  document.head.appendChild(st);
}

export function loginScreen(ctx, { onDone, invited = false }) {
  const { ui, backend } = ctx; const { h } = ui;
  injectLandingStyles();
  const user = h('input', { placeholder: 'Username', autocomplete: 'username', maxlength: 20 });
  const pass = h('input', { placeholder: 'Password', type: 'password', autocomplete: 'current-password' });
  const err = h('p', { class: 'error' });
  const go = (fn) => async () => {
    err.textContent = '';
    err.className = 'muted'; err.textContent = loadingLine(); // a silly line while we wait
    try { onDone(await fn(user.value, pass.value)); } catch (e) { err.className = 'error'; err.textContent = friendly(e.message); }
  };
  const form = h('div', { class: 'card form al-form', id: 'al-form' },
    h('h3', { style: { margin: '0 0 .4em' } }, invited ? 'Join the house' : 'Come on in'),
    user, pass, err,
    h('div', { class: 'row-btns' },
      h('button', { class: 'primary', onclick: go((u, p) => backend.signIn(u, p)) }, 'Log in'),
      h('button', { onclick: go((u, p) => backend.signUp(u, p)) }, 'Create account')),
    backend.mode === 'demo' ? h('p', { class: 'muted small' }, 'Demo mode: accounts live in this browser only. Open a second tab with another account to play together.') : null);

  // the tagline changes every few seconds
  const tag = h('p', { class: 'al-tag' }, tagline());
  const timer = setInterval(() => {
    if (!tag.isConnected) return clearInterval(timer);
    tag.style.opacity = 0;
    setTimeout(() => { tag.textContent = tagline(); tag.style.opacity = 1; }, 300);
  }, 4500);

  const card = ([icon, title, text]) => h('div', { class: 'al-card' }, h('span', { class: 'big' }, icon), h('b', {}, title), h('p', {}, text));
  const step = ([n, title, text]) => h('div', { class: 'al-card al-step' }, h('span', { class: 'al-num' }, n), h('div', {}, h('b', {}, title), h('p', {}, text)));

  ui.screen(h('div', { class: 'al' },
    invited ? h('p', { class: 'card', style: { textAlign: 'center' } }, '💌 You have been invited to a house! Create an account (or log in) and you will join it automatically.') : null,
    h('div', { class: 'al-top' },
      h('div', { class: 'al-hero' },
        h('div', { class: 'al-logo' }, '🏠'),
        h('h1', {}, 'AURA'),
        tag,
        h('p', { class: 'al-lead' }, 'A cozy low-poly world where you build a shared house with your partner, friends or family, then hang out, play games and keep memories together. Live, or at different times.'),
        h('div', { class: 'al-cta' },
          h('button', { class: 'primary', onclick: () => form.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, 'Get started'),
          backend.mode === 'demo' ? null : h('a', { class: 'link', href: '?demo=1' }, 'Just looking? Try the demo'))),
      form),
    h('h2', {}, 'What can you do?'),
    h('div', { class: 'al-grid f' }, ...FEATURES.map(card)),
    h('h2', {}, 'How it works'),
    h('div', { class: 'al-grid s' }, ...STEPS.map(step)),
    h('h2', {}, 'Ways to join'),
    h('div', { class: 'al-grid w' }, ...WAYS.map(card)),
    h('p', { class: 'al-foot' }, 'Free, friendly and non-commercial. Made with 💛 by the AURA team.')));
}

export function housePicker(ctx, { me, houses, onOpen, onCreate, onJoin, onLogout, onFriends, joinCode = '' }) {
  const { ui } = ctx; const { h } = ui;
  const code = h('input', { placeholder: 'Invite code, e.g. K7Q2XD', value: joinCode, maxlength: 12, style: { textTransform: 'uppercase' } });
  const err = h('p', { class: 'error' });
  ui.screen(h('div', { class: 'screen' },
    h('div', { class: 'screen-head' }, h('h2', {}, `Hi ${me.username} 👋`), h('button', { class: 'link', onclick: onLogout }, 'Log out')),
    houses.length ? h('div', { class: 'list' }, ...houses.map((house) => h('button', { class: 'house-card', onclick: () => onOpen(house) },
      h('span', { class: 'big' }, { love: '💞', friends: '🛋️', family: '🏡', solo: '🎨' }[house.type] || '🏠'),
      h('span', {}, h('b', {}, house.name), h('small', {}, `${house.rooms?.length || 0} rooms · you are ${house.members?.[me.id]?.role || 'member'}`)))))
      : h('p', { class: 'muted' }, "You don't have a house yet. Create one, or join a friend's with their code."),
    h('div', { class: 'card' }, h('button', { class: 'primary wide', onclick: onCreate }, '＋ Create a new house')),
    onFriends ? h('div', { class: 'card' }, h('button', { class: 'wide', onclick: onFriends }, '🤝 Friends')) : null,
    h('div', { class: 'card form' }, h('h4', {}, 'Join a house'), code, err,
      h('button', { class: 'wide', onclick: async () => { err.textContent = ''; try { await onJoin(code.value); } catch (e) { err.textContent = friendly(e.message); } } }, 'Join'))));
}

export function onboarding(ctx, { me, onDone, onCancel }) {
  const { ui } = ctx; const { h } = ui;
  const types = ctx.use('build.houseTypes')();
  const vibes = ctx.use('build.vibes')();
  const answers = { type: null, name: '', vibe: 'cozy', cities: [] };
  let step = 0;
  const wrap = h('div', { class: 'screen center' });
  const defaultName = { love: `Our Love Nest`, friends: `The Crib`, family: `Family Home`, solo: `${me.username}'s Studio` };

  function render() {
    const steps = [
      () => h('div', {},
        h('h2', {}, 'Who is this house for?'),
        h('div', { class: 'choice-grid' }, ...Object.entries(types).map(([k, t]) =>
          h('button', { class: 'choice' + (answers.type === k ? ' active' : ''), onclick: () => { answers.type = k; answers.name = defaultName[k]; step++; render(); } },
            h('span', { class: 'big' }, t.emoji), h('b', {}, t.label), h('small', {}, t.blurb))))),
      () => {
        const name = h('input', { value: answers.name, maxlength: 30 });
        return h('div', { class: 'card form' }, h('h2', {}, 'Name your house'), name,
          h('button', { class: 'primary', onclick: () => { answers.name = name.value.trim() || defaultName[answers.type]; step++; render(); } }, 'Next'));
      },
      () => h('div', {},
        h('h2', {}, 'Pick a vibe'),
        h('div', { class: 'choice-grid' }, ...Object.entries(vibes).map(([k, v]) =>
          h('button', { class: 'choice' + (answers.vibe === k ? ' active' : ''), onclick: () => { answers.vibe = k; step++; render(); } },
            h('span', { class: 'vibe-dots' }, ...[v.floor, v.wall, v.accent].map((c) => h('i', { style: { background: c } }))), h('b', {}, v.label))))),
      () => {
        const love = answers.type === 'love';
        const c1 = h('input', { placeholder: 'Your city, e.g. Lisbon' });
        const c2 = love ? h('input', { placeholder: "Your partner's city, e.g. São Paulo" }) : null;
        return h('div', { class: 'card form' }, h('h2', {}, love ? 'Where do you each live?' : 'Where do you live?'),
          h('p', { class: 'muted' }, 'Optional. Used for the weather window and the clocks. You can skip it.'), c1, c2,
          h('button', { class: 'primary', onclick: () => { answers.cities = [c1.value, c2?.value].map((x) => (x || '').trim()).filter(Boolean); onDone(answers); } }, `Build ${answers.name} ✨`));
      },
    ];
    wrap.replaceChildren(
      h('div', { class: 'steps' }, ...[0, 1, 2, 3].map((i) => h('i', { class: i <= step ? 'on' : '' }))),
      steps[step](),
      h('button', { class: 'link', onclick: () => (step ? (step--, render()) : onCancel()) }, step ? '← Back' : 'Cancel'));
  }
  render();
  ui.screen(wrap);
}
