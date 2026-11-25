// GUIDE ENGINE (owned by Social): "Pip", a tiny animated buddy who talks to you in a
// video-game style dialogue box. This file is only the engine: the box, the character, the
// typewriter, Skip / Next. What Pip SAYS lives in guideScripts.js.
//
// const guide = createGuide(ctx);
// const result = await guide.play([
//   { say: 'Hi!', mood: 'happy' },                       // mood: happy | wink | wow | think | love
//   { say: 'This is the kitchen', room: 'roomId' },      // room: jump the camera to that room first
//   { say: 'This is the chat button', point: 'chat' },   // point: pulse that dock button
//   { say: 'Want a tour?', choices: [{ label: 'Yes!', value: 'yes' }, { label: 'Nope', value: 'no' }] },
// ]);                                                    // -> 'done' | 'skipped' | a choice value

const PIP_SVG = `
<svg viewBox="0 0 100 104" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <g class="pip-body">
    <line x1="50" y1="14" x2="50" y2="5" stroke="#6c63ff" stroke-width="4" stroke-linecap="round"/>
    <circle class="pip-ball" cx="50" cy="5" r="5" fill="#ff6b8b"/>
    <rect class="pip-arm l" x="4" y="44" width="13" height="24" rx="6.5" fill="#6c63ff"/>
    <rect class="pip-arm r" x="83" y="44" width="13" height="24" rx="6.5" fill="#6c63ff"/>
    <rect x="28" y="78" width="17" height="14" rx="6" fill="#2b2350"/>
    <rect x="55" y="78" width="17" height="14" rx="6" fill="#2b2350"/>
    <rect x="16" y="14" width="68" height="66" rx="18" fill="#6c63ff"/>
    <rect x="22" y="20" width="56" height="54" rx="13" fill="#fffaf3"/>
    <g class="pip-eyes">
      <ellipse class="eye l" cx="38" cy="42" rx="6" ry="7.5" fill="#2b2350"/>
      <ellipse class="eye r" cx="62" cy="42" rx="6" ry="7.5" fill="#2b2350"/>
    </g>
    <text class="pip-heart l" x="38" y="49" font-size="17" text-anchor="middle" fill="#ff4f7a">♥</text>
    <text class="pip-heart r" x="62" y="49" font-size="17" text-anchor="middle" fill="#ff4f7a">♥</text>
    <circle cx="30" cy="55" r="5" fill="#ff9db3" opacity=".75"/>
    <circle cx="70" cy="55" r="5" fill="#ff9db3" opacity=".75"/>
    <path class="pip-smile" d="M40 57 Q50 66 60 57" stroke="#2b2350" stroke-width="3.2" fill="none" stroke-linecap="round"/>
    <path class="pip-flat" d="M42 61 L58 61" stroke="#2b2350" stroke-width="3.2" fill="none" stroke-linecap="round"/>
    <ellipse class="pip-mouth" cx="50" cy="60" rx="6.5" ry="6" fill="#2b2350"/>
  </g>
</svg>`;

const CSS = `
.gd { position: fixed; left: 0; right: 0; bottom: calc(env(safe-area-inset-bottom) + 94px); z-index: 5; display: flex; justify-content: center; padding: 0 10px; pointer-events: none; }
.gd-box { pointer-events: auto; width: min(100%, 560px); background: var(--paper, #fffaf3); border: 3px solid var(--ink, #2b2350); border-radius: 22px; box-shadow: 0 10px 30px rgba(43,35,80,.28); display: flex; gap: 10px; align-items: flex-end; padding: 10px 12px 10px 8px; animation: gd-in .25s ease-out; }
@keyframes gd-in { from { transform: translateY(24px); opacity: 0; } }
.gd-pip { flex: none; width: 76px; margin-top: -34px; }
.gd-pip svg { width: 100%; display: block; overflow: visible; }
.gd-main { flex: 1; min-width: 0; }
.gd-name { font-weight: 800; font-size: .78rem; letter-spacing: .06em; text-transform: uppercase; color: var(--accent-2, #6c63ff); }
.gd-text { margin: .15em 0 .5em; min-height: 2.9em; font-size: 1.02rem; line-height: 1.38; color: var(--ink, #2b2350); }
.gd-foot { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.gd-dots { display: flex; gap: 4px; flex: 1; min-width: 40px; }
.gd-dots i { width: 7px; height: 7px; border-radius: 50%; background: var(--line, #eadfce); }
.gd-dots i.on { background: var(--accent, #ff6b8b); }
.gd-btns { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
.gd-skip { background: none; color: var(--ink-2, #6b6490); text-decoration: underline; padding: .3em .5em; }
.gd-next { background: var(--accent, #ff6b8b); color: #fff; padding: .45em 1.1em; border-radius: 999px; font-weight: 700; }
.gd-choice { background: #fff; border: 2px solid var(--ink, #2b2350); color: var(--ink, #2b2350); padding: .4em 1em; border-radius: 999px; font-weight: 700; }
.gd-choice.first { background: var(--accent, #ff6b8b); border-color: var(--accent, #ff6b8b); color: #fff; }
.gd-hl { animation: gd-ring 1s ease-in-out infinite; position: relative; z-index: 6; }
@keyframes gd-ring { 0%, 100% { box-shadow: 0 0 0 0 rgba(255,107,139,.0); transform: scale(1); } 50% { box-shadow: 0 0 0 6px rgba(255,107,139,.55); transform: scale(1.12); } }

/* Pip */
.pip .pip-body { transform-origin: 50% 90%; animation: pip-bob 2.2s ease-in-out infinite; }
@keyframes pip-bob { 50% { transform: translateY(-3px) rotate(-1.5deg); } }
.pip .pip-eyes { transform-origin: 50% 42px; animation: pip-blink 4.2s infinite; }
@keyframes pip-blink { 0%, 94%, 100% { transform: scaleY(1); } 97% { transform: scaleY(.1); } }
.pip .pip-ball { animation: pip-ping 1.6s ease-in-out infinite; transform-origin: 50px 5px; }
@keyframes pip-ping { 50% { transform: scale(1.35); } }
.pip .pip-arm { transform-box: fill-box; transform-origin: 50% 10%; }
.pip.hi .pip-arm.r { animation: pip-wave .5s ease-in-out 3; }
@keyframes pip-wave { 50% { transform: rotate(-55deg); } }
.pip .pip-mouth, .pip .pip-flat, .pip .pip-heart { display: none; }
.pip.wow .pip-smile, .pip.talk .pip-smile, .pip.think .pip-smile { display: none; }
.pip.wow .pip-mouth { display: block; }
.pip.talk .pip-mouth { display: block; animation: pip-talk .22s steps(2) infinite; transform-origin: 50px 60px; }
@keyframes pip-talk { 50% { transform: scaleY(.25); } }
.pip.think .pip-flat { display: block; }
.pip.think .pip-eyes { transform: translate(-3px, -3px); animation: none; }
.pip.wow .eye { transform-box: fill-box; transform-origin: center; transform: scale(1.25); }
.pip.wink .eye.r { transform-box: fill-box; transform-origin: center; transform: scaleY(.12); }
.pip.love .pip-eyes { display: none; }
.pip.love .pip-heart { display: block; animation: pip-ping .8s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .gd-box, .gd-hl, .pip * { animation: none !important; } }
@media (min-width: 700px) { .gd { bottom: 96px; } .gd-pip { width: 92px; margin-top: -46px; } }
`;

export function createGuide(ctx) {
  const { ui, bus } = ctx; const { h } = ui;
  let layer = null; let run = null; // run = { finish, timer }

  function injectStyles() {
    if (document.getElementById('aura-guide-css')) return;
    const st = document.createElement('style'); st.id = 'aura-guide-css'; st.textContent = CSS; document.head.appendChild(st);
  }
  const clearHighlight = () => document.querySelectorAll('.gd-hl').forEach((e) => e.classList.remove('gd-hl'));

  function stop(result = 'skipped') { if (run) run.finish(result); }

  /** Play a list of steps. Resolves with 'done', 'skipped' or the value of the choice the player picked. */
  function play(steps, { skipLabel = 'Skip' } = {}) {
    stop('skipped');
    injectStyles();
    ui.closePanel?.();
    return new Promise((resolve) => {
      let i = 0; let typing = null; let full = ''; let shown = 0;
      const pip = h('div', { class: 'pip happy', html: PIP_SVG });
      const name = h('div', { class: 'gd-name' }, 'Pip');
      const text = h('p', { class: 'gd-text' });
      const dots = h('div', { class: 'gd-dots' }, ...steps.map(() => h('i')));
      const btns = h('div', { class: 'gd-btns' });
      const box = h('div', { class: 'gd-box', role: 'dialog', 'aria-live': 'polite' },
        h('div', { class: 'gd-pip' }, pip), h('div', { class: 'gd-main' }, name, text, h('div', { class: 'gd-foot' }, dots, btns)));
      layer = h('div', { class: 'gd' }, box);
      document.body.append(layer);

      const finish = (result) => {
        clearInterval(typing); document.removeEventListener('keydown', onKey, true);
        clearHighlight(); ui.closeRibbon?.(); layer?.remove(); layer = null; run = null; resolve(result);
      };
      run = { finish };

      const setMood = (mood = 'happy') => { pip.className = `pip ${mood}${i === 0 ? ' hi' : ''}`; };
      function completeText() { clearInterval(typing); typing = null; text.textContent = full; pip.classList.remove('talk'); }
      function show() {
        const step = steps[i];
        clearHighlight();
        if (step.room) bus.emit('room:goto', { roomId: step.room });
        ui.closeRibbon?.();
        if (step.point) { const el = document.querySelector(`.dock-btn[data-id="${step.point}"]`); if (el) { if (el.closest('.ribbon')) ui.openRibbon?.(); el.classList.add('gd-hl'); } }
        [...dots.children].forEach((d, k) => d.classList.toggle('on', k <= i));
        full = step.say; shown = 0; text.textContent = '';
        setMood(step.mood); pip.classList.add('talk');
        clearInterval(typing);
        typing = setInterval(() => { shown += 1; text.textContent = full.slice(0, shown); if (shown >= full.length) completeText(); }, 22);
        btns.replaceChildren();
        if (step.choices) btns.append(...step.choices.map((c, k) => h('button', { class: 'gd-choice' + (k === 0 ? ' first' : ''), onclick: () => finish(c.value) }, c.label)));
        else {
          btns.append(h('button', { class: 'gd-skip', onclick: () => finish('skipped') }, skipLabel),
            h('button', { class: 'gd-next', onclick: advance }, i === steps.length - 1 ? 'Got it ✓' : 'Next ▶'));
        }
      }
      function advance() {
        if (typing) return completeText(); // first tap finishes the line, second tap moves on
        if (steps[i].choices) return;
        if (i >= steps.length - 1) return finish('done');
        i += 1; show();
      }
      function onKey(e) {
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
        if (e.key === 'Escape') { e.preventDefault(); finish('skipped'); }
        else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); advance(); }
      }
      document.addEventListener('keydown', onKey, true);
      text.addEventListener('click', advance); pip.addEventListener('click', advance);
      show();
    });
  }

  bus.on('house:left', () => stop('skipped'));
  return { play, stop, playing: () => !!run };
}
