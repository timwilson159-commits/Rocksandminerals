/* Puzzle 5: Rock Types — sort rocks into the three main categories. Code: P-5 */
ER.register({
  id: 'rocktypes',
  title: 'Rock Types',
  icon: '🪨',
  kind: 'digital',
  tagline: 'Sort rocks into the three main categories',
  code: { letter: 'P', number: 5 },
  hints: [
    'Igneous rocks form when magma or lava cools and solidifies — "igneous" comes from the Latin for fire. Intrusive igneous rocks (like granite) cool slowly underground and have large crystals. Extrusive igneous rocks (like basalt) cool rapidly at the surface and have tiny crystals.',
    'Sedimentary rocks form from layers of sediment compressed and cemented over time — look for clues like "grains", "shells", "layers" or "plant material". Metamorphic rocks form when existing rocks are changed by heat and pressure — look for "changed", "recrystallised", "pressure" or a sedimentary rock that has been altered.',
  ],
  fact: 'The rock cycle connects all three rock types. Any rock can become any other rock type given enough time and the right conditions: igneous rocks weather into sediments that form sedimentary rocks; those can be buried and metamorphosed into metamorphic rocks; and metamorphic rocks can melt to form magma that cools into igneous rock once more. The rock cycle is driven by Earth\'s internal heat and the energy from the Sun at the surface.',
  build(body, api) {
    const { el } = ER;

    body.append(el('div', { class: 'card intro-card' },
      el('p', {}, '🔍 Drag each rock card into the correct bin. When all are sorted, press ', el('b', {}, 'Check my sorting'), '.')));

    const bins = [
      { id: 'igneous',     title: 'Igneous',     desc: 'Formed from cooling magma or lava' },
      { id: 'sedimentary', title: 'Sedimentary', desc: 'Formed from compressed and cemented layers of sediment' },
      { id: 'metamorphic', title: 'Metamorphic', desc: 'Formed when existing rock is changed by heat and pressure (without melting)' },
    ];

    const cards = [
      { id: 'c1',  cat: 'igneous',     content: 'Basalt — dark, fine-grained rock; forms from lava that cools rapidly at the surface' },
      { id: 'c2',  cat: 'igneous',     content: 'Granite — coarse-grained, speckled rock; forms from magma that cools slowly underground' },
      { id: 'c3',  cat: 'igneous',     content: 'Obsidian — volcanic glass; forms when lava cools so rapidly that no crystals grow' },
      { id: 'c4',  cat: 'igneous',     content: 'Pumice — pale, frothy rock with many tiny holes (vesicles) from gas bubbles in lava' },
      { id: 'c5',  cat: 'sedimentary', content: 'Sandstone — formed from cemented grains of sand compressed over millions of years' },
      { id: 'c6',  cat: 'sedimentary', content: 'Limestone — formed mainly from the calcium carbonate shells and skeletons of marine organisms' },
      { id: 'c7',  cat: 'sedimentary', content: 'Shale — formed from compressed layers of clay and silt; splits easily into flat sheets' },
      { id: 'c8',  cat: 'metamorphic', content: 'Marble — formed when limestone is recrystallised by heat and pressure; used in statues and buildings' },
      { id: 'c9',  cat: 'metamorphic', content: 'Quartzite — extremely hard rock formed when sandstone is metamorphosed; crystals fuse together' },
      { id: 'c10', cat: 'metamorphic', content: 'Schist — formed from shale under high heat and pressure; visible shiny crystals (e.g. mica) aligned in bands' },
    ];

    body.append(el('div', { class: 'card' },
      el('h4', {}, '✏️ Sort each rock into the correct category'),
      ER.sortTask({
        bins,
        cards,
        trayTitle: 'Rocks to sort (drag each to the correct bin)',
        checkText: '✔ Check my sorting',
        onSolved: () => api.solve(),
      })));

    return null;
  },
});
