# Virtual Chemistry Bench

The interactive bench is an additional mode in `/chemistry-lab.html`; the existing canvas, molecular viewer, calculators, periodic table, and experiment workspace remain available.

## Current implementation

| Laboratory item | Origin / source | Type and licensing | Implemented interactions | Validation status |
|---|---|---|---|---|
| Beakers, 250/600/1000 mL; conical flasks, 250/500/1000 mL | Original inline SVG paths in `public/js/chemistry-bench.js` | Programmatically rendered vectors; no external asset | Select, remove, measured transfer, inspect volume and composition | Schematic outlines; marks are illustrative, not certified calibration or manufacturer geometry |
| Volumetric flasks, 100/250/500/1000 mL | Original inline SVG path in `public/js/chemistry-bench.js` | Programmatically rendered vector; no external asset | Select, remove, measured transfer, set final volume | One nominal capacity mark; rendered level is schematic, not certified calibration |
| Graduated cylinders, 10/25/50/100 mL | Original inline SVG path in `public/js/chemistry-bench.js` | Programmatically rendered vector; no external asset | Select, remove, measured transfer, inspect volume | Scale is illustrative; numeric input is the simulation's measurement source |
| Test tube, 25 mL | Original inline SVG path in `public/js/chemistry-bench.js` | Programmatically rendered vector; no external asset | Select, remove, measured transfer, inspect contents | Schematic outline; rack and calibrated reading are not implemented |
| Foam cup, 200 mL | Reuses the original beaker-shaped schematic | Original interface vector; no external asset | Select, remove, use as a capacity-limited vessel | Identified by its label; the drawing is not a faithful foam-cup depiction |
| Pipettes, 5/10/25 mL; disposable pipette; 50 mL burette; weigh boat; Bunsen burner; scale | Original apparatus entries in `public/js/chemistry-simulation.js` | Text-only apparatus chips; no external asset | Add/remove from workbench; pipette can accompany measured-transfer practicals | Pipette volumes are not enforced; burette titration, weighing readings, and heating are not simulated |
| Glass stirring rod | Original interface control, no external model | Built-in UI asset; no external license required | Required before a supported mix action | Workflow gate only; not a physical 3D model |
| Filter funnel and filter paper | Original interface controls, no external models | Built-in UI assets; no external license required | Required to separate a supported precipitate into residue and filtrate vessels | Separation is implemented for the calcium-carbonate practical only |

No third-party apparatus models, textures, photographs, or downloadable scientific assets are bundled by this bench. Its vector shapes are scalable UI schematics, not photorealistic equipment or validated 3D geometry.

## ChemCollective activity 2 comparison

The public [Glucose Dilution Problem](https://chemcollective.org/activities/vlab/2) is described as preparing 0.025 M glucose from 1 M glucose stock. Its stockroom lists distilled water (3.0 L), 1 M glucose solution (0.1 L), 250/600/1000 mL beakers, 250/500/1000 mL flasks, 10/25/50/100 mL graduated cylinders, 100/250/500/1000 mL volumetric flasks, 5/10/25 mL pipettes, a disposable pipette, foam cup, weigh boat, 50 mL burette, Bunsen burner, and scale.

The bench now contains this stock solution and the listed glassware/tool sizes, alongside the existing practical equipment. A seeded activity uses a 25 mL pipette, 1 M glucose stock, a 1000 mL volumetric flask, and water to make 25 mL × 1 M / 1000 mL = 0.025 M. The stock-transfer controls use numeric measured amounts; pipette capacities are available as apparatus entries but are not yet mechanically enforced as fixed-volume transfers. Bunsen heating and scale readings are expressly not simulated.

Only the activity description and stockroom inventory were used for comparison. No ChemCollective source code, images, or apparatus artwork was imported. The ChemCollective site marks its content CC BY-NC-ND 3.0; this implementation uses independently drawn schematic equipment and links to the cited source activity.

## Ammonium sulfate practical

The virtual stockroom includes dilute sulfuric-acid and ammonia teaching solutions. The supported balanced equation is `H2SO4(aq) + 2NH3(aq) → (NH4)2SO4(aq)`. Selecting the practical stages a conical flask, measuring cylinder, glass rod, burette, and schematic evaporating-dish heating setup. The mixing model calculates the limiting reagent and dissolved salt from the balanced 1:2 mole ratio.

The replayable 2D animation is original schematic artwork, not a real-life recording or 3D apparatus. Its evaporation/crystal scene is conceptual only: temperature, ammonia equilibrium, indicator endpoint, solubility, evaporation rate, and isolated crystal yield are not calculated. It must not be used as a real-laboratory procedure. The stock entries and UI display explicit hazard cautions; actual acid/ammonia work requires an approved risk assessment, trained supervision, and appropriate controls.

## Supported simulation

- Measured transfers from fixed teaching stocks, measured liquid transfer between vessels, sodium-chloride addition, volumetric-flask final-volume setting, supported mixing, pH measurement, and precipitation filtration update the versioned simulation state.
- Supported reaction equations include hydrochloric acid with sodium hydroxide, calcium chloride with sodium carbonate, and the idealised dilute ammonia/sulfuric-acid neutralisation. Atom balance (including grouped formula subscripts) is checked by tests. Unknown combinations do not create products.
- The strong-acid/strong-base pH calculation is an ideal dilute-solution approximation. It does not model activities, temperature, heat, titration curves, or indicators.
- Calcium-carbonate formation uses classroom stoichiometry and a fixed visible white solid; it does not calculate solubility equilibria or yield.
- Liquid height and glass appearance are schematic. Numeric values are authoritative within the current model; drawn graduation marks do not claim instrument accuracy.
- The notebook and run state are owner-scoped in MySQL. The `chemistry_lab_runs` table is created by `npm run migrate:chemistry-bench` and by the standard `npm start` bootstrap.
- PubChem compound records are linked for identity references. The links do not certify every simulation parameter or constitute curriculum approval.

## Not yet implemented

This bench does not yet include a photorealistic enhanced 3D apparatus mode, professional external apparatus models, drag positioning, a functional burette or titration workflow, a digital balance, thermal simulation, gas evolution, indicators, equipment-specific instrument precision, graphics quality controls, teacher assignment/review, assessment submission, or officially verified syllabus mappings. These features must not be inferred from the current schematic workbench.
