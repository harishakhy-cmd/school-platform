/**
 * Chemistry Laboratory — Static Data Module
 * All 118 elements (IUPAC 2021 data), substance library,
 * apparatus catalog, reaction definitions, and VSEPR geometries.
 *
 * This file has NO dependencies and loads first.
 * Source: IUPAC 2021 atomic weights, NIST WebBook for substance data.
 */

/* global ChemData */
var ChemData = (function () {
  'use strict';

  // ==========================================================================
  // PERIODIC TABLE — All 118 Elements
  // ==========================================================================
  var ELEMENTS_RAW = [
    [1,  'H',  'Hydrogen',      1.008,   1,  1, 'nonmetal',       2.20, '1s¹',              [1,-1]],
    [2,  'He', 'Helium',        4.003,  18,  1, 'noble_gas',      null, '1s²',              [0]],
    [3,  'Li', 'Lithium',       6.941,   1,  2, 'alkali_metal',   0.98, '[He]2s¹',          [1]],
    [4,  'Be', 'Beryllium',     9.012,   2,  2, 'alkaline_earth', 1.57, '[He]2s²',          [2]],
    [5,  'B',  'Boron',        10.811,  13,  2, 'metalloid',      2.04, '[He]2s²2p¹',       [3]],
    [6,  'C',  'Carbon',       12.011,  14,  2, 'nonmetal',       2.55, '[He]2s²2p²',       [4,2,-4]],
    [7,  'N',  'Nitrogen',     14.007,  15,  2, 'nonmetal',       3.04, '[He]2s²2p³',       [-3,3,5]],
    [8,  'O',  'Oxygen',       15.999,  16,  2, 'nonmetal',       3.44, '[He]2s²2p⁴',       [-2]],
    [9,  'F',  'Fluorine',     18.998,  17,  2, 'halogen',        3.98, '[He]2s²2p⁵',       [-1]],
    [10, 'Ne', 'Neon',         20.180,  18,  2, 'noble_gas',      null, '[He]2s²2p⁶',       [0]],
    [11, 'Na', 'Sodium',       22.990,   1,  3, 'alkali_metal',   0.93, '[Ne]3s¹',          [1]],
    [12, 'Mg', 'Magnesium',    24.305,   2,  3, 'alkaline_earth', 1.31, '[Ne]3s²',          [2]],
    [13, 'Al', 'Aluminium',    26.982,  13,  3, 'post_transition',1.61, '[Ne]3s²3p¹',       [3]],
    [14, 'Si', 'Silicon',      28.086,  14,  3, 'metalloid',      1.90, '[Ne]3s²3p²',       [4,-4]],
    [15, 'P',  'Phosphorus',   30.974,  15,  3, 'nonmetal',       2.19, '[Ne]3s²3p³',       [-3,3,5]],
    [16, 'S',  'Sulfur',       32.065,  16,  3, 'nonmetal',       2.58, '[Ne]3s²3p⁴',       [-2,4,6]],
    [17, 'Cl', 'Chlorine',     35.453,  17,  3, 'halogen',        3.16, '[Ne]3s²3p⁵',       [-1,1,5,7]],
    [18, 'Ar', 'Argon',        39.948,  18,  3, 'noble_gas',      null, '[Ne]3s²3p⁶',       [0]],
    [19, 'K',  'Potassium',    39.098,   1,  4, 'alkali_metal',   0.82, '[Ar]4s¹',          [1]],
    [20, 'Ca', 'Calcium',      40.078,   2,  4, 'alkaline_earth', 1.00, '[Ar]4s²',          [2]],
    [21, 'Sc', 'Scandium',     44.956,   3,  4, 'transition',     1.36, '[Ar]3d¹4s²',       [3]],
    [22, 'Ti', 'Titanium',     47.867,   4,  4, 'transition',     1.54, '[Ar]3d²4s²',       [4,3,2]],
    [23, 'V',  'Vanadium',     50.942,   5,  4, 'transition',     1.63, '[Ar]3d³4s²',       [5,4,3,2]],
    [24, 'Cr', 'Chromium',     51.996,   6,  4, 'transition',     1.66, '[Ar]3d⁵4s¹',       [6,3,2]],
    [25, 'Mn', 'Manganese',    54.938,   7,  4, 'transition',     1.55, '[Ar]3d⁵4s²',       [7,4,3,2]],
    [26, 'Fe', 'Iron',         55.845,   8,  4, 'transition',     1.83, '[Ar]3d⁶4s²',       [3,2]],
    [27, 'Co', 'Cobalt',       58.933,   9,  4, 'transition',     1.88, '[Ar]3d⁷4s²',       [3,2]],
    [28, 'Ni', 'Nickel',       58.693,  10,  4, 'transition',     1.91, '[Ar]3d⁸4s²',       [2]],
    [29, 'Cu', 'Copper',       63.546,  11,  4, 'transition',     1.90, '[Ar]3d¹⁰4s¹',      [2,1]],
    [30, 'Zn', 'Zinc',         65.38,   12,  4, 'transition',     1.65, '[Ar]3d¹⁰4s²',      [2]],
    [31, 'Ga', 'Gallium',      69.723,  13,  4, 'post_transition',1.81, '[Ar]3d¹⁰4s²4p¹',  [3]],
    [32, 'Ge', 'Germanium',    72.630,  14,  4, 'metalloid',      2.01, '[Ar]3d¹⁰4s²4p²',  [4,2]],
    [33, 'As', 'Arsenic',      74.922,  15,  4, 'metalloid',      2.18, '[Ar]3d¹⁰4s²4p³',  [-3,3,5]],
    [34, 'Se', 'Selenium',     78.971,  16,  4, 'nonmetal',       2.55, '[Ar]3d¹⁰4s²4p⁴',  [-2,4,6]],
    [35, 'Br', 'Bromine',      79.904,  17,  4, 'halogen',        2.96, '[Ar]3d¹⁰4s²4p⁵',  [-1,1,5]],
    [36, 'Kr', 'Krypton',      83.798,  18,  4, 'noble_gas',      null, '[Ar]3d¹⁰4s²4p⁶',  [0]],
    [37, 'Rb', 'Rubidium',     85.468,   1,  5, 'alkali_metal',   0.82, '[Kr]5s¹',          [1]],
    [38, 'Sr', 'Strontium',    87.62,    2,  5, 'alkaline_earth', 0.95, '[Kr]5s²',          [2]],
    [39, 'Y',  'Yttrium',      88.906,   3,  5, 'transition',     1.22, '[Kr]4d¹5s²',       [3]],
    [40, 'Zr', 'Zirconium',    91.224,   4,  5, 'transition',     1.33, '[Kr]4d²5s²',       [4]],
    [41, 'Nb', 'Niobium',      92.906,   5,  5, 'transition',     1.60, '[Kr]4d⁴5s¹',       [5,3]],
    [42, 'Mo', 'Molybdenum',   95.951,   6,  5, 'transition',     2.16, '[Kr]4d⁵5s¹',       [6,4,3,2]],
    [43, 'Tc', 'Technetium',   98,       7,  5, 'transition',     1.90, '[Kr]4d⁵5s²',       [7,4]],
    [44, 'Ru', 'Ruthenium',   101.07,    8,  5, 'transition',     2.20, '[Kr]4d⁷5s¹',       [4,3,2]],
    [45, 'Rh', 'Rhodium',     102.906,   9,  5, 'transition',     2.28, '[Kr]4d⁸5s¹',       [3]],
    [46, 'Pd', 'Palladium',   106.42,   10,  5, 'transition',     2.20, '[Kr]4d¹⁰',         [4,2]],
    [47, 'Ag', 'Silver',      107.868,  11,  5, 'transition',     1.93, '[Kr]4d¹⁰5s¹',      [1]],
    [48, 'Cd', 'Cadmium',     112.411,  12,  5, 'transition',     1.69, '[Kr]4d¹⁰5s²',      [2]],
    [49, 'In', 'Indium',      114.818,  13,  5, 'post_transition',1.78, '[Kr]4d¹⁰5s²5p¹',  [3]],
    [50, 'Sn', 'Tin',         118.710,  14,  5, 'post_transition',1.96, '[Kr]4d¹⁰5s²5p²',  [4,2]],
    [51, 'Sb', 'Antimony',    121.760,  15,  5, 'metalloid',      2.05, '[Kr]4d¹⁰5s²5p³',  [-3,3,5]],
    [52, 'Te', 'Tellurium',   127.60,   16,  5, 'metalloid',      2.10, '[Kr]4d¹⁰5s²5p⁴',  [-2,4,6]],
    [53, 'I',  'Iodine',      126.904,  17,  5, 'halogen',        2.66, '[Kr]4d¹⁰5s²5p⁵',  [-1,1,5,7]],
    [54, 'Xe', 'Xenon',       131.293,  18,  5, 'noble_gas',      null, '[Kr]4d¹⁰5s²5p⁶',  [0]],
    [55, 'Cs', 'Caesium',     132.905,   1,  6, 'alkali_metal',   0.79, '[Xe]6s¹',          [1]],
    [56, 'Ba', 'Barium',      137.327,   2,  6, 'alkaline_earth', 0.89, '[Xe]6s²',          [2]],
    [57, 'La', 'Lanthanum',   138.905,   3,  6, 'lanthanide',     1.10, '[Xe]5d¹6s²',       [3]],
    [58, 'Ce', 'Cerium',      140.116,   null,6,'lanthanide',     1.12, '[Xe]4f¹5d¹6s²',   [3,4]],
    [59, 'Pr', 'Praseodymium',140.908,  null,6, 'lanthanide',     1.13, '[Xe]4f³6s²',       [3]],
    [60, 'Nd', 'Neodymium',   144.242,  null,6, 'lanthanide',     1.14, '[Xe]4f⁴6s²',       [3]],
    [61, 'Pm', 'Promethium',  145,      null,6, 'lanthanide',     1.13, '[Xe]4f⁵6s²',       [3]],
    [62, 'Sm', 'Samarium',    150.36,   null,6, 'lanthanide',     1.17, '[Xe]4f⁶6s²',       [3,2]],
    [63, 'Eu', 'Europium',    151.964,  null,6, 'lanthanide',     1.20, '[Xe]4f⁷6s²',       [3,2]],
    [64, 'Gd', 'Gadolinium',  157.25,   null,6, 'lanthanide',     1.20, '[Xe]4f⁷5d¹6s²',   [3]],
    [65, 'Tb', 'Terbium',     158.925,  null,6, 'lanthanide',     1.10, '[Xe]4f⁹6s²',       [3]],
    [66, 'Dy', 'Dysprosium',  162.500,  null,6, 'lanthanide',     1.22, '[Xe]4f¹⁰6s²',      [3]],
    [67, 'Ho', 'Holmium',     164.930,  null,6, 'lanthanide',     1.23, '[Xe]4f¹¹6s²',      [3]],
    [68, 'Er', 'Erbium',      167.259,  null,6, 'lanthanide',     1.24, '[Xe]4f¹²6s²',      [3]],
    [69, 'Tm', 'Thulium',     168.934,  null,6, 'lanthanide',     1.25, '[Xe]4f¹³6s²',      [3]],
    [70, 'Yb', 'Ytterbium',   173.045,  null,6, 'lanthanide',     1.10, '[Xe]4f¹⁴6s²',      [3,2]],
    [71, 'Lu', 'Lutetium',    174.967,   3,  6, 'lanthanide',     1.27, '[Xe]4f¹⁴5d¹6s²',  [3]],
    [72, 'Hf', 'Hafnium',     178.486,   4,  6, 'transition',     1.30, '[Xe]4f¹⁴5d²6s²',  [4]],
    [73, 'Ta', 'Tantalum',    180.948,   5,  6, 'transition',     1.50, '[Xe]4f¹⁴5d³6s²',  [5]],
    [74, 'W',  'Tungsten',    183.840,   6,  6, 'transition',     2.36, '[Xe]4f¹⁴5d⁴6s²',  [6,4]],
    [75, 'Re', 'Rhenium',     186.207,   7,  6, 'transition',     1.90, '[Xe]4f¹⁴5d⁵6s²',  [7,6,4]],
    [76, 'Os', 'Osmium',      190.23,    8,  6, 'transition',     2.20, '[Xe]4f¹⁴5d⁶6s²',  [4,3]],
    [77, 'Ir', 'Iridium',     192.217,   9,  6, 'transition',     2.20, '[Xe]4f¹⁴5d⁷6s²',  [3,4]],
    [78, 'Pt', 'Platinum',    195.084,  10,  6, 'transition',     2.28, '[Xe]4f¹⁴5d⁹6s¹',  [4,2]],
    [79, 'Au', 'Gold',        196.967,  11,  6, 'transition',     2.54, '[Xe]4f¹⁴5d¹⁰6s¹', [3,1]],
    [80, 'Hg', 'Mercury',     200.592,  12,  6, 'transition',     2.00, '[Xe]4f¹⁴5d¹⁰6s²', [2,1]],
    [81, 'Tl', 'Thallium',   204.383,   13,  6, 'post_transition',2.04, '[Xe]4f¹⁴5d¹⁰6s²6p¹',[3,1]],
    [82, 'Pb', 'Lead',        207.200,  14,  6, 'post_transition',2.33, '[Xe]4f¹⁴5d¹⁰6s²6p²',[4,2]],
    [83, 'Bi', 'Bismuth',    208.980,   15,  6, 'post_transition',2.02, '[Xe]4f¹⁴5d¹⁰6s²6p³',[3,5]],
    [84, 'Po', 'Polonium',    209,      16,  6, 'post_transition',2.00, '[Xe]4f¹⁴5d¹⁰6s²6p⁴',[4,2]],
    [85, 'At', 'Astatine',    210,      17,  6, 'halogen',        2.20, '[Xe]4f¹⁴5d¹⁰6s²6p⁵',[-1,1]],
    [86, 'Rn', 'Radon',       222,      18,  6, 'noble_gas',      null, '[Xe]4f¹⁴5d¹⁰6s²6p⁶',[0]],
    [87, 'Fr', 'Francium',    223,       1,  7, 'alkali_metal',   0.70, '[Rn]7s¹',          [1]],
    [88, 'Ra', 'Radium',      226,       2,  7, 'alkaline_earth', 0.90, '[Rn]7s²',          [2]],
    [89, 'Ac', 'Actinium',    227,       3,  7, 'actinide',       1.10, '[Rn]6d¹7s²',       [3]],
    [90, 'Th', 'Thorium',     232.038,  null,7, 'actinide',       1.30, '[Rn]6d²7s²',       [4]],
    [91, 'Pa', 'Protactinium',231.036,  null,7, 'actinide',       1.50, '[Rn]5f²6d¹7s²',   [5,4]],
    [92, 'U',  'Uranium',     238.029,  null,7, 'actinide',       1.38, '[Rn]5f³6d¹7s²',   [6,5,4,3]],
    [93, 'Np', 'Neptunium',   237,      null,7, 'actinide',       1.36, '[Rn]5f⁴6d¹7s²',   [5,4]],
    [94, 'Pu', 'Plutonium',   244,      null,7, 'actinide',       1.28, '[Rn]5f⁶7s²',       [4,3]],
    [95, 'Am', 'Americium',   243,      null,7, 'actinide',       1.13, '[Rn]5f⁷7s²',       [3]],
    [96, 'Cm', 'Curium',      247,      null,7, 'actinide',       1.28, '[Rn]5f⁷6d¹7s²',   [3]],
    [97, 'Bk', 'Berkelium',   247,      null,7, 'actinide',       1.30, '[Rn]5f⁹7s²',       [3]],
    [98, 'Cf', 'Californium', 251,      null,7, 'actinide',       1.30, '[Rn]5f¹⁰7s²',      [3]],
    [99, 'Es', 'Einsteinium', 252,      null,7, 'actinide',       1.30, '[Rn]5f¹¹7s²',      [3]],
    [100,'Fm', 'Fermium',     257,      null,7, 'actinide',       1.30, '[Rn]5f¹²7s²',      [3]],
    [101,'Md', 'Mendelevium', 258,      null,7, 'actinide',       1.30, '[Rn]5f¹³7s²',      [3]],
    [102,'No', 'Nobelium',    259,      null,7, 'actinide',       1.30, '[Rn]5f¹⁴7s²',      [2,3]],
    [103,'Lr', 'Lawrencium',  266,       3,  7, 'actinide',       1.30, '[Rn]5f¹⁴7p¹',      [3]],
    [104,'Rf', 'Rutherfordium',267,      4,  7, 'transition',     null, '[Rn]5f¹⁴6d²7s²',  [4]],
    [105,'Db', 'Dubnium',     268,       5,  7, 'transition',     null, '[Rn]5f¹⁴6d³7s²',  [5]],
    [106,'Sg', 'Seaborgium',  269,       6,  7, 'transition',     null, '[Rn]5f¹⁴6d⁴7s²',  [6]],
    [107,'Bh', 'Bohrium',     270,       7,  7, 'transition',     null, '[Rn]5f¹⁴6d⁵7s²',  [7]],
    [108,'Hs', 'Hassium',     277,       8,  7, 'transition',     null, '[Rn]5f¹⁴6d⁶7s²',  [8]],
    [109,'Mt', 'Meitnerium',  278,       9,  7, 'transition',     null, '[Rn]5f¹⁴6d⁷7s²',  [3]],
    [110,'Ds', 'Darmstadtium',281,      10,  7, 'transition',     null, '[Rn]5f¹⁴6d⁸7s²',  [0]],
    [111,'Rg', 'Roentgenium', 282,      11,  7, 'transition',     null, '[Rn]5f¹⁴6d¹⁰7s¹', [1]],
    [112,'Cn', 'Copernicium', 285,      12,  7, 'transition',     null, '[Rn]5f¹⁴6d¹⁰7s²', [2]],
    [113,'Nh', 'Nihonium',    286,      13,  7, 'post_transition',null, '[Rn]5f¹⁴6d¹⁰7s²7p¹',[1]],
    [114,'Fl', 'Flerovium',   289,      14,  7, 'post_transition',null, '[Rn]5f¹⁴6d¹⁰7s²7p²',[2]],
    [115,'Mc', 'Moscovium',   290,      15,  7, 'post_transition',null, '[Rn]5f¹⁴6d¹⁰7s²7p³',[1]],
    [116,'Lv', 'Livermorium', 293,      16,  7, 'post_transition',null, '[Rn]5f¹⁴6d¹⁰7s²7p⁴',[2]],
    [117,'Ts', 'Tennessine',  294,      17,  7, 'halogen',        null, '[Rn]5f¹⁴6d¹⁰7s²7p⁵',[-1]],
    [118,'Og', 'Oganesson',   294,      18,  7, 'noble_gas',      null, '[Rn]5f¹⁴6d¹⁰7s²7p⁶',[0]]
  ];

  var ELEMENTS = ELEMENTS_RAW.map(function(r) {
    return {
      Z: r[0], symbol: r[1], name: r[2], atomicMass: r[3],
      group: r[4], period: r[5], classification: r[6],
      electronegativity: r[7], config: r[8], oxidationStates: r[9]
    };
  });

  var CPK_COLORS = {
    H:'#FFFFFF', C:'#202020', N:'#3050F8', O:'#FF0D0D', F:'#90E050',
    Cl:'#1FF01F', Br:'#A62929', I:'#940094', S:'#FFFF30', P:'#FF8000',
    Na:'#AB5CF2', Mg:'#8AFF00', Al:'#BFA6A6', Si:'#F0C8A0', Ca:'#3DFF00',
    Fe:'#E06633', Cu:'#C88033', Zn:'#7D80B0', Ag:'#C0C0C0', Au:'#FFD123',
    Hg:'#B8B8D0', default:'#FF1493'
  };

  // ==========================================================================
  // APPARATUS CATALOG
  // ==========================================================================
  var APPARATUS = [
    { id:'beaker_250',    name:'Beaker (250 mL)',          category:'Glassware',             icon:'fa-flask',       capacity:'250 mL',  material:'Borosilicate glass', description:'General-purpose container for solutions. NOT for accurate volume measurement.' },
    { id:'beaker_100',    name:'Beaker (100 mL)',          category:'Glassware',             icon:'fa-flask',       capacity:'100 mL',  material:'Borosilicate glass', description:'Smaller beaker for limited samples or heating.' },
    { id:'conical_flask', name:'Conical Flask (250 mL)',   category:'Glassware',             icon:'fa-flask',       capacity:'250 mL',  material:'Borosilicate glass', description:'Ideal for titrations — swirling without spillage. Conical shape reduces evaporation.' },
    { id:'test_tube',     name:'Test Tube (standard)',     category:'Glassware',             icon:'fa-vial',        capacity:'20 mL',   material:'Borosilicate glass', description:'Small-scale reactions, heating, and observation. Hold at angle when heating.' },
    { id:'boiling_tube',  name:'Boiling Tube',             category:'Glassware',             icon:'fa-vial',        capacity:'50 mL',   material:'Borosilicate glass', description:'Larger test tube for more vigorous heating or distillation collection.' },
    { id:'vol_flask_250', name:'Volumetric Flask (250 mL)',category:'Glassware',             icon:'fa-flask-vial',  capacity:'250 mL',  material:'Borosilicate glass', description:'Class A precision for making standard solutions. Mark at neck — accuracy ±0.1 mL.' },
    { id:'meas_cyl_100',  name:'Measuring Cylinder (100 mL)',category:'Measuring',          icon:'fa-ruler-vertical',capacity:'100 mL', material:'Borosilicate glass', description:'Approximate volume measurement. Read at bottom of meniscus. Accuracy ±1 mL.' },
    { id:'burette',       name:'Burette (50 mL)',          category:'Measuring',             icon:'fa-ruler-vertical',capacity:'50 mL',  material:'Borosilicate glass', description:'Accurate titrant delivery. Graduated 0–50 mL, smallest division 0.1 mL. Read to ±0.05 mL.' },
    { id:'pipette_25',    name:'Pipette (25 mL)',          category:'Measuring',             icon:'fa-eye-dropper', capacity:'25 mL',  material:'Borosilicate glass', description:'Delivers exact 25.00 mL volume. Drain, do NOT blow last drop.' },
    { id:'burette_stand', name:'Retort Stand & Clamp',    category:'Support',               icon:'fa-align-left',  capacity:null,      material:'Iron/Steel',         description:'Supports burettes, condensers, and flasks during experiments.' },
    { id:'tripod',        name:'Tripod Stand',             category:'Support',               icon:'fa-angles-up',   capacity:null,      material:'Iron',               description:'Supports wire gauze and vessel above Bunsen burner.' },
    { id:'wire_gauze',    name:'Wire Gauze with Ceramic', category:'Support',               icon:'fa-table-cells', capacity:null,      material:'Iron wire/ceramic',   description:'Distributes heat evenly under glassware. Prevents cracking of glass.' },
    { id:'bunsen',        name:'Bunsen Burner',            category:'Heating',               icon:'fa-fire',        capacity:null,      material:'Brass',              description:'Gas burner. Blue flame = high temp. Yellow = safety flame.' },
    { id:'hot_plate',     name:'Hot Plate & Stirrer',     category:'Heating',               icon:'fa-temperature-high',capacity:null,  material:'Metal/ceramic',       description:'Electric heating with optional magnetic stirring. Safer than Bunsen for flammable solvents.' },
    { id:'water_bath',    name:'Water Bath',               category:'Heating',               icon:'fa-water',       capacity:'2 L',     material:'Metal',              description:'Uniform gentle heating at controlled temperature. Used for enzyme assays and crystallisation.' },
    { id:'thermometer',   name:'Thermometer (0–110°C)',   category:'Measuring',             icon:'fa-temperature-high',capacity:null,  material:'Glass/alcohol',      description:'Temperature measurement. Read at eye level. Accuracy ±0.5°C.' },
    { id:'ph_meter',      name:'pH Meter',                 category:'Measuring',             icon:'fa-wave-square', capacity:null,      material:'Electronic',         description:'Digital pH measurement. Calibrate with pH 4 and pH 7 buffer solutions.' },
    { id:'balance',       name:'Electronic Balance (±0.01g)',category:'Measuring',          icon:'fa-scale-balanced',capacity:null,    material:'Electronic',         description:'Tare before use. Mass accuracy ±0.01 g.' },
    { id:'sep_funnel',    name:'Separating Funnel',        category:'Separation',            icon:'fa-filter',      capacity:'250 mL',  material:'Borosilicate glass', description:'Separates immiscible liquids by density difference.' },
    { id:'funnel',        name:'Conical Funnel',           category:'Separation',            icon:'fa-filter',      capacity:null,      material:'Borosilicate glass', description:'Directs liquids into narrow openings. Used with filter paper.' },
    { id:'filter_paper',  name:'Filter Paper',             category:'Separation',            icon:'fa-circle-notch',capacity:null,     material:'Cellulose',          description:'Retains precipitates during gravity filtration.' },
    { id:'condenser',     name:'Liebig Condenser',         category:'Distillation',          icon:'fa-right-left',  capacity:null,      material:'Borosilicate glass', description:'Water-cooled condenser. Water enters at bottom, exits at top.' },
    { id:'round_flask',   name:'Round-Bottom Flask (500 mL)',category:'Distillation',       icon:'fa-circle',      capacity:'500 mL',  material:'Borosilicate glass', description:'Used for distillation and reflux.' },
    { id:'evap_dish',     name:'Evaporating Dish',         category:'Glassware',             icon:'fa-circle',      capacity:'100 mL',  material:'Porcelain',          description:'Evaporation of solvents and crystallisation.' },
    { id:'crucible',      name:'Crucible & Lid',           category:'Glassware',             icon:'fa-circle',      capacity:'25 mL',   material:'Porcelain',          description:'High-temperature heating (>500°C).' },
    { id:'watch_glass',   name:'Watch Glass',              category:'Glassware',             icon:'fa-circle',      capacity:null,      material:'Borosilicate glass', description:'Cover for beakers and holding small solid samples.' },
    { id:'spatula',       name:'Spatula',                  category:'General',               icon:'fa-minus',       capacity:null,      material:'Stainless steel',    description:'Transfer of solid reagents.' },
    { id:'dropper',       name:'Dropper Pipette',          category:'General',               icon:'fa-eye-dropper', capacity:'3 mL',    material:'Glass/plastic',      description:'Dropwise addition of reagents.' },
    { id:'safety_goggles',name:'Safety Goggles',           category:'Safety',                icon:'fa-glasses',     capacity:null,      material:'Polycarbonate',      description:'Mandatory eye protection from chemical splashes.' },
    { id:'lab_coat',      name:'Laboratory Coat',          category:'Safety',                icon:'fa-shirt',       capacity:null,      material:'Cotton',             description:'Protects clothing and skin from spills and splashes.' }
  ];

  // ==========================================================================
  // VALIDATED REACTIONS
  // ==========================================================================
  var REACTIONS = [
    {
      id: 'mg_o2',
      name: 'Magnesium Combustion',
      type: 'combustion',
      equation: '2Mg + O₂ → 2MgO',
      reactants: ['Mg','O₂'],
      products: ['MgO'],
      conditions: 'Heat (ignition)',
      observable: 'Brilliant white flame. White powder (MgO) formed.',
      energetics: 'Exothermic (ΔH = −601 kJ mol⁻¹)'
    },
    {
      id: 'hcl_naoh',
      name: 'Acid-Base Neutralisation',
      type: 'neutralisation',
      equation: 'HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l)',
      reactants: ['HCl','NaOH'],
      products: ['NaCl','H₂O'],
      conditions: 'Room temperature',
      observable: 'Temperature rise. pH reaches 7 at equivalence point.',
      energetics: 'Exothermic (ΔH = −57 kJ mol⁻¹)'
    },
    {
      id: 'caco3_hcl',
      name: 'Calcium Carbonate + Hydrochloric Acid',
      type: 'double_displacement',
      equation: 'CaCO₃(s) + 2HCl(aq) → CaCl₂(aq) + H₂O(l) + CO₂(g)',
      reactants: ['CaCO₃','HCl'],
      products: ['CaCl₂','H₂O','CO₂'],
      conditions: 'Room temperature',
      observable: 'Vigorous effervescence (CO₂). Limewater turns milky.',
      energetics: 'Slightly endothermic overall'
    },
    {
      id: 'h2o2_mno2',
      name: 'Decomposition of Hydrogen Peroxide',
      type: 'decomposition',
      equation: '2H₂O₂(aq) → 2H₂O(l) + O₂(g)',
      reactants: ['H₂O₂'],
      products: ['H₂O','O₂'],
      conditions: 'MnO₂ catalyst',
      observable: 'Rapid gas evolution (O₂). Relights a glowing splint.',
      energetics: 'Exothermic'
    },
    {
      id: 'fe_cuso4',
      name: 'Iron Displacement of Copper',
      type: 'displacement',
      equation: 'Fe(s) + CuSO₄(aq) → FeSO₄(aq) + Cu(s)',
      reactants: ['Fe','CuSO₄'],
      products: ['FeSO₄','Cu'],
      conditions: 'Room temperature',
      observable: 'Blue solution turns pale green. Brown copper coats iron.',
      energetics: 'Exothermic'
    },
    {
      id: 'electrolysis_nacl',
      name: 'Electrolysis of Brine',
      type: 'electrolysis',
      equation: '2NaCl(aq) + 2H₂O(l) → 2NaOH(aq) + Cl₂(g) + H₂(g)',
      reactants: ['NaCl','H₂O'],
      products: ['NaOH','Cl₂','H₂'],
      conditions: 'Electric current',
      observable: 'Cl₂ gas at anode (bleaches litmus), H₂ at cathode (pop test).',
      energetics: 'Endothermic (electrical energy input)'
    },
    {
      id: 'haber',
      name: 'Haber Process (Ammonia Synthesis)',
      type: 'combination',
      equation: 'N₂(g) + 3H₂(g) ⇌ 2NH₃(g)',
      reactants: ['N₂','H₂'],
      products: ['NH₃'],
      conditions: '450°C, 200 atm, Fe catalyst',
      observable: 'Ammonia gas formed. Turns damp red litmus blue.',
      energetics: 'Exothermic (ΔH = −92 kJ mol⁻¹)'
    }
  ];

  // ==========================================================================
  // VSEPR GEOMETRY DEFINITIONS
  // ==========================================================================
  var VSEPR_GEOMETRIES = {
    linear:              { bondPairs:2, lonePairs:0, angle:'180°',  example:'CO₂, BeCl₂',        shape:'linear' },
    bent_2bp_2lp:        { bondPairs:2, lonePairs:2, angle:'104.5°',example:'H₂O',                shape:'bent' },
    bent_2bp_1lp:        { bondPairs:2, lonePairs:1, angle:'~120°', example:'SO₂',                shape:'bent' },
    trigonal_planar:     { bondPairs:3, lonePairs:0, angle:'120°',  example:'BF₃, SO₃',           shape:'trigonal_planar' },
    trigonal_pyramidal:  { bondPairs:3, lonePairs:1, angle:'107°',  example:'NH₃, PCl₃',          shape:'trigonal_pyramidal' },
    tetrahedral:         { bondPairs:4, lonePairs:0, angle:'109.5°',example:'CH₄, SiCl₄',         shape:'tetrahedral' },
    trigonal_bipyramidal:{ bondPairs:5, lonePairs:0, angle:'90°/120°',example:'PCl₅',             shape:'trigonal_bipyramidal' },
    octahedral:          { bondPairs:6, lonePairs:0, angle:'90°',   example:'SF₆, [Fe(CN)₆]³⁻',   shape:'octahedral' }
  };

  // ==========================================================================
  // INDICATOR DATA
  // ==========================================================================
  var INDICATORS = [
    { name:'Universal Indicator', acid_color:'red/orange', neutral_color:'green', base_color:'blue/violet', range:'1–14' },
    { name:'Litmus',              acid_color:'red',         neutral_color:'purple',base_color:'blue',        range:'4.5–8.3' },
    { name:'Phenolphthalein',     acid_color:'colourless',  neutral_color:'colourless',base_color:'pink',    range:'8.2–10.0' },
    { name:'Methyl Orange',       acid_color:'red',         neutral_color:'orange',base_color:'yellow',      range:'3.1–4.4' },
    { name:'Bromothymol Blue',    acid_color:'yellow',      neutral_color:'green', base_color:'blue',         range:'6.0–7.6' }
  ];

  // ==========================================================================
  // FLAME TEST COLOURS
  // ==========================================================================
  var FLAME_TESTS = [
    { ion:'Li⁺', element:'Lithium',   color:'Crimson red',    hex:'#DC143C' },
    { ion:'Na⁺', element:'Sodium',    color:'Golden yellow',  hex:'#FFD700' },
    { ion:'K⁺',  element:'Potassium', color:'Lilac / violet', hex:'#9400D3' },
    { ion:'Ca²⁺',element:'Calcium',   color:'Brick red',      hex:'#B22222' },
    { ion:'Sr²⁺',element:'Strontium', color:'Scarlet red',    hex:'#C80000' },
    { ion:'Ba²⁺',element:'Barium',    color:'Apple green',    hex:'#00A550' },
    { ion:'Cu²⁺',element:'Copper',    color:'Blue-green',     hex:'#00827F' }
  ];

  // ==========================================================================
  // ION PRECIPITATION TESTS
  // ==========================================================================
  var ION_TESTS = [
    { ion:'Cl⁻',  reagent:'AgNO₃(aq) + dilute HNO₃', observation:'White precipitate (AgCl), turns purple in sunlight', color:'#FFFFFF' },
    { ion:'Br⁻',  reagent:'AgNO₃(aq) + dilute HNO₃', observation:'Cream precipitate (AgBr), sparingly soluble in NH₃', color:'#FFFACD' },
    { ion:'I⁻',   reagent:'AgNO₃(aq) + dilute HNO₃', observation:'Yellow precipitate (AgI), insoluble in NH₃',         color:'#FFFF00' },
    { ion:'SO₄²⁻',reagent:'BaCl₂(aq) + dilute HCl',  observation:'White precipitate (BaSO₄), insoluble in excess acid',color:'#FFFFFF' },
    { ion:'CO₃²⁻',reagent:'Dilute HCl',               observation:'Effervescence (CO₂). Limewater turns milky.',       color:'#F5F5F5' },
    { ion:'Cu²⁺', reagent:'NaOH(aq) dropwise',        observation:'Light blue precipitate Cu(OH)₂',                   color:'#4169E1' },
    { ion:'Fe²⁺', reagent:'NaOH(aq) dropwise',        observation:'Dirty green precipitate Fe(OH)₂, turns brown in air',color:'#228B22' },
    { ion:'Fe³⁺', reagent:'NaOH(aq) dropwise',        observation:'Rust-brown precipitate Fe(OH)₃',                    color:'#8B4513' },
    { ion:'NH₄⁺', reagent:'NaOH(aq) + gentle heat',   observation:'Pungent gas (NH₃). Turns moist red litmus blue.',   color:'#FFFDE7' }
  ];

  return {
    ELEMENTS:         ELEMENTS,
    CPK_COLORS:       CPK_COLORS,
    APPARATUS:        APPARATUS,
    REACTIONS:        REACTIONS,
    VSEPR_GEOMETRIES: VSEPR_GEOMETRIES,
    INDICATORS:       INDICATORS,
    FLAME_TESTS:      FLAME_TESTS,
    ION_TESTS:        ION_TESTS,

    getElementById: function(Z) {
      return ELEMENTS.find(function(e) { return e.Z === Z; }) || null;
    },
    getElementBySymbol: function(sym) {
      return ELEMENTS.find(function(e) { return e.symbol === sym; }) || null;
    }
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChemData;
}
