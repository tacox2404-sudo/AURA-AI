// LOGIN, HOUSE PICKER and ONBOARDING screens (owned by Social).
import { tagline, loadingLine } from './fun.js';

// ---- remembering the player on this device ----
const LAST_USER = 'op:lastUser';
const safeGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const safeSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } };
/** True when OurPlace was opened from the home screen (full-screen app mode). */
export const isStandalone = () => { try { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch { return false; } };
// the last few people who logged in on this device (usernames only, never passwords): tap one to log in fast
const RECENT = 'op:recentUsers';
export function recentUsers() { try { return JSON.parse(safeGet(RECENT) || '[]').filter(Boolean).slice(0, 5); } catch { return []; } }
function pushRecent(name) { safeSet(RECENT, JSON.stringify([name, ...recentUsers().filter((n) => n.toLowerCase() !== name.toLowerCase())].slice(0, 5))); }
function forgetRecent(name) { safeSet(RECENT, JSON.stringify(recentUsers().filter((n) => n !== name))); }
/** Remember the username for "Welcome back", and let the browser's password manager save the login (Chrome/Android). */
function rememberLogin(username, password) {
  safeSet(LAST_USER, username.trim());
  pushRecent(username.trim());
  try {
    if (window.PasswordCredential && navigator.credentials?.store) {
      // the browser may refuse later (no password service, private window...): that must never be an error for the player
      Promise.resolve(navigator.credentials.store(new PasswordCredential({ id: username.trim(), password }))).catch(() => {});
    }
  } catch { /* not supported */ }
}

/** A small "add me to your home screen" card for phones (not shown inside the installed app). */
export function installTip(ctx, installEvent) {
  const { h } = ctx.ui;
  if (isStandalone() || safeGet('op:tip:install') === 'x') return null;
  const ua = navigator.userAgent || '';
  const ios = /iPhone|iPad|iPod/.test(ua), android = /Android/.test(ua);
  if (!ios && !android) return null;
  const card = h('div', { class: 'card al-install' });
  const close = () => { safeSet('op:tip:install', 'x'); card.remove(); };
  card.append(h('b', {}, '📲 Get the app feel'),
    h('p', { class: 'muted small', style: { margin: '.3em 0 .5em' } },
      ios ? 'In Safari, tap Share ⎙ then "Add to Home Screen". OurPlace opens full screen like an app, and stays logged in.'
        : installEvent ? 'Add OurPlace to your home screen: it opens full screen like an app and stays logged in.'
          : 'In Chrome, open the ⋮ menu and tap "Install app" (or "Add to Home screen").'),
    h('div', { class: 'row-btns' },
      installEvent ? h('button', { class: 'primary', onclick: async () => { try { await installEvent.prompt(); } catch { /* cancelled */ } close(); } }, 'Install app') : null,
      h('button', { class: 'link', onclick: close }, 'Not now')));
  return card;
}

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

// The landing page + login. Looks like a small website: what OurPlace is, what you can do,
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
  .al-recent { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin: .2em 0 .6em; }
  .al-chip { display: inline-flex; align-items: center; }
  .al-chip .link { padding: 0 .3em; }
  .house-card.go { background: var(--accent); color: #fff; }
  .house-card.go small { color: rgba(255,255,255,.9); }
  .al-install { border: 2px dashed var(--accent-2); }
  .remember { display: flex; gap: .5em; align-items: center; margin: .6em 0; }
  .remember input { width: auto; }
  `;
  document.head.appendChild(st);
}

export function loginScreen(ctx, { onDone, invited = false }) {
  const { ui, backend } = ctx; const { h } = ui;
  injectLandingStyles();
  const remembered = invited ? '' : safeGet(LAST_USER) || ''; // "Welcome back" when we know this device
  // name / id / autocomplete are what let the phone's password manager recognise and save this login
  const user = h('input', { placeholder: 'Username', name: 'username', id: 'ourplace-username', autocomplete: 'username', autocapitalize: 'none', autocorrect: 'off', spellcheck: 'false', maxlength: 20, value: remembered });
  const pass = h('input', { placeholder: 'Password', name: 'password', id: 'ourplace-password', type: 'password', autocomplete: 'current-password' });
  const err = h('p', { class: 'error' });
  const heading = h('h3', { style: { margin: '0 0 .4em' } }, remembered ? `Welcome back, ${remembered} 👋` : invited ? 'Join the house' : 'Come on in');
  const go = (fn, isNew = false) => async () => {
    err.textContent = '';
    err.className = 'muted'; err.textContent = loadingLine(); // a silly line while we wait
    if (isNew) pass.setAttribute('autocomplete', 'new-password'); // tells the phone this is a NEW password to save
    try { const u = await fn(user.value, pass.value); rememberLogin(user.value, pass.value); onDone(u); }
    catch (e) { err.className = 'error'; err.textContent = friendly(e.message); }
    finally { pass.setAttribute('autocomplete', 'current-password'); }
  };
  const logIn = go((u, p) => backend.signIn(u, p));
  // "On this device": tap a name to fill it in and jump to the password (a password manager can then autofill it)
  const recentBox = h('div', { class: 'al-recent' });
  const drawRecent = () => {
    const names = recentUsers();
    recentBox.replaceChildren(...(names.length ? [h('span', { class: 'muted small' }, 'On this device:'),
      ...names.map((n) => h('span', { class: 'al-chip' },
        h('button', { type: 'button', class: 'chip' + (user.value.toLowerCase() === n.toLowerCase() ? ' active' : ''), onclick: () => { user.value = n; heading.textContent = `Welcome back, ${n} 👋`; drawRecent(); pass.focus(); } }, `👤 ${n}`),
        h('button', { type: 'button', class: 'link small', title: `Forget ${n} on this device`, onclick: () => { forgetRecent(n); drawRecent(); } }, '✕')))] : []));
  };
  const notYou = remembered ? h('button', { type: 'button', class: 'link', onclick: () => { safeSet(LAST_USER, ''); user.value = ''; heading.textContent = 'Come on in'; notYou.remove(); user.focus(); } }, 'Not you? Use another account') : null;
  const form = h('form', { class: 'card form al-form', id: 'al-form', autocomplete: 'on', onsubmit: (e) => { e.preventDefault(); logIn(); } },
    heading, recentBox, user, pass, err,
    h('div', { class: 'row-btns' },
      h('button', { type: 'submit', class: 'primary' }, 'Log in'),
      h('button', { type: 'button', onclick: go((u, p) => backend.signUp(u, p), true) }, 'Create account')),
    notYou,
    isStandalone() && !remembered ? h('p', { class: 'muted small' }, 'Log in once in this app. After that, OurPlace remembers you.') : null,
    backend.mode === 'demo' ? h('p', { class: 'muted small' }, 'Demo mode: accounts live in this browser only. Open a second tab with another account to play together.') : null);

  drawRecent();
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
        h('h1', {}, 'OurPlace'),
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
    h('p', { class: 'al-foot' }, 'Free, friendly and non-commercial. Made with 💛 by the OurPlace team.')));
}

// The player's Home page. With welcome: true it greets a returning player ("Welcome back") with a big
// Continue button for the last house, pending friend requests, the install tip and a "go straight in" option.
export function housePicker(ctx, { me, houses, onOpen, onCreate, onJoin, onLogout, onFriends, joinCode = '',
  welcome = false, lastId = null, pending = 0, install = null, autoEnter = false, onAutoEnter }) {
  const { ui } = ctx; const { h } = ui;
  injectLandingStyles();
  const code = h('input', { placeholder: 'Invite code, e.g. K7Q2XD', value: joinCode, maxlength: 12, style: { textTransform: 'uppercase' } });
  const err = h('p', { class: 'error' });
  const emoji = (house) => ({ love: '💞', friends: '🛋️', family: '🏡', solo: '🎨' }[house.type] || '🏠');
  const last = welcome && lastId ? houses.find((x) => x.id === lastId) : null;
  const card = (house, go = false) => h('button', { class: 'house-card' + (go ? ' go' : ''), onclick: () => onOpen(house) },
    h('span', { class: 'big' }, emoji(house)),
    h('span', {}, h('b', {}, go ? `Continue to ${house.name}` : house.name),
      h('small', {}, go ? `Pick up where you left off · ${house.rooms?.length || 0} rooms` : `${house.rooms?.length || 0} rooms · you are ${house.members?.[me.id]?.role || 'member'}`)));
  const others = last ? houses.filter((x) => x.id !== last.id) : houses;
  ui.screen(h('div', { class: 'screen' },
    h('div', { class: 'screen-head' }, h('h2', {}, welcome ? `Welcome back, ${me.username} 👋` : `Hi ${me.username} 👋`), h('button', { class: 'link', onclick: onLogout }, welcome ? 'Not you? Switch profile' : 'Log out')),
    last ? h('div', { class: 'list' }, card(last, true)) : null,
    pending > 0 && onFriends ? h('div', { class: 'card' }, h('button', { class: 'wide', onclick: onFriends }, `💌 ${pending} friend request${pending > 1 ? 's' : ''} waiting`)) : null,
    install,
    houses.length ? h('div', {}, last && others.length ? h('h4', {}, 'Your other houses') : null, others.length ? h('div', { class: 'list' }, ...others.map((house) => card(house))) : null)
      : h('p', { class: 'muted' }, "You don't have a house yet. Create one, or join a friend's with their code."),
    h('div', { class: 'card' }, h('button', { class: 'primary wide', onclick: onCreate }, '＋ Create a new house')),
    onFriends ? h('div', { class: 'card' }, h('button', { class: 'wide', onclick: onFriends }, '🤝 Friends')) : null,
    h('div', { class: 'card form' }, h('h4', {}, 'Join a house'), code, err,
      h('button', { class: 'wide', onclick: async () => { err.textContent = ''; try { await onJoin(code.value); } catch (e) { err.textContent = friendly(e.message); } } }, 'Join')),
    welcome && houses.length && onAutoEnter ? h('label', { class: 'remember muted small' },
      h('input', { type: 'checkbox', checked: autoEnter, onchange: (e) => onAutoEnter(e.target.checked) }), 'Go straight into my last house when I open the app') : null));
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
