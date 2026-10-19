/* Rocky Research Station — main.js: room engine, player, HUD, scenes */
(function () {
  const { el, sfx } = ER;
  const W = 320, H = 224, S = 3;

  const canvas = document.getElementById('room');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  canvas.width = W; canvas.height = H;
  canvas.style.width  = W * S + 'px';
  canvas.style.height = H * S + 'px';

  const roomView   = document.getElementById('room-view');
  const puzzleView = document.getElementById('puzzle-view');
  const notesList  = document.getElementById('notes-list');
  const hudCodes   = document.getElementById('hud-codes');
  const hudTime    = document.getElementById('hud-time');

  const state = {
    solved: [],
    timerOn: false,
    startTime: 0,
    elapsed: 0,
    escaped: false,
    current: null,
    cleanup: null,
  };

  // ── Modals ──────────────────────────────────────────────────────────────
  ER.modal = function ({ title, content, buttons = [], className = '', dismissable = true }) {
    const root = document.getElementById('modal-root');
    const box = el('div', { class: 'modal ' + className, role: 'dialog', 'aria-modal': 'true' });
    const overlay = el('div', { class: 'overlay' }, box);
    const onKey = (e) => { if (e.key === 'Escape' && dismissable) close(); };
    const close = () => {
      document.removeEventListener('keydown', onKey);
      overlay.classList.add('closing');
      setTimeout(() => overlay.remove(), 180);
    };
    if (title) box.append(el('h2', { class: 'modal-title' }, title));
    if (content) box.append(content.nodeType ? content : el('div', { html: content }));
    const row = el('div', { class: 'modal-buttons' });
    buttons.forEach((b) =>
      row.append(el('button', {
        class: 'btn ' + (b.class || ''),
        onclick: () => { if (b.close !== false) close(); if (b.onClick) b.onClick(); },
      }, b.label)));
    if (buttons.length) box.append(row);
    if (dismissable) overlay.addEventListener('pointerdown', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', onKey);
    root.append(overlay);
    setTimeout(() => { const b = row.querySelector('button'); if (b) b.focus(); }, 60);
    return { close, box };
  };
  const modalOpen = () => !!document.querySelector('#modal-root .overlay:not(.closing)');

  // ── Room geometry ───────────────────────────────────────────────────────
  const STATIONS = {
    planets:    { x: 48,  y: 34,  front: [64,  78]  },
    rockcycle:  { x: 240, y: 34,  front: [256, 78]  },
    minerals:   { x: 18,  y: 80,  front: [50,  98]  },
    layers:     { x: 270, y: 80,  front: [286, 98]  },
    rocktypes:  { x: 62,  y: 168, front: [78,  164] },
    planetquiz: { x: 226, y: 168, front: [242, 164] },
  };
  const DOOR = { x: 136, y: 2, w: 48, h: 30, front: [160, 46] };
  const POOL = { x: 160, y: 112, r: 24 };
  const SOLIDS = [
    ...Object.values(STATIONS).map((s) => ({ x: s.x, y: s.y, w: 32, h: 32 })),
    { x: 108, y: 158, w: 104, h: 24 },
  ];

  const player = { x: 160, y: 148, dir: 'down', moving: false, anim: 0, target: null, pendingOpen: null, stepT: 0 };

  function blocked(x, y) {
    const l = x - 5, r = x + 5, t = y - 6, b = y;
    if (l < 16 || r > 304 || t < 34 || b > 206) return true;
    for (const s of SOLIDS) {
      if (r > s.x && l < s.x + s.w && b > s.y && t < s.y + s.h) return true;
    }
    const dx = x - POOL.x, dy = y - POOL.y;
    if (Math.sqrt(dx * dx + dy * dy) < POOL.r + 5) return true;
    return false;
  }

  function rectDist(px, py, s, w = 32, h = 32) {
    const cx = Math.max(s.x, Math.min(px, s.x + w));
    const cy = Math.max(s.y, Math.min(py, s.y + h));
    return Math.hypot(px - cx, py - cy);
  }

  function nearest() {
    let best = null, bd = 1e9;
    for (const id in STATIONS) {
      const d = rectDist(player.x, player.y - 3, STATIONS[id]);
      if (d < 14 && d < bd) { bd = d; best = id; }
    }
    const dd = Math.hypot(player.x - DOOR.front[0], player.y - DOOR.front[1]);
    if (dd < 18 && dd < bd) best = 'door';
    return best;
  }

  // ── Sprites ─────────────────────────────────────────────────────────────
  const PAL = {
    k: '#1b1b2e', h: '#5c3317', o: '#d7a36b', m: '#a5d6a7',
    w: '#ffffff', s: '#f6c7a1', y: '#ffd23f', Y: '#e6a100',
    b: '#2e7d32', g: '#9aa7bd', '.': null,
  };
  const TOP_DOWN  = ['...kkkkkk...', '..khhhhhhk..', '.khhhhhhhhk.', '.kmmmmmmmmk.', '.kmwmmmmwmk.', '.kssssssssk.', '..kssoossk..', '..kbbbbbk...', '.kbbYbbYbbk.', 'kbbbbbbbbbk.', 'ksbbbYYbbbsk', '.kkbbbbbkkk.'];
  const TOP_UP    = ['...kkkkkk...', '..khhhhhhk..', '.khhhhhhhhk.', '.kohhhhhhhk.', '.khhhhhhhhk.', '.khhhhhhhhk.', '..kkhhhhkk..', '..kbggggbk..', '.kbbgggbbyk.', 'kbbbggggbbk.', 'ksbbbggbbsk.', '.kkbbbbbkk..'];
  const TOP_SIDE  = ['...kkkkkk...', '..khhhhhhk..', '.khhhhhhhhk.', '.khhoommmk..', '.khhksmwmk..', '.khhsssssk..', '..khsssssk..', '..kkbbbbbk..', '..gkbbbbbk..', '..gkbbbsbk..', '..gkbbbsbk..', '...kbbbbbk..'];
  const LEGS_A = ['..kbbkkbbk..', '..kbbkkbbk..', '.kbbbkkbbbk.', '.kkkkkkkkkk.'];
  const LEGS_B = ['..kbbkkbbk..', '..kbbkkbbk..', '.kbbbk.kbbk.', '.kkkkk.kkk..'];
  const SIDE_A = ['...kbbbbk...', '...kbbbbk...', '...kbbbbk...', '...kkkkkkk..'];
  const SIDE_B = ['...kbbbbk...', '..kbbkkbbk..', '.kbbk..kbbk.', '.kkk....kkk.'];
  const mirror = (rows) => rows.map((r) => r.split('').reverse().join(''));

  function makeSprite(rows) {
    const c = document.createElement('canvas');
    c.width = 12; c.height = rows.length;
    const x = c.getContext('2d');
    rows.forEach((r, j) => {
      for (let i = 0; i < 12; i++) {
        const ch = r[i];
        if (ch && ch !== '.' && PAL[ch]) { x.fillStyle = PAL[ch]; x.fillRect(i, j, 1, 1); }
      }
    });
    return c;
  }
  const SPR = {
    down:  [makeSprite([...TOP_DOWN, ...LEGS_A]), makeSprite([...TOP_DOWN, ...LEGS_B]), makeSprite([...TOP_DOWN, ...LEGS_A]), makeSprite([...TOP_DOWN, ...mirror(LEGS_B)])],
    up:    [makeSprite([...TOP_UP,   ...LEGS_A]), makeSprite([...TOP_UP,   ...LEGS_B]), makeSprite([...TOP_UP,   ...LEGS_A]), makeSprite([...TOP_UP,   ...mirror(LEGS_B)])],
    right: [makeSprite([...TOP_SIDE, ...SIDE_A]), makeSprite([...TOP_SIDE, ...SIDE_B])],
    left:  [makeSprite(mirror([...TOP_SIDE, ...SIDE_A])), makeSprite(mirror([...TOP_SIDE, ...SIDE_B]))],
  };

  // ── Drawing helpers ─────────────────────────────────────────────────────
  const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  const circle = (x, y, r, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(Math.round(x), Math.round(y), r, 0, Math.PI * 2); ctx.fill(); };

  function drawFloor() {
    for (let ty = 2; ty < 13; ty++) {
      for (let tx = 1; tx < 19; tx++) {
        px(tx * 16, ty * 16, 16, 16, (tx + ty) % 2 ? '#c0622a' : '#b5571f');
        px(tx * 16, ty * 16, 16, 1, '#8d3d12');
        px(tx * 16, ty * 16, 1, 16, '#8d3d12');
      }
    }
    for (let i = 0; i < 6; i++) px(148, 34 + i * 4, 24, 2, i % 2 ? '#ffd23f' : '#b5571f');
  }

  function drawWalls(t) {
    // top wall
    px(0, 0, W, 34, '#2d1505');
    px(0, 4, W, 2, '#1a0800');
    for (let xi = 0; xi < W; xi += 32) px(xi, 0, 2, 34, '#3e2008');
    // left wall
    px(0, 34, 16, H - 34, '#2d1505');
    px(12, 34, 4, H - 34, '#e64a19');
    for (let yi = 0; yi < 4; yi++) circle(8, 54 + yi * 40, 2, '#ffd23f');
    // right wall
    px(W - 16, 34, 16, H - 34, '#2d1505');
    px(W - 16, 34, 4, H - 34, '#e64a19');
    for (let yi = 0; yi < 4; yi++) circle(W - 8, 54 + yi * 40, 2, '#ffd23f');
    // bottom wall
    px(0, H - 16, W, 16, '#1a0800');

    // porthole windows
    const portholes = [[22, 65], [22, 130], [W - 34, 65], [W - 34, 130]];
    portholes.forEach(([wx, wy]) => {
      circle(wx, wy, 10, '#1a237e');
      circle(wx, wy, 10, 'rgba(255,180,50,0.15)');
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(wx, wy, 9, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,200,80,0.4)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(wx - 9, wy); ctx.lineTo(wx + 9, wy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(wx, wy - 9); ctx.lineTo(wx, wy + 9); ctx.stroke();
      ctx.strokeStyle = '#e64a19'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(wx, wy, 11, 0, Math.PI * 2); ctx.stroke();
    });

    // door frame
    px(DOOR.x - 4, DOOR.y, DOOR.w + 8, DOOR.h + 4, '#ffd23f');
    for (let i = 0; i < 5; i++) {
      px(DOOR.x - 4 + i * 3, DOOR.y, 2, 2, '#e6a100');
      px(DOOR.x - 4 + i * 3, DOOR.y + DOOR.h + 2, 2, 2, '#e6a100');
    }
    px(DOOR.x, DOOR.y + 2, DOOR.w, DOOR.h, '#2d3a6b');
    px(DOOR.x + 4, DOOR.y + 4, DOOR.w - 8, DOOR.h - 8, '#3d4f8b');
    px(DOOR.x + DOOR.w / 2 - 2, DOOR.y + 2, 4, DOOR.h, '#1a0800');

    ctx.fillStyle = '#ffd23f';
    ctx.font = 'bold 5px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', DOOR.x + DOOR.w / 2, DOOR.y + DOOR.h + 14);

    // lock indicator
    const allSolved = state.solved.length >= ER.puzzles.length;
    const lx0 = DOOR.x + DOOR.w / 2;
    const ly0 = DOOR.y + DOOR.h + 20;
    if (allSolved) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 4);
      ctx.save(); ctx.globalAlpha = 0.3 + 0.4 * pulse;
      circle(lx0, ly0, 8, '#00e676'); ctx.globalAlpha = 1; ctx.restore();
      circle(lx0, ly0, 6, '#00c853');
    } else {
      circle(lx0, ly0, 6, '#555');
    }
    ctx.strokeStyle = allSolved ? '#fff' : '#999'; ctx.lineWidth = 1;
    for (let a = 0; a < 6; a++) {
      const ang = (a / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(lx0 + Math.cos(ang) * 2, ly0 + Math.sin(ang) * 2);
      ctx.lineTo(lx0 + Math.cos(ang) * 5, ly0 + Math.sin(ang) * 5);
      ctx.stroke();
    }
    circle(lx0, ly0, 2, allSolved ? '#b9f6ca' : '#777');

    // 6 LED lights above door
    const ledX = [128, 138, 148, 158, 168, 178];
    ledX.forEach((lx2, i) => {
      const on = i < state.solved.length;
      circle(lx2, 10, 3, on ? '#ffd23f' : '#3e2008');
      if (on) { ctx.save(); ctx.globalAlpha = 0.3; circle(lx2, 10, 5, '#ffd23f'); ctx.restore(); }
    });
    ctx.textAlign = 'left';
  }

  function drawPool(t) {
    const { x, y, r } = POOL;
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath(); ctx.ellipse(x, y + 4, r + 2, r - 2, 0, 0, Math.PI * 2); ctx.fill();
    circle(x, y, r, '#3e2723');
    circle(x, y, r - 2, '#4e342e');
    const specimens = ['#ef5350','#ffd54f','#7e57c2','#78909c','#a5d6a7','#ff8a65'];
    specimens.forEach((col, i) => {
      const angle = t * 0.5 + i * Math.PI / 3;
      const sx = x + Math.cos(angle) * (r - 7);
      const sy = y + Math.sin(angle) * (r - 7);
      circle(sx, sy, 3, col);
    });
    circle(x, y, 4, '#6d4c41');
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.font = 'bold 5px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Samples', x, y + r + 8);
    ctx.textAlign = 'left';
  }

  // ── Station art ─────────────────────────────────────────────────────────
  const STATION_ART = {
    planets(x, y) {
      const planets = [
        { r: 3, col: '#9e9e9e', ox: -10, oy: -6 },
        { r: 4, col: '#ffd54f', ox:  6,  oy: -10 },
        { r: 5, col: '#1565c0', ox: 12,  oy:  6  },
        { r: 3, col: '#bf360c', ox: -6,  oy: 10  },
      ];
      const cx = x + 16, cy = y + 16;
      circle(cx, cy, 2, '#fff9c4');
      planets.forEach(p => circle(cx + p.ox, cy + p.oy, p.r, p.col));
    },
    rockcycle(x, y) {
      const cx = x + 16, cy = y + 16;
      ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, 10, 0.3, Math.PI * 2 - 0.3); ctx.stroke();
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath();
      ctx.moveTo(cx + 8, cy - 6); ctx.lineTo(cx + 12, cy - 2); ctx.lineTo(cx + 4, cy - 2);
      ctx.fill();
      [[cx + 10, cy], [cx - 7, cy - 7], [cx - 7, cy + 7]].forEach(([dx, dy], i) => {
        circle(dx, dy, 2.5, ['#ef5350','#ffd54f','#7e57c2'][i]);
      });
    },
    minerals(x, y) {
      const cx = x + 16, cy = y + 16;
      [[cx - 6, cy + 2, 10, '#ce93d8'], [cx + 4, cy - 2, 8, '#7e57c2'], [cx, cy + 8, 6, '#ab47bc']].forEach(([bx, by, h, col]) => {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(bx, by); ctx.lineTo(bx - 3, by - h); ctx.lineTo(bx + 3, by - h); ctx.closePath();
        ctx.fill();
      });
      px(cx - 8, cy + 4, 16, 3, '#4e342e');
    },
    layers(x, y) {
      const bands  = ['#ffd54f','#ef5350','#b71c1c','#880e4f'];
      const labels = ['C','M','O','I'];
      bands.forEach((col, i) => {
        const bw = 28 - i * 6;
        const bx = x + 2 + i * 3;
        const by = y + 4 + i * 7;
        px(bx, by, bw, 6, col);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 4px Fredoka, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(labels[i], bx + 1, by + 5);
      });
      ctx.textAlign = 'left';
    },
    rocktypes(x, y) {
      px(x + 2,  y + 6, 8, 20, '#ef5350');
      px(x + 12, y + 6, 8, 20, '#ffd54f');
      px(x + 22, y + 6, 8, 20, '#7e57c2');
      for (let i = 0; i < 3; i++) px(x + 12, y + 10 + i * 5, 8, 1, '#f9a825');
      ctx.fillStyle = '#fff'; ctx.font = 'bold 4px Fredoka, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('I', x + 6, y + 28); ctx.fillText('S', x + 16, y + 28); ctx.fillText('M', x + 26, y + 28);
      ctx.textAlign = 'left';
    },
    planetquiz(x, y, t) {
      px(x + 14, y + 22, 4, 8, '#795548');
      ctx.strokeStyle = '#795548'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + 16, y + 28); ctx.lineTo(x + 6, y + 30); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 16, y + 28); ctx.lineTo(x + 26, y + 30); ctx.stroke();
      const ang = Math.sin(t * 0.4) * 0.15;
      ctx.save(); ctx.translate(x + 16, y + 22); ctx.rotate(ang);
      px(-12, -4, 24, 8, '#607d8b');
      px(-14, -3, 4, 6, '#546e7a');
      px(10, -2, 5, 4, '#90a4ae');
      ctx.restore();
    },
  };

  function drawStation(id, t) {
    const s = STATIONS[id];
    const solved = state.solved.includes(id);
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath(); ctx.ellipse(s.x + 16, s.y + 34, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
    // bench bottom
    px(s.x, s.y + 28, 32, 4, '#3e2723');
    // bench body
    px(s.x, s.y, 32, 28, '#4e342e');
    // bench top highlight
    px(s.x, s.y, 32, 4, '#6d4c41');
    // glow frame if solved
    if (solved) {
      ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.rect(s.x - 1, s.y - 1, 34, 30); ctx.stroke();
    }
    // art
    if (STATION_ART[id]) STATION_ART[id](s.x, s.y, t);
    // label
    ctx.fillStyle = solved ? '#ffd23f' : '#d7ccc8';
    ctx.font = 'bold 5px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    const labels = { planets: 'Planets', rockcycle: 'Rock Cycle', minerals: 'Minerals', layers: 'Layers', rocktypes: 'Rock Types', planetquiz: 'Planet Quiz' };
    ctx.fillText(labels[id] || id, s.x + 16, s.y + 38);
    ctx.textAlign = 'left';
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    drawFloor();
    drawWalls(t);
    drawPool(t);

    Object.keys(STATIONS).forEach(id => drawStation(id, t));
    // centre counter label
    ctx.fillStyle = '#a1887f';
    ctx.font = 'bold 6px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Field Notes', 160, 178);
    ctx.textAlign = 'left';

    // player shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath(); ctx.ellipse(player.x, player.y + 2, 6, 3, 0, 0, Math.PI * 2); ctx.fill();

    // draw player
    const { x, y, dir, anim } = player;
    const px2 = Math.round(x - 6), py2 = Math.round(y - 14);
    let spr;
    if (dir === 'down')       spr = SPR.down[Math.floor(anim * 4) % 4];
    else if (dir === 'up')    spr = SPR.up[Math.floor(anim * 4) % 4];
    else if (dir === 'right') spr = SPR.right[Math.floor(anim * 4) % 2];
    else                      spr = SPR.left[Math.floor(anim * 4) % 2];
    ctx.drawImage(spr, px2, py2);

    // interaction hint
    const n = nearest();
    if (n && !modalOpen()) {
      ctx.save(); ctx.globalAlpha = 0.85;
      ctx.fillStyle = '#ffd23f';
      ctx.font = 'bold 6px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      const label = n === 'door' ? 'EXIT  [E]' : `[E] ${n}`;
      ctx.fillText(label, player.x, player.y - 18);
      ctx.restore();
    }
    ctx.textAlign = 'left';
  }

  // ── Update ──────────────────────────────────────────────────────────────
  const held = { clear() { for (const k in this) if (k !== 'clear') delete this[k]; } };
  window.addEventListener('keydown', (e) => { held[e.key] = true; });
  window.addEventListener('keyup',   (e) => { delete held[e.key]; });

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!roomView.hidden) {
      if (!modalOpen()) update(dt);
      draw(now / 1000);
    }
    if (state.timerOn) {
      state.elapsed = (Date.now() - state.startTime) / 1000;
      const txt = fmtTime(state.elapsed);
      if (hudTime.textContent !== txt) hudTime.textContent = txt;
    }
    requestAnimationFrame(frame);
  }
  const fmtTime = (s) => { s = Math.floor(s); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };

  function update(dt) {
    const SPEED = 60;
    let dx = 0, dy = 0;

    if (player.target) {
      const cdx = player.target.x - player.x;
      const cdy = player.target.y - player.y;
      const dist = Math.hypot(cdx, cdy);
      if (dist < 3) {
        const pend = player.pendingOpen;
        player.target = null;
        player.pendingOpen = null;
        if (pend && nearest() === pend) openScene(pend);
      } else {
        dx = (cdx / dist) * SPEED * dt;
        dy = (cdy / dist) * SPEED * dt;
      }
    }

    if (held['ArrowLeft']  || held['a'] || held['A']) { dx -= SPEED * dt; player.target = null; }
    if (held['ArrowRight'] || held['d'] || held['D']) { dx += SPEED * dt; player.target = null; }
    if (held['ArrowUp']    || held['w'] || held['W']) { dy -= SPEED * dt; player.target = null; }
    if (held['ArrowDown']  || held['s'] || held['S']) { dy += SPEED * dt; player.target = null; }

    const moving = dx !== 0 || dy !== 0;
    if (moving) {
      if (Math.abs(dx) >= Math.abs(dy)) player.dir = dx > 0 ? 'right' : 'left';
      else                               player.dir = dy > 0 ? 'down'  : 'up';
      player.anim += dt;
      player.stepT = (player.stepT || 0) + dt;
      if (player.stepT > 0.28) { player.stepT = 0; sfx.step(); }
      if (!blocked(player.x + dx, player.y)) player.x += dx;
      if (!blocked(player.x, player.y + dy)) player.y += dy;
    } else {
      player.anim = 0;
    }
    player.moving = moving;
  }

  // ── Notes ───────────────────────────────────────────────────────────────
  function codeTiles(code) {
    return el('span', { class: 'code-tiles' },
      el('span', { class: 'tile letter' }, el('small', {}, 'letter'), code.letter),
      el('span', { class: 'tile number' }, el('small', {}, 'number'), String(code.number)));
  }
  ER.codeTiles = codeTiles;

  function renderNotes(newId) {
    if (!notesList) return;
    notesList.innerHTML = '';
    ER.puzzles.forEach((def) => {
      const solved = state.solved.includes(def.id);
      notesList.append(el('li', { class: 'note' + (solved ? ' solved' : '') + (def.id === newId ? ' new' : '') },
        el('span', { class: 'note-icon' }, def.icon),
        el('div', { class: 'note-text' },
          el('b', {}, def.title),
          solved ? null : el('span', { class: 'note-missing' }, 'Code not found yet')),
        solved ? codeTiles(def.code) : el('span', { class: 'code-tiles empty' },
          el('span', { class: 'tile' }, '?'), el('span', { class: 'tile' }, '?'))));
    });
    if (hudCodes) hudCodes.textContent = `${state.solved.length} / ${ER.puzzles.length}`;
  }

  // ── Scenes ──────────────────────────────────────────────────────────────
  function openScene(id) {
    const def = id === 'door' ? ER.door : ER.get(id);
    if (!def || modalOpen()) return;
    sfx.unlock(); sfx.open();
    held.clear(); player.target = null; player.pendingOpen = null;
    state.current = id;
    roomView.hidden = true; puzzleView.hidden = false; puzzleView.innerHTML = '';

    const head = el('header', { class: 'scene-head kind-' + def.kind },
      el('button', { class: 'btn btn-back', onclick: closeScene }, '⬅ Back to station'),
      el('div', { class: 'scene-title' },
        el('span', { class: 'scene-icon' }, def.icon),
        el('div', {}, el('h2', {}, def.title), el('p', {}, def.tagline))),
      el('div', { class: 'tools' }));

    const banner = state.solved.includes(id) && id !== 'door'
      ? el('div', { class: 'solved-banner' }, el('span', {}, '✅ Already solved! Your code is in your Field Notes:'), codeTiles(def.code))
      : null;
    const body = el('div', { class: 'scene-body' });
    const scene = el('div', { class: 'scene kind-' + def.kind }, head, banner, body);
    puzzleView.append(scene);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const api = {
      sfx,
      alreadySolved: state.solved.includes(id),
      solve: () => solvePuzzle(def),
      codes: () => state.solved.map((sid) => ER.get(sid)).filter(Boolean),
      missing: () => ER.puzzles.filter((p) => !state.solved.includes(p.id)),
      allDone: state.solved.length === ER.puzzles.length,
      escape: showEscape,
    };
    try {
      state.cleanup = def.build(body, api) || null;
    } catch (err) {
      console.error(err);
      body.append(el('p', { class: 'feedback bad' }, 'This station had a problem loading. Go back and try again.'));
    }
  }

  function closeScene() {
    if (state.cleanup) { try { state.cleanup(); } catch (e) { console.error(e); } }
    state.cleanup = null; state.current = null;
    puzzleView.hidden = true; puzzleView.innerHTML = '';
    roomView.hidden = false;
    sfx.back(); canvas.focus();
  }
  ER.closeScene = closeScene;

  function solvePuzzle(def) {
    if (state.solved.includes(def.id)) return;
    state.solved.push(def.id);
    renderNotes(def.id);
    sfx.solve();
    setTimeout(() => {
      const count = state.solved.length;
      const total = ER.puzzles.length;
      const content = el('div', { class: 'reward' },
        el('div', { class: 'reward-burst' }, '🎉'),
        el('p', { class: 'reward-lead' }, 'You found a code! It has been saved in your Field Notes.'),
        el('div', { class: 'reward-tiles' }, codeTiles(def.code)),
        def.fact ? el('div', { class: 'fact-card' }, el('b', {}, '🪨 Did you know? '), def.fact) : null,
        el('p', { class: 'muted small' }, count === total
          ? '🚪 That\'s all 6 codes! Head to the EXIT at the top of the station!'
          : `${count} of ${total} codes found. Keep going!`));
      ER.modal({
        title: `${def.icon} ${def.title} solved!`,
        content,
        className: 'reward-modal',
        buttons: [
          { label: '⬅ Back to the station', class: 'btn-aqua btn-big', onClick: closeScene },
          { label: 'Stay here', class: 'btn-light' },
        ],
      });
    }, 650);
  }

  // ── Escape screen ────────────────────────────────────────────────────────
  function showEscape() {
    if (state.timerOn) state.elapsed = (Date.now() - state.startTime) / 1000;
    state.escaped = true; state.timerOn = false;
    sfx.escape();
    const confetti = el('div', { class: 'confetti', 'aria-hidden': 'true' });
    const colors = ['#ffd23f', '#ef5350', '#7e57c2', '#e64a19', '#78909c', '#a5d6a7'];
    for (let i = 0; i < 70; i++) {
      confetti.append(el('i', { style: {
        left: Math.random() * 100 + '%',
        background: colors[i % colors.length],
        animationDelay: Math.random() * 2.5 + 's',
        animationDuration: 2.5 + Math.random() * 2 + 's',
        transform: `rotate(${Math.random() * 360}deg)`,
      } }));
    }
    const content = el('div', { class: 'escape-content' },
      confetti,
      el('div', { class: 'escape-swimmers', 'aria-hidden': 'true' },
        el('span', { class: 'swim s1', html: ER.art.planet }),
        el('span', { class: 'swim s2', html: ER.art.crystal }),
        el('span', { class: 'swim s3', html: ER.art.rock })),
      el('h2', { class: 'escape-title' }, 'YOU ESCAPED!'),
      el('p', { class: 'escape-time' }, `⏱️ Your time: ${fmtTime(state.elapsed)}`),
      el('div', { class: 'answer-word' }, ...'BASALT'.split('').map((c) => el('span', {}, c))),
      el('div', { class: 'fact-card' },
        el('b', {}, '🪨 BASALT: '),
        'Basalt is the most common igneous rock in the solar system. It forms when lava erupts and cools rapidly at the surface — its fine-grained texture is because the crystals had no time to grow large. Basalt covers the floors of Earth\'s oceans, the plains of Mars, the surface of Venus, and the dark \'maria\' of the Moon. The terrestrial planets are all made of silicate rock with iron-rich cores, and basalt is often the first rock formed when any of them are geologically active.'),
      el('p', { class: 'muted' }, 'You decoded a Vigenère cipher and proved you understand rocks, minerals, and the composition of the terrestrial planets. Show your teacher this screen!'));
    ER.modal({
      content,
      className: 'escape-modal',
      dismissable: false,
      buttons: [
        { label: '⬅ Back to the station', class: 'btn-light', onClick: closeScene },
        { label: '🔁 Play again', class: 'btn-sun btn-big', onClick: () => location.reload() },
      ],
    });
  }

  // ── Intro ────────────────────────────────────────────────────────────────
  function showIntro(first) {
    const content = el('div', { class: 'intro' },
      el('div', { class: 'intro-art', 'aria-hidden': 'true' },
        el('span', { html: ER.art.planet }),
        el('span', { html: ER.art.rock }),
        el('span', { html: ER.art.crystal })),
      el('p', { class: 'intro-story' },
        'You are a Year 9 geologist at ', el('b', {}, 'Rocky Research Station'),
        '. Dr T. Ectonics has locked the exit — it will only open when you prove your understanding of rocks, minerals, and the composition of the terrestrial planets.'),
      el('ul', { class: 'intro-steps' },
        el('li', {}, el('span', {}, '🚶'), el('div', {}, el('b', {}, 'Explore the station. '), 'Walk with ', el('kbd', {}, 'WASD'), ' / ', el('kbd', {}, 'Arrow keys'), ', or click the floor.')),
        el('li', {}, el('span', {}, '🧩'), el('div', {}, el('b', {}, 'Solve 6 stations. '), 'Walk up to a bench and press ', el('kbd', {}, 'E'), ' or click it. Do them in any order.')),
        el('li', {}, el('span', {}, '📓'), el('div', {}, el('b', {}, 'Collect codes. '), 'Each station gives a letter and a number, saved in your Field Notes on the right.')),
        el('li', {}, el('span', {}, '🚪'), el('div', {}, el('b', {}, 'Escape! '), 'Take all 6 codes to the EXIT and decode the password. Check your Field Notes for everything you need.'))),
      el('p', { class: 'muted small' }, '⚠️ Progress is only saved while this tab is open — don\'t refresh!'));
    ER.modal({
      title: first ? '🪨 Welcome to Rocky Research Station!' : '❓ How to play',
      content,
      className: 'intro-modal',
      dismissable: !first,
      buttons: [{ label: first ? '🔬 Let\'s go!' : 'Got it!', class: 'btn-sun btn-big', onClick: () => {
        sfx.unlock();
        if (!state.timerOn && !state.escaped) { state.timerOn = true; state.startTime = Date.now() - state.elapsed * 1000; }
        canvas.focus();
      }}],
    });
  }

  // ── Input wiring ─────────────────────────────────────────────────────────
  window.addEventListener('keydown', (e) => {
    if ((e.key === 'e' || e.key === 'E') && !roomView.hidden && !modalOpen()) {
      const n = nearest();
      if (n) openScene(n);
    }
  });

  canvas.addEventListener('click', (e) => {
    if (modalOpen() || roomView.hidden) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / S;
    const my = (e.clientY - rect.top)  / S;
    // click on a station
    for (const [id, s] of Object.entries(STATIONS)) {
      if (mx >= s.x && mx <= s.x + 32 && my >= s.y && my <= s.y + 32) {
        sfx.tap(); openScene(id); return;
      }
    }
    // click on door area
    if (mx >= DOOR.x && mx <= DOOR.x + DOOR.w && my >= DOOR.y && my <= DOOR.y + DOOR.h + 30) {
      openScene('door'); return;
    }
    // click to move
    player.target = { x: mx, y: my };
    player.pendingOpen = null;
  });

  const soundBtn = document.getElementById('btn-sound');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      sfx.setMuted(!sfx.muted);
      soundBtn.textContent = sfx.muted ? '🔇' : '🔊';
      if (!sfx.muted) sfx.tap();
    });
  }
  document.getElementById('btn-help')?.addEventListener('click', () => showIntro(false));

  window.addEventListener('beforeunload', (e) => {
    if (state.solved.length && !state.escaped) { e.preventDefault(); e.returnValue = ''; }
  });

  // ── Floating dust particles ──────────────────────────────────────────────
  const bubblesEl = document.getElementById('bubbles');
  if (bubblesEl) {
    for (let i = 0; i < 22; i++) {
      const b = document.createElement('div');
      b.className = 'bubble';
      b.style.cssText = [
        `left:${Math.random() * 100}%`,
        `width:${3 + Math.random() * 4}px`,
        `height:${3 + Math.random() * 4}px`,
        `animation-delay:${Math.random() * 8}s`,
        `animation-duration:${6 + Math.random() * 6}s`,
        `opacity:${0.15 + Math.random() * 0.2}`,
      ].join(';');
      bubblesEl.appendChild(b);
    }
  }

  // ── Init ─────────────────────────────────────────────────────────────────
  canvas.tabIndex = 0;
  renderNotes();
  requestAnimationFrame(frame);
  showIntro(true);

  ER._debug = {
    state,
    solveAll() { ER.puzzles.forEach(p => { if (!state.solved.includes(p.id)) state.solved.push(p.id); }); renderNotes(); },
    openScene,
    player,
  };
})();
