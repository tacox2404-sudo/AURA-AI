// LOGIN, HOUSE PICKER and ONBOARDING screens (owned by Social).

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

export function loginScreen(ctx, { onDone, invited = false }) {
  const { ui, backend } = ctx; const { h } = ui;
  const user = h('input', { placeholder: 'Username', autocomplete: 'username', maxlength: 20 });
  const pass = h('input', { placeholder: 'Password', type: 'password', autocomplete: 'current-password' });
  const err = h('p', { class: 'error' });
  const go = (fn) => async () => {
    err.textContent = '';
    try { onDone(await fn(user.value, pass.value)); } catch (e) { err.textContent = friendly(e.message); }
  };
  ui.screen(h('div', { class: 'screen center' },
    h('div', { class: 'logo' }, '🏠'),
    h('h1', {}, 'OurPlace'),
    h('p', { class: 'tagline' }, 'A cozy home you build with your people, wherever they are.'),
    invited ? h('p', { class: 'card', style: { textAlign: 'center' } }, '💌 You have been invited to a house! Create an account (or log in) and you will join it automatically.') : null,
    h('div', { class: 'card form' }, user, pass, err,
      h('div', { class: 'row-btns' },
        h('button', { class: 'primary', onclick: go((u, p) => backend.signIn(u, p)) }, 'Log in'),
        h('button', { onclick: go((u, p) => backend.signUp(u, p)) }, 'Create account'))),
    backend.mode === 'demo' ? h('p', { class: 'muted small' }, 'Demo mode: accounts live in this browser only. Open a second tab with another account to play together.') : null));
}

export function housePicker(ctx, { me, houses, onOpen, onCreate, onJoin, onLogout, joinCode = '' }) {
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
