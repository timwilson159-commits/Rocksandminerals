/* Puzzle 1: Planet Profiles — match planets and minerals to key facts. Code: Q-1 */
ER.register({
  id: 'planets',
  title: 'Planet Profiles',
  icon: '🪐',
  kind: 'digital',
  tagline: 'Match each planet or mineral to its key fact',
  code: { letter: 'Q', number: 1 },
  hints: [
    'The four terrestrial (rocky) planets are Mercury, Venus, Earth and Mars — all have iron-rich cores. Think about what makes each one unique: size, colour, atmosphere, magnetic field.',
    'Basalt is an IGNEOUS rock formed from lava — it cools rapidly so its crystals are very small (fine-grained). Silicate minerals are built from silicon and oxygen — they form the crust and mantle of all rocky planets.',
  ],
  fact: 'All four terrestrial planets formed from the same cloud of gas and dust (the solar nebula). As they grew, they melted from the heat of collisions and radioactive decay. Denser iron sank to form metallic cores while lighter silicate rock rose to form mantles and crusts — a process called planetary differentiation. Earth\'s liquid iron outer core is unique among the terrestrial planets in still generating a strong magnetic field.',
  build(body, api) {
    const { el } = ER;

    body.append(el('div', { class: 'card intro-card' },
      el('p', {}, '🔍 Drag each fact card to match the correct planet or mineral. When all are placed, press ', el('b', {}, 'Check my matches'), '.'),
      el('p', { class: 'muted small', html: '💡 Key terms: <span class="term">terrestrial planet</span>, <span class="term">iron core</span>, <span class="term">silicate</span>, <span class="term">basalt</span>, <span class="term">magnetic field</span>, <span class="term">planetary differentiation</span>' })));

    const slots = [
      { label: 'Mercury',         accept: 'mercury'  },
      { label: 'Venus',           accept: 'venus'    },
      { label: 'Earth',           accept: 'earth'    },
      { label: 'Mars',            accept: 'mars'     },
      { label: 'Basalt',          accept: 'basalt'   },
      { label: 'Silicate mineral',accept: 'silicate' },
    ];
    const cards = [
      { id: 'mercury',  content: 'The innermost planet; its iron-nickel core makes up ~70% of its radius — the largest core relative to its size of any planet' },
      { id: 'venus',    content: 'Almost the same size as Earth; thick CO₂ atmosphere causes a runaway greenhouse effect; surface temperature ~465 °C' },
      { id: 'earth',    content: 'The only planet with liquid surface water and active plate tectonics; its liquid outer core generates a magnetic field that protects life' },
      { id: 'mars',     content: 'The "Red Planet"; its reddish colour comes from iron oxide (rust) dust on its surface; has the largest volcano in the solar system (Olympus Mons)' },
      { id: 'basalt',   content: 'A fine-grained, dark igneous rock formed by rapid cooling of lava; the most common rock on Earth\'s ocean floors and on other terrestrial planets' },
      { id: 'silicate', content: 'The most common mineral group in the solar system; built from silicon and oxygen atoms; forms the crust and mantle of all terrestrial planets' },
    ];

    body.append(el('div', { class: 'card' },
      el('h4', {}, '✏️ Match planets and minerals to their facts'),
      ER.matchTask({ slots, cards, layout: 'list', checkText: '✔ Check my matches', onSolved: () => api.solve() })));

    return null;
  },
});
