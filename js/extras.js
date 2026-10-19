/* Extra shared helpers for this escape room: sorting into bins, and a flash sound. */
(function () {
  /*
   * Drag cards into category bins, then press Check.
   * bins: [{id, title, desc}]  cards: [{cat, content}]
   */
  ER.sortTask = function ({ bins, cards, checkText = '✔ Check my sorting', trayTitle = 'Cards', onSolved }) {
    const el = ER.el;
    const cardEls = cards.map((c) => el('button', { class: 'mt-card', 'data-cat': c.cat }, c.content));
    const tray = el('div', { class: 'tray mt-tray' });
    ER.shuffle(cardEls).forEach((c) => tray.append(c));
    const drops = [];
    const binsEl = el('div', { class: 'sort-bins' }, bins.map((b) => {
      const drop = el('div', { class: 'bin-drop', 'data-cat': b.id });
      drops.push(drop);
      return el('div', { class: 'sort-bin' }, el('h4', {}, b.title), b.desc ? el('p', {}, b.desc) : null, drop);
    }));
    const fb = el('p', { class: 'feedback', 'aria-live': 'polite' });
    const btn = el('button', { class: 'btn btn-sun btn-big' }, checkText);
    ER.dnd({
      pieces: cardEls, zones: drops, tray,
      onDrop(card, zone) {
        ER.sfx.tap();
        (zone || tray).append(card);
        fb.textContent = '';
      },
    });
    btn.addEventListener('click', () => {
      const left = tray.querySelectorAll('.mt-card').length;
      if (left) { ER.sfx.bad(); ER.say(fb, `Sort every card first (${left} still in the tray).`, 'bad'); return; }
      let wrong = 0;
      drops.forEach((d) => d.querySelectorAll('.mt-card:not(.locked)').forEach((c) => {
        if (c.dataset.cat === d.dataset.cat) c.classList.add('locked');
        else { wrong++; tray.append(c); ER.shake(c); }
      }));
      if (!wrong) {
        btn.hidden = true;
        tray.hidden = true;
        ER.sfx.good();
        ER.say(fb, '✅ All sorted correctly!', 'good');
        if (onSolved) onSolved();
      } else {
        ER.sfx.bad();
        ER.say(fb, `${cards.length - wrong} correct and locked in 🔒. ${wrong} went back to the tray. Read the definitions again!`, 'bad');
      }
    });
    return el('div', { class: 'match-task' }, binsEl, el('h4', { class: 'tray-title' }, trayTitle), tray, el('div', { class: 'row-center' }, btn), fb);
  };

  // A glowing "zap" for the blue-ringed octopus light code.
  const AC = window.AudioContext || window.webkitAudioContext;
  let ctx = null;
  ER.sfx.zap = function (long) {
    if (ER.sfx.muted || !AC) return;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();
    const t0 = ctx.currentTime, dur = long ? 0.5 : 0.14;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(long ? 520 : 1040, t0);
    o.frequency.linearRampToValueAtTime(long ? 600 : 1200, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.16, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  };
})();
