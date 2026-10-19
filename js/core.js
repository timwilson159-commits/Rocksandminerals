/* Core helpers shared by the room, the puzzles and the door. */
(function () {
  const ER = (window.ER = {
    puzzles: [],
    register(def) { this.puzzles.push(def); },
    get(id) { return this.puzzles.find((p) => p.id === id); },
  });

  // Tiny DOM builder: ER.el('div', {class:'x', onclick: fn}, 'text', childNode)
  ER.el = function (tag, props, ...kids) {
    const svgTags = ['svg', 'path', 'rect', 'circle', 'ellipse', 'line', 'polygon', 'polyline', 'g', 'text', 'defs', 'marker'];
    const e = svgTags.includes(tag)
      ? document.createElementNS('http://www.w3.org/2000/svg', tag)
      : document.createElement(tag);
    if (props) {
      for (const k in props) {
        const v = props[k];
        if (v === false || v == null) continue;
        if (k === 'class') e.setAttribute('class', v);
        else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
        else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
        else if (k === 'html') e.innerHTML = v;
        else if (k === 'text') e.textContent = v;
        else e.setAttribute(k, v === true ? '' : v);
      }
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      e.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return e;
  };

  ER.shuffle = function (arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  ER.norm = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

  // Show a message in a feedback element, with a shake on errors.
  ER.say = function (node, msg, kind) {
    node.textContent = msg;
    node.className = 'feedback ' + (kind || '');
    if (kind === 'bad') {
      node.classList.remove('shake');
      void node.offsetWidth;
      node.classList.add('shake');
    }
  };

  ER.shake = function (node) {
    node.classList.remove('shake');
    void node.offsetWidth;
    node.classList.add('shake');
  };

  // A row of single-letter boxes that behaves like one input.
  // Returns {node, value(), set(str), clear(), mark(kind), focus()}
  ER.letterBoxes = function (length, opts = {}) {
    const wrap = ER.el('div', { class: 'letter-boxes' + (opts.small ? ' small' : '') });
    const inputs = [];
    for (let i = 0; i < length; i++) {
      const inp = ER.el('input', {
        class: 'lbox', maxlength: '1', autocomplete: 'off', autocapitalize: 'characters',
        spellcheck: 'false', 'aria-label': (opts.label || 'Letter') + ' ' + (i + 1),
      });
      if (opts.prefill && opts.prefill[i]) {
        inp.value = opts.prefill[i];
        inp.readOnly = true;
        inp.classList.add('prefilled');
      }
      inp.addEventListener('input', () => {
        inp.value = inp.value.replace(/[^a-zA-Z0-9]/g, '').slice(-1).toUpperCase();
        if (inp.value) {
          let n = i + 1;
          while (inputs[n] && inputs[n].readOnly) n++;
          if (inputs[n]) inputs[n].focus();
        }
        if (opts.onChange) opts.onChange(api.value());
      });
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !inp.value) {
          let p = i - 1;
          while (inputs[p] && inputs[p].readOnly) p--;
          if (inputs[p]) { inputs[p].focus(); inputs[p].value = ''; e.preventDefault(); if (opts.onChange) opts.onChange(api.value()); }
        } else if (e.key === 'ArrowLeft' && inputs[i - 1]) inputs[i - 1].focus();
        else if (e.key === 'ArrowRight' && inputs[i + 1]) inputs[i + 1].focus();
        else if (e.key === 'Enter' && opts.onEnter) opts.onEnter(api.value());
      });
      inp.addEventListener('focus', () => inp.select());
      inputs.push(inp);
      wrap.append(inp);
    }
    const api = {
      node: wrap,
      inputs,
      value: () => inputs.map((x) => x.value || ' ').join(''),
      full: () => inputs.every((x) => x.value),
      set: (s) => inputs.forEach((x, i) => (x.value = s[i] || '')),
      mark(kind) {
        wrap.classList.remove('good', 'bad');
        if (kind) wrap.classList.add(kind);
        if (kind === 'bad') ER.shake(wrap);
      },
      lock() { inputs.forEach((x) => (x.readOnly = true)); },
      focus() { const f = inputs.find((x) => !x.readOnly && !x.value) || inputs[0]; f.focus(); },
    };
    return api;
  };

  /*
   * Drag-and-drop (or tap-to-select then tap-a-zone).
   * pieces: element[]  zones: element[] (class .dz added)  tray: element
   * onDrop(piece, zoneOrNull) decides what happens.
   */
  ER.dnd = function ({ pieces, zones, tray, onDrop }) {
    let selected = null;
    const select = (p) => {
      if (selected) selected.classList.remove('selected');
      selected = p;
      if (p) p.classList.add('selected');
      zones.forEach((z) => z.classList.toggle('targeting', !!p));
    };
    zones.forEach((z) => {
      z.classList.add('dz');
      z.addEventListener('click', (e) => {
        if (e.target.closest('.piece')) return;
        if (selected) { const p = selected; select(null); onDrop(p, z); }
      });
    });
    tray.addEventListener('click', (e) => {
      if (selected && !e.target.closest('.piece')) { const p = selected; select(null); onDrop(p, null); }
    });
    pieces.forEach((p) => {
      p.classList.add('piece');
      p.addEventListener('pointerdown', (e) => {
        if (p.classList.contains('locked') || e.button > 0) return;
        e.preventDefault();
        const sx = e.clientX, sy = e.clientY;
        let dragging = false;
        let hover = null;
        const move = (ev) => {
          const dx = ev.clientX - sx, dy = ev.clientY - sy;
          if (!dragging && Math.hypot(dx, dy) > 6) {
            dragging = true;
            select(null);
            p.classList.add('dragging');
            zones.forEach((z) => z.classList.add('targeting'));
          }
          if (dragging) {
            p.style.transform = `translate(${dx}px, ${dy}px) scale(1.06)`;
            p.style.pointerEvents = 'none';
            const under = document.elementFromPoint(ev.clientX, ev.clientY);
            const z = under && under.closest('.dz');
            if (hover && hover !== z) hover.classList.remove('hovering');
            hover = z && zones.includes(z) ? z : null;
            if (hover) hover.classList.add('hovering');
          }
        };
        const up = (ev) => {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', up);
          window.removeEventListener('pointercancel', up);
          if (dragging) {
            p.classList.remove('dragging');
            p.style.transform = '';
            p.style.pointerEvents = 'none';
            const under = document.elementFromPoint(ev.clientX, ev.clientY);
            p.style.pointerEvents = '';
            if (hover) hover.classList.remove('hovering');
            zones.forEach((z) => z.classList.remove('targeting'));
            const z = under && under.closest('.dz');
            onDrop(p, z && zones.includes(z) ? z : null);
          } else {
            if (window.ER.sfx) ER.sfx.tap();
            select(selected === p ? null : p);
          }
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
        window.addEventListener('pointercancel', up);
      });
    });
    return { deselect: () => select(null) };
  };

  /*
   * Drag cards into labelled slots, then press Check.
   * Right cards lock in; wrong ones bounce back to the tray.
   * slots: [{label, accept}]  cards: [{id, content}]  layout: 'list' | 'row'
   */
  ER.matchTask = function ({ slots, cards, layout = 'list', checkText = '✔ Check my answer', onSolved }) {
    const el = ER.el;
    const drops = [];
    const board = el('div', { class: 'mt-board mt-' + layout });
    slots.forEach((s) => {
      const drop = el('div', { class: 'mt-drop', 'data-accept': s.accept });
      drops.push(drop);
      board.append(el('div', { class: 'mt-slot' }, el('div', { class: 'mt-label' }, s.label), drop));
    });
    const tray = el('div', { class: 'tray mt-tray' });
    const cardEls = ER.shuffle(cards).map((c) => {
      const n = el('button', { class: 'mt-card', 'data-id': c.id }, c.content);
      tray.append(n);
      return n;
    });
    const fb = el('p', { class: 'feedback', 'aria-live': 'polite' });
    const btn = el('button', { class: 'btn btn-sun btn-big' }, checkText);
    ER.dnd({
      pieces: cardEls, zones: drops, tray,
      onDrop(card, zone) {
        ER.sfx.tap();
        if (!zone) { tray.append(card); return; }
        if (zone.classList.contains('locked')) return;
        const existing = zone.querySelector('.mt-card');
        if (existing && existing !== card) tray.append(existing);
        zone.append(card);
        fb.textContent = '';
      },
    });
    btn.addEventListener('click', () => {
      const empty = drops.filter((d) => !d.querySelector('.mt-card')).length;
      if (empty) { ER.sfx.bad(); ER.say(fb, `Fill every space first (${empty} still empty).`, 'bad'); return; }
      let wrong = 0;
      drops.forEach((d) => {
        if (d.classList.contains('locked')) return;
        const c = d.querySelector('.mt-card');
        if (c.dataset.id === d.dataset.accept) { d.classList.add('locked'); c.classList.add('locked'); }
        else { wrong++; tray.append(c); ER.shake(c); }
      });
      if (!wrong) {
        btn.hidden = true;
        tray.hidden = true;
        ER.sfx.good();
        ER.say(fb, '✅ All correct!', 'good');
        if (onSolved) onSolved();
      } else {
        ER.sfx.bad();
        ER.say(fb, `${drops.length - wrong} correct and locked in 🔒. ${wrong} went back to the tray. Try again!`, 'bad');
      }
    });
    return el('div', { class: 'match-task' }, board, tray, el('div', { class: 'row-center' }, btn), fb);
  };

  // Multiple-choice questions shown one at a time. questions: [{q, opts, a, why}]
  ER.quizSeq = function (questions, onDone, title = '🧠 Question') {
    const el = ER.el;
    const box = el('div', { class: 'card quiz' });
    let i = 0;
    const render = () => {
      box.innerHTML = '';
      const q = questions[i];
      const qfb = el('p', { class: 'feedback' });
      box.append(
        el('h4', {}, `${title} ${i + 1} of ${questions.length}`),
        el('p', {}, q.q),
        el('div', { class: 'quiz-opts' }, ER.shuffle(q.opts).map((o) => el('button', {
          class: 'btn quiz-opt',
          onclick: (e) => {
            if (o === q.a) {
              e.currentTarget.classList.add('right');
              box.querySelectorAll('.quiz-opt').forEach((b) => (b.disabled = true));
              ER.sfx.good();
              i++;
              if (i < questions.length) { ER.say(qfb, '✅ Correct!', 'good'); setTimeout(render, 900); }
              else { ER.say(qfb, '🎉 Correct!', 'good'); if (onDone) onDone(); }
            } else {
              ER.sfx.bad();
              e.currentTarget.classList.add('wrong');
              ER.say(qfb, 'Not quite. ' + (q.why || 'Read the question again carefully.'), 'bad');
            }
          },
        }, o))),
        qfb);
    };
    render();
    return box;
  };

  // Fit a fixed-size canvas's CSS size and map pointer events to canvas coords.
  ER.canvasPoint = function (canvas, e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * canvas.width,
      y: ((e.clientY - r.top) / r.height) * canvas.height,
    };
  };

  // Keyboard state helper for games. Returns {down(keyNames...), dispose()}
  ER.keys = function () {
    const held = new Set();
    const kd = (e) => {
      held.add(e.key.toLowerCase());
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
        if (!(e.target instanceof HTMLInputElement)) e.preventDefault();
      }
    };
    const ku = (e) => held.delete(e.key.toLowerCase());
    const blur = () => held.clear();
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    window.addEventListener('blur', blur);
    return {
      down: (...names) => names.some((n) => held.has(n)),
      dispose() {
        window.removeEventListener('keydown', kd);
        window.removeEventListener('keyup', ku);
        window.removeEventListener('blur', blur);
      },
    };
  };
})();
