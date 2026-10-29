# Advanced Interactive Chemistry & Chemical Sciences Laboratory

## 1. Overview & Architectural Vision

The **Interactive Chemistry & Chemical Sciences Laboratory** is an advanced, standards-compliant virtual laboratory designed for secondary and tertiary educational curricula. Built directly into the CBT + Digital Classroom platform, it transforms chemical sciences education from passive memorization into active, computational inquiry.

The architecture strictly adheres to core scientific invariants:
- **Zero Decorative Placeholders:** All simulations calculate real physical properties, stoichiometry, and kinetics.
- **SI Units & IUPAC Standards:** Verified chemical symbols, standard atomic weights, Pauling electronegativities, and thermodynamic signs.
- **Preservation of Platform Guarantees:** One-attempt CBT exam enforcement, RegNo authentication, collaborative whiteboard, and Graphing Laboratory integration remain 100% intact with zero regressions.

---

## 2. Laboratory Modules (33 Curriculum Topics)

The laboratory covers all 33 curriculum topics divided into 8 foundational branches:

| # | Topic Code | Title | Branch | Key Focus & Engine Modes |
|---|------------|-------|--------|--------------------------|
| 1 | `intro-chemistry` | Introduction to Chemistry | Foundations | Scientific method, SI units, classifications |
| 2 | `lab-safety` | Laboratory Safety & Hazard Signs | Foundations | GHS symbols, PPE protocols, emergency neutralization |
| 3 | `apparatus-library` | Apparatus Library & Glassware | Foundations | Calibration, meniscus readings, tolerances |
| 4 | `matter-states` | Matter & States of Matter | Physical Chemistry | Kinetic particle theory, phase transitions |
| 5 | `atomic-structure` | Atomic Structure | Physical Chemistry | Bohr shell model ($2n^2$), isotopes, quantum configuration |
| 6 | `periodic-table` | Periodic Table of Elements | Inorganic Chemistry | Full 118-element IUPAC table, trends, classifications |
| 7 | `chemical-bonding` | Chemical Bonding | Physical Chemistry | Ionic transfer, covalent sharing, metallic bonding |
| 8 | `molecular-geometry` | Molecular Geometry (VSEPR) | Physical Chemistry | Linear, bent, planar, tetrahedral, octahedral geometries |
| 9 | `chemical-formulae` | Chemical Formulae & Nomenclature | Foundations | Valency, oxidation states, binary & polyatomic salts |
| 10 | `chemical-equations` | Chemical Equations & Balancing | Foundations | Matrix/algebraic balancing, conservation of mass |
| 11 | `mole-concept` | Mole Concept & Avogadro | Physical Chemistry | $n = m/M$, $N = n \times N_A$, molar volume at STP |
| 12 | `stoichiometry` | Stoichiometry & Yield | Physical Chemistry | Mole ratios, limiting reagents, theoretical yield |
| 13 | `acids-bases-salts` | Acids, Bases & Salts | Physical Chemistry | Arrhenius, Bronsted-Lowry, pH, pOH, auto-ionization |
| 14 | `titration` | Titration Laboratory | Analytical Chemistry | Volumetric analysis, concordance, sigmoidal curves |
| 15 | `chemical-reactions` | Chemical Reactions | Physical Chemistry | Synthesis, decomposition, displacement, redox |
| 16 | `energetics` | Chemical Energetics | Physical Chemistry | Reaction energy profiles ($\Delta H$, $E_a$), exo/endothermic |
| 17 | `reaction-kinetics` | Reaction Kinetics | Physical Chemistry | Rate laws, temperature, concentration, catalysts |
| 18 | `equilibrium` | Chemical Equilibrium | Physical Chemistry | Le Chatelier's principle, $K_c$, dynamic equilibrium |
| 19 | `electrochemistry` | Electrochemistry | Physical Chemistry | Galvanic cells, standard reduction potentials, electrolysis |
| 20 | `redox-chemistry` | Redox Chemistry | Physical Chemistry | Oxidation numbers, half-equations, electron transfer |
| 21 | `organic-chemistry` | Organic Chemistry | Organic Chemistry | Hydrocarbons, functional groups, IUPAC chains |
| 22 | `inorganic-chemistry` | Inorganic Chemistry | Inorganic Chemistry | Reactivity series, extraction of metals, salt prep |
| 23 | `analytical-chemistry` | Analytical Chemistry & Qualitative | Analytical Chemistry | Cation/anion identification, flame tests, precipitates |
| 24 | `separation-techniques` | Separation Techniques | Analytical Chemistry | Distillation, chromatography, filtration, crystallization |
| 25 | `gas-chemistry` | Gas Chemistry & Gas Laws | Physical Chemistry | Boyle's Law, Charles's Law, Ideal Gas Law ($PV=nRT$) |
| 26 | `water-chemistry` | Water Chemistry | Environmental Chemistry | Hardness, softening methods, purification cycles |
| 27 | `environmental-chemistry` | Environmental Chemistry | Environmental Chemistry | Greenhouse effect, acid rain, photochemical smog |
| 28 | `industrial-chemistry` | Industrial Chemistry | Applied Chemistry | Haber, Contact, and Ostwald industrial syntheses |
| 29 | `nuclear-chemistry` | Nuclear Chemistry | Physical Chemistry | $\alpha, \beta, \gamma$ radioactive decay, half-life equations |
| 30 | `biochemistry` | Biochemistry | Biochemistry | Amino acids, carbohydrates, lipid saponification, enzymes |
| 31 | `virtual-experiments` | Virtual Experiments Workbench | Laboratory Practicals | Multi-apparatus drag-and-drop workspace |
| 32 | `graphing-analysis` | Graphing & Data Analysis | Scientific Computing | Direct link to `/graphing-lab.html?subject=CHEMISTRY` |
| 33 | `practical-assessments` | Practical Assessments & CBT | Assessment | CBT interactive practical exam mode |

---

## 3. Technology Stack & Engines

### 3.1 Frontend Architecture
- **Vanilla Modern JS (IIFE):** High-performance modular architecture with zero external bundler overhead.
- **Three.js (r128):** Real-time 3D rendering for Bohr atomic shell models with animated orbiting electrons and ball-and-stick molecular structures.
- **HTML5 2D Canvas Engine (`chem-canvas.js`):** Custom vectors for apparatus (beakers, volumetric flasks, burettes, condensers, electrolysis cells) with liquid levels, meniscus rendering, bubbles, and thermometer fluid columns.
- **KaTeX:** High-speed typographic rendering of mathematical and chemical formulas ($PV = nRT$, $\Delta H$, $K_a$, $\text{pH} = -\log_{10}[\text{H}^+]$).
- **Bootstrap 5.3 + Font Awesome 6.5:** Unified responsive layout and component system.

### 3.2 Computational Backends & Verification
- **Chemical Equation Balancer:** Applies Gaussian elimination across the atom conservation matrix to find the lowest non-zero integer coefficients for complex redox and combustion equations.
- **Stoichiometry Engine:** Computes theoretical yield, limiting reagent, and percent yield with exact mole-ratio conversions.
- **pH / Acid-Base Calculator:** Computes $[\text{H}^+]$, $[\text{OH}^-]$, $\text{pH}$, and $\text{pOH}$ for strong monoprotic acids/bases and weak acid/base Ostwald equilibria.
- **Ideal Gas Engine:** Solves for any variable in $PV = nRT$ using $R = 8.314462\text{ kPa}\cdot\text{dm}^3\cdot\text{mol}^{-1}\cdot\text{K}^{-1}$.
- **Titration Engine:** Computes exact equivalence points and models sigmoidal pH curves with indicator threshold changes (Phenolphthalein, Methyl Orange).

---

## 4. Database Schema & Migration

The laboratory is backed by MySQL/MariaDB:

### `chemistry_experiments` Table
```sql
CREATE TABLE IF NOT EXISTS chemistry_experiments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  user_identifier VARCHAR(64) NULL,
  title VARCHAR(255) NOT NULL,
  topic_code VARCHAR(64) NOT NULL,
  apparatus_json LONGTEXT NULL,
  reactions_json LONGTEXT NULL,
  observations TEXT NULL,
  measurements_json LONGTEXT NULL,
  notes TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_chem_user (user_id),
  INDEX idx_chem_topic (topic_code)
) ENGINE=InnoDB;
```

### CBT Exam Schema Extensions
- `questions.chemistry_config` & `questions.chemistry_target`
- `quiz_questions.chemistry_config` & `quiz_questions.chemistry_target`
- `assignments.chemistry_config` & `assignments.requires_chemistry_lab`

---

## 5. Verification & Zero-Regression Testing

The chemistry laboratory includes an automated 13-stage integration test suite covering 30+ assertions:

```bash
npm run test:chemistry
```

All other existing test suites run cleanly with zero regressions:
```bash
npm run test:platform    # 44/44 passed
npm run test:physics     # 15/15 passed
npm run test:biology     # 21/21 passed
npm run test:geography   # 30/30 passed
npm run test:cs          # 21/21 passed
npm run test:chemistry   # 30+/30+ passed
```
