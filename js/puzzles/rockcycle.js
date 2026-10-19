/* Puzzle 2: Rock Cycle Journey — interactive game guiding a rock through the cycle. Code: L-2 */
ER.register({
  id: 'rockcycle',
  title: 'Rock Cycle Journey',
  icon: '🔄',
  kind: 'game',
  tagline: 'Guide your rock through the complete rock cycle',
  code: { letter: 'L', number: 2 },
  hints: [
    'The rock cycle has three main rock types: Igneous (from cooling magma/lava), Sedimentary (from compressed sediment), and Metamorphic (from heat + pressure). Magma is molten rock underground; lava is magma that has erupted at the surface.',
    'Think about each process: weathering & erosion BREAKS rocks apart → sediment. Compaction & cementation BUILDS sedimentary rock. Heat & pressure CHANGES rock into metamorphic. Melting CREATES magma. Cooling CREATES igneous rock.',
  ],
  fact: 'The rock cycle has no beginning or end — any rock can become any other type given enough time. Basalt (an igneous rock) weathers to form sediment, which compacts into sandstone (sedimentary), which can be metamorphosed into quartzite (metamorphic), which can melt into magma, which cools back into basalt. A single atom of silicon might have cycled through all three rock types many times over the history of Earth!',
  build(body, api) {
    const { el, sfx } = ER;

    const STAGES = [
      {
        type: 'magma', label: 'Magma',
        process: 'The magma rises through a volcano and cools rapidly on the surface.',
        question: 'What type of rock forms when magma cools?',
        correct: 'Igneous rock',
        wrong: ['Sedimentary rock', 'Metamorphic rock'],
        explain: 'When magma or lava cools and solidifies, it forms IGNEOUS rock. Rapid cooling at the surface produces fine-grained rocks like basalt.',
      },
      {
        type: 'igneous', label: 'Igneous Rock',
        process: 'Rain, wind and ice slowly break the igneous rock into tiny fragments over thousands of years.',
        question: 'What does weathering and erosion produce?',
        correct: 'Sediment',
        wrong: ['Metamorphic rock', 'More magma'],
        explain: 'Weathering and erosion break rock into small fragments called SEDIMENT (sand, gravel, clay). This sediment is then carried away by rivers and deposited.',
      },
      {
        type: 'sediment', label: 'Sediment',
        process: 'The sediment is buried under more layers and squeezed tightly. Minerals crystallise between the grains and cement them together.',
        question: 'What type of rock forms from compaction and cementation of sediment?',
        correct: 'Sedimentary rock',
        wrong: ['Igneous rock', 'Metamorphic rock'],
        explain: 'Compaction (pressure from overlying layers) and cementation (minerals gluing grains together) turn loose sediment into SEDIMENTARY rock, like sandstone or limestone.',
      },
      {
        type: 'sedimentary', label: 'Sedimentary Rock',
        process: 'The sedimentary rock is buried deep underground where it is squeezed and heated — but not quite enough to melt.',
        question: 'What type of rock forms from intense heat and pressure (without melting)?',
        correct: 'Metamorphic rock',
        wrong: ['Magma', 'Igneous rock'],
        explain: 'When rocks are exposed to great heat and pressure without melting, their minerals recrystallise into a new arrangement — forming METAMORPHIC rock. Limestone becomes marble; sandstone becomes quartzite.',
      },
      {
        type: 'metamorphic', label: 'Metamorphic Rock',
        process: 'The temperature gets so high that the metamorphic rock melts completely.',
        question: 'What is produced when rock melts underground?',
        correct: 'Magma',
        wrong: ['Lava', 'Sediment'],
        explain: 'MAGMA is molten rock found underground. When magma erupts through a volcano, it becomes LAVA. Both cool to form igneous rock — completing the cycle!',
      },
      {
        type: 'magma', label: 'Magma',
        process: 'The magma erupts and cools very rapidly at the surface, forming a new igneous rock.',
        question: 'Which igneous rock forms specifically from rapid cooling of lava at the surface?',
        correct: 'Basalt',
        wrong: ['Granite', 'Quartzite'],
        explain: 'BASALT forms when lava cools rapidly at the surface. Its crystals are too small to see without a microscope. GRANITE also forms from magma but cools slowly underground, giving crystals time to grow large. QUARTZITE is a metamorphic rock, not igneous.',
      },
    ];

    body.append(el('div', { class: 'card intro-card' },
      el('p', {}, '🔄 Guide your rock through the complete rock cycle! Answer 6 questions to track its journey from magma to igneous rock, through sedimentary, metamorphic, and back to magma again.'),
      el('p', { class: 'muted small', html: '💡 Key terms: <span class="term">igneous</span>, <span class="term">sedimentary</span>, <span class="term">metamorphic</span>, <span class="term">magma</span>, <span class="term">weathering</span>, <span class="term">erosion</span>, <span class="term">compaction</span>' })));

    const gameCard = el('div', { class: 'card' });
    body.append(gameCard);

    let stage = 0;

    function renderStage() {
      gameCard.innerHTML = '';
      if (stage >= STAGES.length) { showWin(); return; }

      const s = STAGES[stage];
      const progressPct = (stage / STAGES.length) * 100;
      const opts = ER.shuffle([s.correct, ...s.wrong]);
      const fb = el('p', { class: 'feedback' });

      gameCard.append(
        el('div', { class: 'rc-game' },
          el('div', { class: 'rc-stage-header' },
            el('span', { class: `rc-rock-badge ${s.type}` }, `🪨 ${s.label}`),
            el('span', { class: 'rc-progress' }, `Stage ${stage + 1} of ${STAGES.length}`)),
          el('div', { class: 'rc-progress-bar' },
            el('div', { class: 'rc-progress-fill', style: { width: progressPct + '%' } })),
          el('div', { class: 'card intro-card' },
            el('p', { class: 'rc-process' }, `⚙️ Process: ${s.process}`),
            el('p', {}, el('b', {}, s.question))),
          el('div', { class: 'rc-choices' },
            ...opts.map((opt) => {
              const btn = el('button', { class: 'btn btn-light' }, opt);
              btn.addEventListener('click', () => {
                if (opt === s.correct) {
                  sfx.good();
                  btn.classList.add('btn-aqua');
                  btn.disabled = true;
                  gameCard.querySelectorAll('.rc-choices .btn').forEach(b => b.disabled = true);
                  ER.say(fb, `✅ Correct! ${s.explain}`, 'good');
                  setTimeout(() => { stage++; renderStage(); }, 1800);
                } else {
                  sfx.bad();
                  btn.style.opacity = '0.4';
                  btn.disabled = true;
                  ER.say(fb, `❌ Not quite. Think about what process is happening. Try again!`, 'bad');
                }
              });
              return btn;
            })),
          fb));
    }

    function showWin() {
      gameCard.append(
        el('div', { class: 'rc-win' },
          el('div', { style: { fontSize: '3rem' } }, '🎉'),
          el('h3', {}, 'Rock Cycle Complete!'),
          el('p', {}, 'You guided your rock through the complete rock cycle — from magma to igneous, sedimentary, metamorphic, and back to magma again.'),
          el('p', { class: 'rc-rock-badge igneous', style: { display: 'inline-block', marginTop: '8px' } }, '🪨 Final rock: Basalt'),
          el('div', { class: 'row-center', style: { marginTop: '16px' } },
            el('button', { class: 'btn btn-sun btn-big', onclick: () => api.solve() }, '🏆 Claim my code!'))));
    }

    renderStage();
    return null;
  },
});
