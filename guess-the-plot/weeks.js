/*
 * Guess the Plot: one entry per Thursday. Newest week first is not required (sorted by id).
 *
 * Fields
 *   id            'YYYY-MM-DD' (the Idea Path date). Used in ?week=<id> and to seed the option order.
 *   placeholder   true for test data. Placeholder weeks are hidden from the archive and from the
 *                 default view as soon as one real week exists (still reachable with ?week=<id>).
 *   shortRef      shown BEFORE the pick, e.g. "Brunelli & Diamond (2026), Earth's Future" (default: authors (year), venue).
 *                 Title and DOI stay hidden until the visitor picks, because a title can give the answer away.
 *   paperTitle    short title, shown after the pick (linked to the DOI)
 *   paperFullTitle  optional full title, shown in small text before and after the pick
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
 *   imageAltRevealed  optional full description after the labels are revealed
 *   masks         [{ x, y, w, h, label }] fractions (0–1) of the image width/height; label = what it hides
 *   keepOrder     true = show options in the order given (A, B, C); otherwise a fixed shuffle per week
 *   options       exactly 3 × { text, correct } with one correct
 *   labelsText    what the hidden labels say (step 1). A string, or an array of blocks:
 *                 'text' | { lead, text } | { lead, list: ['…', '…'] }
 *   mainPoint     what the authors wanted the figure to show (step 2). Same format as labelsText.
 *   whyItMatters  optional line shown above the Idea Path link at step 2
 *   credit        { type: 'original' | 'redrawn' | 'placeholder', text?, dataSource?: { text, url } }
 *                 'original' → "<figureLabel> from <authors> (<year>), <venue>, <licence>."
 *                 'redrawn'  → "Redrawn from <authors> (<year>), <licence>." (+ "Data: <link>.")
 *                 text overrides the generated sentence; the licence link is added after it.
 *                 The DOI link is appended only after the pick.
 */
window.PXC_GTP_WEEKS = [
  {
    "id": "2026-10-15",
    "shortRef": "Brunelli & Diamond (2026), Earth's Future",
    "paperTitle": "Climate zones under sulfate geoengineering",
    "paperFullTitle": "Reductions in Climate Zone Changes Under Stratospheric Aerosol Injection Compared to Unabated Warming",
    "authors": "Brunelli & Diamond",
    "venue": "Earth's Future",
    "year": 2026,
    "doiUrl": "https://doi.org/10.1029/2026ef008937",
    "licence": {
      "name": "CC BY-NC 4.0",
      "url": "https://creativecommons.org/licenses/by-nc/4.0/"
    },
    "ideaPathUrl": "/idea/2026-10-15",
    "figureLabel": "Figure 5",
    "figureType": "panel",
    "image": "/guess-the-plot/img/brunelli-diamond-2026-fig5.png",
    "imageWidth": 2128,
    "imageHeight": 657,
    "imageAlt": "Three pie charts side by side. Each has a pale central pie with a darker wedge marked off, wrapped by six thin coloured arcs, one per climate model. Each arc has a solid and a lighter section, with small percentage labels at the arc ends. A colour key on the right names the six models.",
    "masks": [
      {
        "x": 0.0883,
        "y": 0.0244,
        "w": 0.071,
        "h": 0.0807,
        "label": "Title, left panel (scenario name)"
      },
      {
        "x": 0.4004,
        "y": 0.0,
        "w": 0.071,
        "h": 0.0609,
        "label": "Title, middle panel (scenario name)"
      },
      {
        "x": 0.7129,
        "y": 0.0259,
        "w": 0.0695,
        "h": 0.0807,
        "label": "Title, right panel (scenario name)"
      },
      {
        "x": 0.1128,
        "y": 0.414,
        "w": 0.0808,
        "h": 0.1339,
        "label": "Centre text, left pie (Major/Minor averages)"
      },
      {
        "x": 0.422,
        "y": 0.3683,
        "w": 0.0818,
        "h": 0.137,
        "label": "Centre text, middle pie (Major/Minor averages)"
      },
      {
        "x": 0.7359,
        "y": 0.4216,
        "w": 0.0804,
        "h": 0.1355,
        "label": "Centre text, right pie (Major/Minor averages)"
      }
    ],
    "keepOrder": true,
    "options": [
      {
        "text": "Share of global land where annual rainfall falls by more than 10% between 1985–2014 and 2085–2099, split into summer and winter drying, for six models under three future scenarios.",
        "correct": false
      },
      {
        "text": "Share of global land that changes climate zone between 1985–2014 and 2085–2099, split into major and minor zone shifts, for six models under three future scenarios.",
        "correct": true
      },
      {
        "text": "Share of global ocean area newly exceeding 30°C surface temperature between 1985–2014 and 2085–2099, split into tropical and subtropical seas, for six models under three future scenarios.",
        "correct": false
      }
    ],
    "labelsText": [
      {
        "lead": "Panel titles, left to right:",
        "text": "SSP2-4.5 · SSP5-8.5 · G6sulfur"
      },
      {
        "lead": "Centre text:",
        "list": [
          "SSP2-4.5: \"Major: 16.6%\" / \"Minor: 7.0%\"",
          "SSP5-8.5: \"Major: 28.6%\" / \"Minor: 10.6%\"",
          "G6sulfur: \"Major: 18.3%\" / \"Minor: 8.5%\""
        ]
      },
      {
        "lead": "Colour key:",
        "text": "UKESM1-0-LL, MPI-ESM1-2-HR, MPI-ESM1-2-LR, IPSL-CM6A-LR, CNRM-ESM2-1, CESM2-WACCM"
      },
      {
        "lead": "Periods, from the paper:",
        "text": "\"a Historical baseline spanning the period from 1985 to 2014, which is then compared to a future period from 2085 to 2099\" (Sect. 2.1)"
      },
      {
        "lead": "Bold and wedges, from the caption:",
        "text": "\"Percentages in bold represent transition differences that are statistically significantly distinct from internal variability at the 95% confidence level based on five-member SSP2-4.5 ensembles.\" \"Shifts between major climate zones are represented by opaque wedges, while those between subtypes are represented by slightly transparent wedges.\""
      }
    ],
    "mainPoint": "The authors find that \"Almost 40% of global land area, on average, experiences a change in climate regime in the future in each model under SSP5-8.5, while only around a quarter of land transitions under SSP2-4.5 and G6sulfur\" (Sect. 3.1), and that most G6sulfur transitions are not distinguishable from internal variability at the 95% confidence level, with the significant exceptions (major shifts in CNRM-ESM2-1, and major and minor shifts in MPI-ESM1-2-LR and UKESM1-0-LL) considerably smaller than under SSP5-8.5. In their words: \"We conclude that SAI, under the very specific metric of global change in climate regimes, is effective at reducing the impacts of climate change and thus regional adaptation burdens in a world that has experienced substantial greenhouse gas emissions.\" They add: \"It should also be noted that the G6sulfur implementation of SAI is still not quite as effective at preventing adaptation burdens than decreasing global carbon emissions\" (both Sect. 4).",
    "whyItMatters": "Climate zones are one way to see what sulfate geoengineering would and would not avoid. Three follow-up ideas are on the Idea Path page:",
    "credit": {
      "type": "original"
    }
  }
];
