/*
 * Guess the Plot: one entry per Wednesday. Newest week first is not required (sorted by id).
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
    "id": "2026-10-28",
    "shortRef": "Anson Ka Hei Cheung, Paul J. Kushner, Francesco S. R. Pausata, Zhihong Zhuo and Marguerite L. Brown (2026), Earth System Dynamics",
    "paperTitle": "Unexpected land-surface warming following a relatively limited-forcing hypothetical nuclear war",
    "paperFullTitle": "Unexpected land-surface warming following a relatively limited-forcing hypothetical nuclear war",
    "authors": "Cheung et al.",
    "venue": "Earth System Dynamics",
    "year": 2026,
    "doiUrl": "https://doi.org/10.5194/esd-17-1573-2026",
    "licence": {
      "name": "CC BY 4.0",
      "url": "https://creativecommons.org/licenses/by/4.0/"
    },
    "ideaPathUrl": "/idea/2026-10-28",
    "figureLabel": "Figure 5",
    "figureType": "map",
    "image": "/guess-the-plot/img/cheung-2026-fig5.png",
    "imageWidth": 1892,
    "imageHeight": 920,
    "imageAlt": "Four world maps in two rows of two, each with a colour bar from dark blue through white to dark red; the left bars run from −5 to 5 and the right bars from −3 to 3. Orange solid and dashed lines trace the edges of the Arctic and Antarctic sea ice. Top left: deep blue across North America, Europe and northern Asia, with a white hole in central Asia and faint pink over parts of the southern oceans. Top right: deep blue across the Arctic and northern Eurasia, lighter blue over Europe and North America, and pale blue bands over the Southern Ocean. Bottom left: red patches over Tibet, western North America, southern Greenland and northern Africa, with blue over the Arctic coasts. Bottom right: mostly white over land, blue along the Arctic sea-ice edge and a strong blue band around Antarctica, with one small red spot over Tibet.",
    "imageAltRevealed": "Four world maps of the surface temperature response, in degrees Celsius, to a 20 Tg black-carbon injection over the United States and Russia starting on 1 January (BC20, mean of 15 members, against a pre-industrial control). Top left: the first January–February, with cooling of up to about 8 °C over the northern continents. Top right: December–February averaged over years 6–15, with the strongest cooling at high northern latitudes and sea ice expanded. Bottom left: the first June–August, with warming of up to 3–5 °C around Tibet, 2–3 °C in southern Greenland and western North America and 1–2 °C in northern Africa. Bottom right: June–August averaged over years 6–15, with cooling mostly at high latitudes. White areas are not significant at the 95 % level. The orange solid and dashed lines are the sea-ice edge in the scenario and in the control climatology.",
    "masks": [
      {
        "x": 0.0539,
        "y": 0.0163,
        "w": 0.3631,
        "h": 0.038,
        "label": "(a) panel title"
      },
      {
        "x": 0.5328,
        "y": 0.0163,
        "w": 0.3969,
        "h": 0.038,
        "label": "(b) panel title"
      },
      {
        "x": 0.0518,
        "y": 0.5261,
        "w": 0.3673,
        "h": 0.037,
        "label": "(c) panel title"
      },
      {
        "x": 0.5349,
        "y": 0.5261,
        "w": 0.3922,
        "h": 0.037,
        "label": "(d) panel title"
      },
      {
        "x": 0.4831,
        "y": 0.2272,
        "w": 0.0132,
        "h": 0.0359,
        "label": "(a) colour-bar unit label"
      },
      {
        "x": 0.9789,
        "y": 0.2272,
        "w": 0.0132,
        "h": 0.0359,
        "label": "(b) colour-bar unit label"
      },
      {
        "x": 0.4831,
        "y": 0.737,
        "w": 0.0132,
        "h": 0.0359,
        "label": "(c) colour-bar unit label"
      },
      {
        "x": 0.9789,
        "y": 0.737,
        "w": 0.0132,
        "h": 0.0359,
        "label": "(d) colour-bar unit label"
      }
    ],
    "keepOrder": true,
    "options": [
      {
        "text": "Change in surface downwelling longwave radiation (W m−2) for the 20 Tg case (BC20): the first January–February (top left), December–February of years 6–15 (top right), the first June–August (bottom left) and June–August of years 6–15 (bottom right). Blue means less longwave reaching the ground.",
        "correct": false
      },
      {
        "text": "Change in surface temperature (°C) for the 20 Tg case (BC20): the first January–February (top left), December–February of years 6–15 (top right), the first June–August (bottom left) and June–August of years 6–15 (bottom right). Blue means cooling.",
        "correct": true
      },
      {
        "text": "Change in surface temperature (°C) in the first June–August for four injection sizes: 12 Tg (top left), 16 Tg (top right), 20 Tg (bottom left) and 24 Tg (bottom right). Blue means cooling.",
        "correct": false
      }
    ],
    "labelsText": [
      {
        "lead": "Panel titles, (a)–(d):",
        "list": [
          "(a) Surface temperature anomaly (BC20; Year 1 JF)",
          "(b) Surface temperature anomaly (BC20; Year 6-15 DJF)",
          "(c) Surface temperature anomaly (BC20; Year 1 JJA)",
          "(d) Surface temperature anomaly (BC20; Year 6-15 JJA)"
        ]
      },
      {
        "lead": "Colour bars:",
        "text": "°C"
      }
    ],
    "mainPoint": [
      {
        "lead": "The decoys:",
        "text": "The decoys are real quantities from this paper. Figure 4 maps first-summer surface temperature for two injection sizes only (Figure 4 caption, journal p. 1579: \"Responses of surface temperature for (a) BC12 and (b) BC24 in JJA of the first simulated year.\"), and Figure 6 maps the longwave for the first summer only (Figure 6 caption, journal p. 1580: \"Responses of (a) surface DLRF, and (b) surface net energy flux in JJA of the first year for BC20.\")."
      },
      "\"Overall, these simulations reveal a whipsaw effect on the surface temperature in the first year, where there is a quick transition from the very cold initial conditions to much warmer conditions over midlatitude land surfaces, and then a transition to strong mid-to-high latitude cooling as sea ice and ocean adjustments kick in.\" (journal p. 1580)",
      "\"In NH, there is a statistically significant maximum cooling of about 8 °C in continental regions in the JF-mean (Fig. 5a).\" (journal p. 1578)",
      "\"A warming of up to +3–5 °C develops around Tibet, +2–3 °C in southern Greenland and the western North America, and +1–2 °C in northern Africa (Fig. 5c; and see Fig. 4 for the corresponding plots for BC12 and BC24).\" (journal p. 1579)",
      "\"In December to January (DJF) over years 6 to 15, the maximum cooling is at high latitudes, accompanied by sea-ice extent increase (Fig. 5b).\" (journal p. 1579)",
      "Conditions, in the authors' words: \"We generate an ensemble with an injection of 20 Tg of BC (hereafter as BC20), consisting of 15 ensemble members.\" and the injection is \"uniformly between 300 to 150 hPa over the United States and Russia at a constant rate over 1 week, starting from 1 January\" (journal p. 1575). The abstract frames the result as \"a transient surface warming develops in the first boreal summer following a boreal-winter injection\" (journal p. 1573)."
    ],
    "whyItMatters": "The size of a nuclear war's smoke cloud may change not just how cold it gets, but whether some places briefly warm first. Ideas built on this paper (whether the first-summer warming appears in UKESM, how much of the fast smoke removal belongs to the model, and what a May start would change) are on the Idea Path page:",
    "credit": {
      "type": "original",
      "text": "Figure 5 from Cheung et al. (2026), Earth Syst. Dynam., 17, 1573–1588,"
    }
  },
  {
    "id": "2026-10-22",
    "shortRef": "Wilcox et al. (2026), Environ. Res.: Climate",
    "paperTitle": "Climate responses to regional aerosol reductions (RAMIP)",
    "paperFullTitle": "Distinct climate responses to regional aerosol reductions: an overview of the regional aerosol model intercomparison project",
    "authors": "Wilcox et al.",
    "venue": "Environ. Res.: Climate",
    "year": 2026,
    "doiUrl": "https://doi.org/10.1088/2752-5295/aeb71a",
    "licence": {
      "name": "CC BY 4.0",
      "url": "https://creativecommons.org/licenses/by/4.0/"
    },
    "ideaPathUrl": "/idea/2026-10-22",
    "figureLabel": "Figure 4",
    "figureType": "map",
    "image": "/guess-the-plot/img/wilcox-2026-fig4.png",
    "imageWidth": 1835,
    "imageHeight": 915,
    "imageAlt": "Six world maps in two rows of three, labelled (a) to (f), sharing one colour bar that runs from dark blue (−4) through white to dark red (4). Map (a) is shaded orange and red across much of the Northern Hemisphere, strongest over South and East Asia and the oceans beside them, with smaller orange areas over South America and the Atlantic. Maps (b) to (e) are mostly white, each with one patch of colour: (b) over East Asia and the North Pacific, (c) over India, the Arabian Sea and the Bay of Bengal, (d) over North America, Europe and the North Atlantic, and (e) faint patches over Africa and the Middle East with a small blue patch in central Africa. Map (f) is the mirror image of (a): blue across the Northern Hemisphere and tropics, darkest over Asia, with a few orange patches over North Africa. A diagonal grey \"Accepted Manuscript\" watermark crosses maps (c) and (f).",
    "imageAltRevealed": "Six world maps of the annual-mean, multi-model mean effective radiative forcing in watts per square metre. (a) Forcing in 2050 from cutting aerosol emissions everywhere to SSP1-2.6 levels instead of SSP3-7.0: positive across much of the Northern Hemisphere, strongest over South and East Asia, global mean 0.71. (b)–(e) The same cuts made only over East Asia (0.12), South Asia (0.10), North America and Europe (0.12), and Africa and the Middle East (0.04), each forcing mainly near its own region. (f) Historical forcing from anthropogenic aerosols, 2014 versus 1850: negative almost everywhere the other maps are positive, global mean −1.10. Global means are as printed in each panel's top-right corner.",
    "masks": [
      {
        "x": 0.2959,
        "y": 0.0066,
        "w": 0.0311,
        "h": 0.0393,
        "label": "(a) global-mean value"
      },
      {
        "x": 0.6283,
        "y": 0.0066,
        "w": 0.0316,
        "h": 0.0393,
        "label": "(b) global-mean value"
      },
      {
        "x": 0.9569,
        "y": 0.0066,
        "w": 0.0316,
        "h": 0.0393,
        "label": "(c) global-mean value"
      },
      {
        "x": 0.2959,
        "y": 0.4689,
        "w": 0.0311,
        "h": 0.0339,
        "label": "(d) global-mean value"
      },
      {
        "x": 0.6283,
        "y": 0.4689,
        "w": 0.0316,
        "h": 0.0339,
        "label": "(e) global-mean value"
      },
      {
        "x": 0.9553,
        "y": 0.4689,
        "w": 0.0354,
        "h": 0.0339,
        "label": "(f) global-mean value"
      },
      {
        "x": 0.4496,
        "y": 0.9607,
        "w": 0.0768,
        "h": 0.0393,
        "label": "Colour-bar label (quantity and units)"
      }
    ],
    "keepOrder": true,
    "options": [
      {
        "text": "Change in annual-mean surface air temperature (K) averaged over 2035–2049 when aerosol emissions are cut to SSP1-2.6 levels globally (a) or only over East Asia (b), South Asia (c), North America and Europe (d), or Africa and the Middle East (e), relative to SSP3-7.0. Panel (f) shows historical temperature change due to anthropogenic aerosols. Corner numbers give the global-mean warming.",
        "correct": false
      },
      {
        "text": "Effective radiative forcing (W m−2) in 2050 when aerosol emissions are cut to SSP1-2.6 levels globally (a) or only over East Asia (b), South Asia (c), North America and Europe (d), or Africa and the Middle East (e), relative to SSP3-7.0. Panel (f) shows historical (2014 vs 1850) forcing from anthropogenic aerosols. Corner numbers give the global means.",
        "correct": true
      },
      {
        "text": "Change in annual-mean precipitation (mm per day) averaged over 2035–2049 when aerosol emissions are cut to SSP1-2.6 levels globally (a) or only over East Asia (b), South Asia (c), North America and Europe (d), or Africa and the Middle East (e), relative to SSP3-7.0. Panel (f) shows historical precipitation change due to anthropogenic aerosols. Corner numbers give the global-mean change.",
        "correct": false
      }
    ],
    "labelsText": [
      {
        "lead": "Colour bar:",
        "text": "ERF [W m⁻²]"
      },
      {
        "lead": "Corner numbers (global means), (a)–(f):",
        "text": "0.71 · 0.12 · 0.10 · 0.12 · 0.04 · −1.10"
      }
    ],
    "mainPoint": [
      {
        "lead": "The decoys:",
        "text": "The decoys are real quantities from this paper. Figure 3 maps the near-surface temperature and precipitation responses to the same global and regional aerosol reductions for 2035–2049, compared with the SSP3-7.0 baseline (Figure 3 caption, PDF p. 13: \"(b): near-surface temperature [K], and (c): precipitation [mm day−1 ] responses to global and regional aerosol reductions in 2035 - 2049, compared to the SSP3-7.0 baseline\"). It has no historical panel."
      },
      "\"Global aerosol reductions following SSP1-2.6 result in a multi-model mean global mean ERF of 0.71±0.27 W m−2 relative to SSP3-7.0 emissions in 2050.\" (PDF p. 16)",
      "Table 3 note: \"Uncertainties are inter-model standard deviation.\" (PDF p. 16)",
      "\"Local ERFs of up to 5 W m−2 are found over South and East Asia, with large forcing over the surrounding ocean due to transported aerosol.\" (PDF p. 16)",
      "\"ERFs due to regional aerosol reductions are small in the global mean (Figure 4), but they are large regionally, and can therefore drive large local and remote climate impacts.\" (PDF p. 16)",
      "\"The forcing due to South Asian emission changes is largely confined to South Asia, the Arabian Sea, and the Bay of Bengal (Figure 4).\" (PDF p. 17)",
      "\"The pattern of the ERF due to aerosol reductions in RAMIP mirrors the pattern of the 2014 vs. 1850 ERF due to anthropogenic aerosol, which was also dominated by strong Asian forcing (Figure 4).\" (PDF p. 17)"
    ],
    "whyItMatters": "Air-quality policy will decide how much of this forcing arrives, and where. Three follow-up ideas, on what makes aerosol forcing depend on the background state and why the models disagree, are on the Idea Path page:",
    "credit": {
      "type": "original",
      "text": "Figure 4 from Wilcox et al. (2026), Environ. Res.: Climate (Accepted Manuscript),"
    }
  },
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
