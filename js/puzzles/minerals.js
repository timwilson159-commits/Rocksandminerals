/* Puzzle 3: Mineral Lab — identify minerals from their properties using a reference table. Code: S-3 */
ER.register({
  id: 'minerals',
  title: 'Mineral Lab',
  icon: '💎',
  kind: 'paper',
  tagline: 'Use the mineral properties table to answer identification questions',
  code: { letter: 'S', number: 3 },
  hints: [
    'Use the properties table carefully. Streak is the colour of the powdered mineral (scratch on a streak plate). Lustre describes how it reflects light (metallic = shiny like metal; vitreous = glassy). Hardness is on the Mohs scale: fingernail ≈ 2.5, copper coin ≈ 3.5, glass ≈ 5.5, steel file ≈ 6.5.',
    'Cleavage is splitting along flat planes of atomic weakness (think of mica peeling apart). Fracture is a rough, irregular break. "Fizzes with acid" is a carbonate reaction — only calcite does this among common minerals.',
  ],
  fact: 'The Mohs hardness scale (1–10) was invented by German mineralogist Friedrich Mohs in 1812. It ranks minerals by scratch resistance: talc (1) is the softest and diamond (10) is the hardest. Every mineral on the scale can scratch all minerals with a lower number. Quartz (7) is so common and hard that it scratches window glass (5.5) and steel — which is why quartz sand is so abrasive and slowly wears down rocks it contacts.',
  build(body, api) {
    const { el } = ER;

    // Reference table
    const TABLE_DATA = [
      { mineral: 'Quartz',   hardness: '7',     streak: 'White',      lustre: 'Vitreous (glassy)',   notes: 'Very common; can scratch glass and steel' },
      { mineral: 'Feldspar', hardness: '6',     streak: 'White',      lustre: 'Vitreous',            notes: 'Most abundant mineral in Earth\'s crust; two flat cleavage faces' },
      { mineral: 'Calcite',  hardness: '3',     streak: 'White',      lustre: 'Vitreous',            notes: 'Fizzes with dilute acid (HCl); main mineral in limestone' },
      { mineral: 'Pyrite',   hardness: '6.5',   streak: 'Black',      lustre: 'Metallic',            notes: 'Cubic crystals; called "fool\'s gold" (shiny gold colour but black streak)' },
      { mineral: 'Mica',     hardness: '2.5',   streak: 'White',      lustre: 'Pearly',              notes: 'Perfect cleavage — splits into very thin flat sheets' },
      { mineral: 'Olivine',  hardness: '6.5–7', streak: 'White',      lustre: 'Vitreous',            notes: 'Olive-green colour; very common in Earth\'s upper mantle' },
    ];

    const tbl = el('table', { class: 'answer-table', style: { width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' } });
    const thead = el('tr', {});
    ['Mineral', 'Hardness', 'Streak', 'Lustre', 'Notes'].forEach(h => thead.append(el('th', { style: { background: '#fff3e0', padding: '6px 8px', border: '2px solid #b8c7de', textAlign: 'left' } }, h)));
    tbl.append(thead);
    TABLE_DATA.forEach(row => {
      const tr = el('tr', {});
      [row.mineral, row.hardness, row.streak, row.lustre, row.notes].forEach(val =>
        tr.append(el('td', { style: { padding: '5px 8px', border: '1px solid #e0e0e0', verticalAlign: 'top' } }, val)));
      tbl.append(tr);
    });

    body.append(el('div', { class: 'card intro-card' },
      el('p', {}, '💎 Use the mineral properties table below to answer the identification questions. You can refer back to the table at any time.'),
      el('div', { class: 'table-scroll' }, tbl)));

    const questions = [
      {
        q: 'Which mineral fizzes when a drop of dilute hydrochloric acid (HCl) is added to it?',
        opts: ['Quartz', 'Calcite', 'Pyrite', 'Mica'],
        a: 'Calcite',
        why: 'Calcite (CaCO₃) reacts with acid to release carbon dioxide gas — this fizzing is a key field test for limestone and marble. The reaction is: CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂.',
      },
      {
        q: 'A mineral has a shiny gold colour, metallic lustre, a BLACK streak, and forms cubic crystals. What is it?',
        opts: ['Gold', 'Pyrite', 'Feldspar', 'Olivine'],
        a: 'Pyrite',
        why: 'Pyrite (FeS₂) is called "fool\'s gold" because it looks gold-coloured, but its streak is black — real gold has a golden streak. The streak test is one of the best ways to tell them apart in the field.',
      },
      {
        q: 'Which mineral in the table has the HIGHEST hardness on the Mohs scale?',
        opts: ['Feldspar', 'Olivine', 'Quartz', 'Pyrite'],
        a: 'Quartz',
        why: 'Quartz has hardness 7, the highest in this table. It is harder than feldspar (6), pyrite (6.5) and olivine (6.5–7 — the minimum of olivine\'s range is 6.5, which is less than 7). Quartz can scratch all of these.',
      },
      {
        q: 'What property describes the way a mineral splits along flat, smooth surfaces due to planes of weakness in its crystal structure?',
        opts: ['Fracture', 'Lustre', 'Hardness', 'Cleavage'],
        a: 'Cleavage',
        why: 'Cleavage is splitting along flat planes where atomic bonds are weakest. Mica has perfect cleavage — it splits into flat, flexible sheets. Fracture is an irregular, rough break that does NOT follow flat planes.',
      },
      {
        q: 'Which mineral is thought to be the MOST ABUNDANT mineral in Earth\'s upper mantle?',
        opts: ['Calcite', 'Quartz', 'Feldspar', 'Olivine'],
        a: 'Olivine',
        why: 'The upper mantle is made of iron-magnesium silicate rock, and olivine is the dominant mineral. Despite being common deep underground, olivine is relatively rare at the surface because it weathers quickly. It\'s also found in meteorites.',
      },
      {
        q: 'Which mineral is the MOST ABUNDANT in Earth\'s continental crust?',
        opts: ['Quartz', 'Mica', 'Feldspar', 'Calcite'],
        a: 'Feldspar',
        why: 'Feldspar makes up roughly 60% of Earth\'s continental crust. It is found in granite, sandstone (as grains), and many other rocks. When feldspar weathers, it produces clay minerals — one reason soils form above granite-rich areas.',
      },
    ];

    body.append(el('div', { class: 'card' },
      el('h4', {}, '🔍 Mineral identification questions'),
      ER.quizSeq(questions, () => api.solve())));

    return null;
  },
});
