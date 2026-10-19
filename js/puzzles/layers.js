/* Puzzle 4: Earth Layers — sort Earth's layers then answer questions about planetary differentiation. Code: N-4 */
ER.register({
  id: 'layers',
  title: 'Earth Layers',
  icon: '🌍',
  kind: 'game',
  tagline: 'Sort Earth\'s layers and explore planetary differentiation',
  code: { letter: 'N', number: 4 },
  hints: [
    'Earth\'s layers from the outside in: CRUST (thin, silicate rock), MANTLE (thick, iron-magnesium silicate), OUTER CORE (liquid iron-nickel — generates our magnetic field), INNER CORE (solid iron-nickel — under massive pressure). Think of Earth like a hard-boiled egg: shell = crust, white = mantle, yolk = core.',
    'Planetary DIFFERENTIATION happened because the early Earth was hot enough to melt. Denser iron sank toward the centre (gravity pulls heavy things down), while lighter silicate rock floated to the top — just like oil floats on water. All terrestrial planets underwent this process.',
  ],
  fact: 'We have never drilled deeper than about 12 km into Earth — yet Earth\'s radius is over 6,370 km. Almost everything we know about Earth\'s interior comes from studying seismic waves (vibrations from earthquakes). S-waves (shear waves) cannot travel through liquids, so the fact that they don\'t arrive on the opposite side of Earth from an earthquake tells us the outer core is liquid. P-waves (pressure waves) travel through solids and liquids but bend at boundaries, revealing the different layers.',
  build(body, api) {
    const { el, sfx } = ER;

    body.append(el('div', { class: 'card intro-card' },
      el('p', {}, '🌍 This station has two parts. Complete both to earn your code.'),
      el('ol', {},
        el('li', {}, el('b', {}, 'Sort'), ' Earth\'s four layers into the correct order from the surface to the centre.'),
        el('li', {}, el('b', {}, 'Answer'), ' two questions about planetary differentiation.'))));

    const stageWrap = el('div', { class: 'stage-wrap' });
    body.append(stageWrap);

    function buildStage1() {
      // Visual Earth cross-section diagram
      const diagram = el('div', { class: 'earth-diagram', 'aria-hidden': 'true' },
        el('div', { class: 'earth-cs', title: 'Crust (outermost)' },
          el('div', { class: 'earth-cs-2', title: 'Mantle' },
            el('div', { class: 'earth-cs-3', title: 'Outer Core (liquid)' },
              el('div', { class: 'earth-cs-4', title: 'Inner Core (solid)' }, 'IC')))));

      const slots = [
        { label: '① Surface — thinnest layer (5–70 km)',               accept: 'crust'      },
        { label: '② Second layer — most massive (~2,900 km thick)',    accept: 'mantle'     },
        { label: '③ Third layer — liquid metal (~2,200 km thick)',     accept: 'outercore'  },
        { label: '④ Centre — solid metal (~1,200 km radius)',          accept: 'innercore'  },
      ];
      const cards = [
        { id: 'crust',     content: '🪨 Crust\nSilicate minerals (silicon + oxygen)\n5–70 km thick' },
        { id: 'mantle',    content: '🌋 Mantle\nIron-magnesium silicate rock\n~2,900 km thick — 84% of Earth\'s volume' },
        { id: 'outercore', content: '💧 Outer Core\nLiquid iron-nickel alloy\n~2,200 km thick — generates Earth\'s magnetic field' },
        { id: 'innercore', content: '⚙️ Inner Core\nSolid iron-nickel alloy\n~1,200 km radius — under extreme pressure' },
      ];

      stageWrap.append(
        el('div', { class: 'card' },
          el('h4', {}, 'Stage 1 of 2 — Order Earth\'s layers (surface → centre)'),
          diagram,
          ER.matchTask({
            slots, cards, layout: 'list',
            checkText: '✔ Check layer order',
            onSolved: () => {
              sfx.good();
              stageWrap.innerHTML = '';
              buildStage2();
            },
          })));
    }

    function buildStage2() {
      const questions = [
        {
          q: 'Why do all terrestrial planets (Mercury, Venus, Earth, Mars) have iron-rich cores?',
          opts: [
            'The Sun is mostly made of iron, and the planets absorbed it',
            'Iron asteroids crashed into the planets and sank to their centres',
            'As planets heated up during formation, denser iron sank to the centre while lighter silicate rock rose — a process called planetary differentiation',
            'Iron is the most abundant element in the solar system',
          ],
          a: 'As planets heated up during formation, denser iron sank to the centre while lighter silicate rock rose — a process called planetary differentiation',
          why: 'Planetary differentiation occurred because early planets were hot enough (from collisions and radioactive decay) to melt completely. Denser iron sank by gravity while lighter silicate minerals floated upward — the same way oil floats on water. This is why ALL terrestrial planets have metallic cores.',
        },
        {
          q: 'What is the key evidence scientists use to conclude that Earth\'s OUTER core is liquid (not solid)?',
          opts: [
            'Drilling has confirmed liquid metal at depth',
            'Volcanoes prove there is liquid rock inside Earth',
            'S-waves (shear waves) from earthquakes cannot travel through liquids, so they do not pass through the outer core — creating a "shadow zone"',
            'The outer core moves around, which would only happen if it were liquid',
          ],
          a: 'S-waves (shear waves) from earthquakes cannot travel through liquids, so they do not pass through the outer core — creating a "shadow zone"',
          why: 'S-waves require a solid medium to travel through. When a major earthquake occurs, seismometers on the opposite side of Earth receive P-waves but NOT S-waves. This S-wave "shadow zone" tells us the outer core is liquid. This is one of the most important discoveries in Earth science.',
        },
      ];

      stageWrap.append(
        el('div', { class: 'card' },
          el('h4', {}, 'Stage 2 of 2 — Planetary differentiation'),
          el('p', {}, 'Two questions between you and your code!'),
          ER.quizSeq(questions, () => api.solve())));
    }

    buildStage1();
    return null;
  },
});
