/* Puzzle 6: Planet Quiz — test knowledge of terrestrial planet composition. Code: M-6 */
ER.register({
  id: 'planetquiz',
  title: 'Planet Quiz',
  icon: '🚀',
  kind: 'digital',
  tagline: 'Test your knowledge of terrestrial planet composition',
  code: { letter: 'M', number: 6 },
  hints: [
    'The four terrestrial planets — Mercury, Venus, Earth and Mars — are all rocky with metal cores. Think about what you know about their sizes, distances from the Sun, colours and features.',
    'Earth\'s layers from outside to inside: crust → mantle → outer core (liquid iron-nickel) → inner core (solid iron-nickel). The mantle is by far the largest layer by volume.',
  ],
  fact: 'The four terrestrial planets all share the same basic structure: a thin silicate crust, a thick silicate mantle, and an iron-nickel core. But they differ in size, atmosphere, and geological activity. Earth is the largest and most geologically active. Venus is the hottest despite being further from the Sun than Mercury, because its thick CO₂ atmosphere traps heat. Mars has the largest volcano and canyon in the solar system, but is geologically quiet today. Mercury has almost no atmosphere.',
  build(body, api) {
    const { el } = ER;

    body.append(el('div', { class: 'card intro-card' },
      el('p', {}, '🚀 Answer all 5 questions correctly to unlock your code. You can retry any question if you get it wrong.')));

    const questions = [
      {
        q: 'Which layer makes up approximately 84% of Earth\'s volume?',
        opts: ['The inner core', 'The outer core', 'The mantle', 'The crust'],
        a: 'The mantle',
        why: 'The mantle extends from about 35 km to 2,900 km below Earth\'s surface and makes up ~84% of Earth\'s volume. It is made of iron-magnesium silicate rock and is solid (but flows very slowly over millions of years).',
      },
      {
        q: 'The four terrestrial planets in order from the Sun are...',
        opts: [
          'Mercury, Venus, Earth, Mars',
          'Venus, Mercury, Earth, Mars',
          'Mercury, Earth, Venus, Mars',
          'Mercury, Venus, Mars, Earth',
        ],
        a: 'Mercury, Venus, Earth, Mars',
        why: 'The four terrestrial (rocky) planets are the four closest to the Sun: Mercury (0.4 AU), Venus (0.7 AU), Earth (1.0 AU) and Mars (1.5 AU). Beyond Mars, the planets are gas giants or ice giants.',
      },
      {
        q: 'Which terrestrial planet is closest in size to Earth?',
        opts: ['Mercury', 'Venus', 'Mars', 'The Moon'],
        a: 'Venus',
        why: 'Venus has a diameter of about 12,104 km — Earth\'s is 12,742 km. They are nearly twins in size. Mercury and Mars are much smaller (about 4,879 km and 6,779 km respectively).',
      },
      {
        q: 'What gives Mars its reddish-orange colour?',
        opts: [
          'Liquid lava flowing on its surface',
          'A thick orange atmosphere',
          'Iron oxide (rust) in surface dust and rock',
          'Orange-coloured ice caps',
        ],
        a: 'Iron oxide (rust) in surface dust and rock',
        why: 'Mars appears reddish because its surface is covered in iron oxide (Fe₂O₃) — rust. The thin Martian atmosphere also scatters light to give the sky a pinkish-orange colour from the dust suspended in it.',
      },
      {
        q: 'What is the process called where denser iron sank to the cores of the terrestrial planets while lighter silicate rock rose to form the mantle and crust?',
        opts: [
          'Sedimentation',
          'Tectonic rifting',
          'Volcanic outgassing',
          'Planetary differentiation',
        ],
        a: 'Planetary differentiation',
        why: 'During planetary formation, planets were hot enough to melt. Denser materials (iron, nickel) sank toward the centre by gravity while lighter silicate minerals floated to the surface — this is planetary differentiation. It explains why all terrestrial planets have iron-rich cores.',
      },
    ];

    body.append(el('div', { class: 'card' },
      el('h4', {}, '❓ Answer the questions'),
      ER.quizSeq(questions, () => api.solve())));

    return null;
  },
});
