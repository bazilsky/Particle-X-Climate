/*
 * Guess the Plot: one entry per Thursday. Newest week first is not required (sorted by id).
 *
 * Fields
 *   id            'YYYY-MM-DD' (the Idea Path date). Used in ?week=<id> and to seed the option order.
 *   placeholder   true for test data. Placeholder weeks are hidden from the archive and from the
 *                 default view as soon as one real week exists (still reachable with ?week=<id>).
 *   paperTitle    short title shown at the top
 *   authors       e.g. 'Brunelli & Diamond'
 *   venue, year   e.g. "Earth's Future", 2026
 *   doiUrl        https://doi.org/... (null for placeholder)
 *   licence       { name: 'CC BY-NC 4.0', url: 'https://creativecommons.org/licenses/by-nc/4.0/' }
 *   ideaPathUrl   e.g. '/idea/2026-10-15'
 *   figureLabel   e.g. 'Figure 2' (for a redraw: the figure it is redrawn from)
 *   figureType    'line' | 'map' | 'panel'
 *   image         path under /guess-the-plot/img/
 *   imageWidth, imageHeight   intrinsic pixel size (reserves space; masks are fractions so any size works)
 *   imageAlt      neutral description before the reveal (must not give the answer away)
 *   imageAltRevealed  full description after the labels are revealed
 *   masks         [{ x, y, w, h, label }] fractions (0–1) of the image width/height; label = what it hides
 *   options       exactly 3 × { text, correct } with one correct; shown in a fixed shuffled order per week
 *   labelsText    what the hidden labels say (shown at step 1)
 *   mainPoint     two plain sentences: what the authors wanted the figure to show (step 2)
 *   credit        { type: 'original' | 'redrawn' | 'placeholder', text?, dataSource?: { text, url } }
 *                 'original' → "<figureLabel> from <authors> (<year>), <venue>. <licence>."
 *                 'redrawn'  → "Redrawn from <authors> (<year>), <licence>." (+ data source link)
 *                 text overrides the generated sentence; the licence link is always added.
 */
window.PXC_GTP_WEEKS = [
  {
    id: '2026-10-15',
    placeholder: true,
    paperTitle: 'Test week: a made-up chart',
    authors: 'Particle X Climate',
    venue: 'placeholder',
    year: 2026,
    doiUrl: null,
    licence: null,
    ideaPathUrl: '/idea/2026-10-15',
    figureLabel: 'Placeholder chart',
    figureType: 'line',
    image: '/guess-the-plot/img/placeholder-2026-10-15.svg',
    imageWidth: 800,
    imageHeight: 500,
    imageAlt: 'A line chart with two lines that rise together; after a dashed vertical marker one keeps rising and the other levels off. Title, axis labels and legend are covered.',
    imageAltRevealed: 'Placeholder line chart titled "Global temperature change in two made-up runs". Temperature change in °C against years after the start of the run. The "No intervention" line keeps rising to about 3 °C; the "Cooling from year 30" line levels off at about 1.3 °C.',
    masks: [
      { x: 0.18, y: 0.03, w: 0.64, h: 0.09, label: 'Title' },
      { x: 0.008, y: 0.26, w: 0.06, h: 0.48, label: 'Vertical axis label' },
      { x: 0.33, y: 0.915, w: 0.38, h: 0.08, label: 'Horizontal axis label' },
      { x: 0.128, y: 0.178, w: 0.31, h: 0.157, label: 'Legend' }
    ],
    options: [
      { text: 'Global temperature change in two made-up runs, one with a cooling intervention from year 30', correct: true },
      { text: 'Arctic sea-ice loss in two made-up runs, one where melting slows after year 30', correct: false },
      { text: 'Stratospheric aerosol in two made-up runs, one with a single large eruption at year 30', correct: false }
    ],
    labelsText: 'Title: "Global temperature change in two made-up runs". Vertical axis: temperature change (°C). Horizontal axis: years after the start of the run. Legend: rust = no intervention, teal = cooling from year 30.',
    mainPoint: 'This is a placeholder chart drawn to test the game, not a result from a paper. A real week would explain here, in two plain sentences, what the authors wanted their figure to show.',
    credit: { type: 'placeholder', text: 'Placeholder chart drawn by Particle X Climate to test this page. Not a real paper figure.' }
  }
];
