'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const chemistry = require('../public/js/chemistry-simulation');

function vessel(state, type = 'beaker') {
  return chemistry.addContainer(state, type);
}

test('published reaction equations are element-balanced', () => {
  for (const reaction of chemistry.REACTIONS) assert.equal(chemistry.isBalanced(reaction), true, reaction.id);
  const incorrect = {
    reactants: [{ id: 'hydrochloric_acid', coefficient: 1 }],
    products: [{ id: 'sodium_chloride', coefficient: 1 }]
  };
  assert.equal(chemistry.isBalanced(incorrect), false);
});

test('ammonium sulfate reaction balances formula groups and uses the 1:2 mole ratio', () => {
  const reaction = chemistry.REACTIONS.find((item) => item.id === 'ammonium-sulfate-neutralisation');
  assert.ok(reaction);
  assert.equal(chemistry.isBalanced(reaction), true);

  const state = chemistry.makeState();
  const flask = vessel(state, 'conical_flask');
  chemistry.transferFromStock(state, 'sulfuric_acid', 20, flask.id);
  chemistry.transferFromStock(state, 'ammonia_solution', 40, flask.id);
  chemistry.addApparatus(state, 'glass_rod');
  const result = chemistry.mix(state, flask.id);
  assert.equal(result.reactions[0].limitingExtentMol, 0.002);
  const salt = chemistry.inspect(flask).species.find((item) => item.id === 'ammonium_sulfate');
  assert.equal(salt.formula, '(NH4)2SO4');
  assert.equal(salt.moles, 0.002);
  assert.equal(salt.concentrationMolPerL, 0.03333333333333333);
  assert.equal(state.products.some((item) => item.id === 'water'), false);
});

test('persisted state validation rejects impossible stock, contents, and container capacities', () => {
  const state = chemistry.makeState();
  assert.equal(chemistry.validateState(state), true);
  state.stock.hydrochloric_acid.ml = 501;
  assert.throws(() => chemistry.validateState(state), /Stock quantity/);
});

test('measured stock transfer changes both stock and solution composition', () => {
  const state = chemistry.makeState();
  const beaker = vessel(state);
  chemistry.transferFromStock(state, 'hydrochloric_acid', 25, beaker.id);
  assert.equal(state.stock.hydrochloric_acid.ml, 475);
  assert.equal(beaker.volumeMl, 25);
  assert.equal(beaker.species.hydrochloric_acid, 0.0025);
  assert.throws(() => chemistry.transferFromStock(state, 'hydrochloric_acid', 3000, beaker.id), /not enough stock/);
});

test('acid-base mixing calculates stoichiometric limiting reactant and excess pH', () => {
  const state = chemistry.makeState();
  const beaker = vessel(state);
  chemistry.transferFromStock(state, 'hydrochloric_acid', 25, beaker.id);
  chemistry.transferFromStock(state, 'sodium_hydroxide', 10, beaker.id);
  assert.throws(() => chemistry.mix(state, beaker.id), /glass stirring rod/);
  chemistry.addApparatus(state, 'glass_rod');
  const result = chemistry.mix(state, beaker.id);
  assert.equal(result.reactions.length, 1);
  assert.equal(result.reactions[0].limitingExtentMol, 0.001);
  assert.ok(Math.abs(beaker.species.hydrochloric_acid - 0.0015) < 1e-12);
  assert.ok(Math.abs(result.pH - -Math.log10(0.0015 / 0.035)) < 1e-8);
  assert.ok(beaker.species.sodium_chloride > 0);
  assert.ok(state.products.some((product) => product.id === 'water' && product.formula === 'H2O' && product.moles === 0.001));
});

test('stoichiometric strong-acid/strong-base neutralisation reports neutral pH', () => {
  const state = chemistry.makeState();
  const beaker = vessel(state);
  chemistry.transferFromStock(state, 'hydrochloric_acid', 25, beaker.id);
  chemistry.transferFromStock(state, 'sodium_hydroxide', 25, beaker.id);
  chemistry.addApparatus(state, 'glass_rod');
  chemistry.mix(state, beaker.id);
  assert.equal(chemistry.calculatePH(beaker), 7);
});

test('precipitate quantity follows the limiting reagent and filtration needs real apparatus', () => {
  const state = chemistry.makeState();
  const beaker = vessel(state);
  chemistry.transferFromStock(state, 'calcium_chloride', 20, beaker.id);
  chemistry.transferFromStock(state, 'sodium_carbonate', 10, beaker.id);
  chemistry.addApparatus(state, 'glass_rod');
  const result = chemistry.mix(state, beaker.id);
  assert.equal(result.reactions[0].limitingExtentMol, 0.001);
  assert.equal(beaker.precipitates[0].formula, 'CaCO3');
  assert.ok(Math.abs(beaker.precipitates[0].massG - 0.1000869) < 1e-9);
  assert.throws(() => chemistry.filterPrecipitate(state, beaker.id), /funnel and filter paper/);
  chemistry.addApparatus(state, 'funnel');
  chemistry.addApparatus(state, 'filter_paper');
  const receiver = vessel(state);
  chemistry.filterPrecipitate(state, beaker.id, receiver.id);
  assert.equal(beaker.precipitates.length, 0);
  assert.equal(beaker.separatedSolids.length, 1);
  assert.equal(beaker.volumeMl, 0);
  assert.equal(receiver.volumeMl, 30);
  assert.ok(receiver.species.sodium_chloride > 0);
});

test('unknown combinations do not create products', () => {
  const state = chemistry.makeState();
  const beaker = vessel(state);
  chemistry.transferFromStock(state, 'hydrochloric_acid', 10, beaker.id);
  chemistry.addApparatus(state, 'glass_rod');
  const result = chemistry.mix(state, beaker.id);
  assert.equal(result.unsupported, true);
  assert.equal(beaker.species.hydrochloric_acid, 0.001);
  assert.equal(state.products.length, 0);
});

test('solution preparation uses molar mass, solubility, and measured final volume', () => {
  const state = chemistry.makeState();
  const flask = vessel(state, 'volumetric_flask');
  chemistry.transferFromStock(state, 'water', 80, flask.id);
  chemistry.addSolid(state, 'sodium_chloride', 5, flask.id);
  chemistry.setFinalVolume(state, flask.id, 100);
  assert.equal(flask.volumeMl, 100);
  assert.equal(state.stock.water.ml, 2900);
  assert.ok(Math.abs(chemistry.calculateConcentration(flask.species.sodium_chloride, flask.volumeMl) - 0.855578371) < 1e-8);
  assert.throws(() => chemistry.addSolid(state, 'sodium_chloride', 50, flask.id), /not enough solid/);
});

test('dilution by measured transfer conserves dissolved amount', () => {
  const state = chemistry.makeState();
  const source = vessel(state);
  const destination = vessel(state, 'volumetric_flask');
  chemistry.transferFromStock(state, 'hydrochloric_acid', 100, source.id);
  chemistry.transferBetweenContainers(state, source.id, destination.id, 10);
  assert.equal(source.volumeMl, 90);
  assert.equal(destination.volumeMl, 10);
  assert.ok(Math.abs(destination.species.hydrochloric_acid - 0.001) < 1e-12);
  chemistry.transferFromStock(state, 'water', 90, destination.id);
  chemistry.setFinalVolume(state, destination.id, 100);
  assert.ok(Math.abs(chemistry.inspect(destination).species[0].concentrationMolPerL - 0.01) < 1e-12);
});

test('ChemCollective glucose dilution equipment prepares the stated 0.025 M solution', () => {
  const state = chemistry.makeState();
  const flask = vessel(state, 'volumetric_flask_1000');
  chemistry.addApparatus(state, 'pipette_25');
  chemistry.transferFromStock(state, 'glucose', 25, flask.id);
  chemistry.setFinalVolume(state, flask.id, 1000);
  const glucose = chemistry.inspect(flask).species.find((item) => item.id === 'glucose');
  assert.equal(glucose.concentrationMolPerL, 0.025);
  assert.equal(state.stock.glucose.ml, 75);
  assert.equal(state.stock.water.ml, 2025);
  assert.equal(flask.volumeMl, 1000);
});

test('ChemCollective activity stockroom equipment and capacities are represented', () => {
  const expectedVessels = {
    beaker: 250, beaker_600: 600, beaker_1000: 1000,
    conical_flask: 250, conical_flask_500: 500, conical_flask_1000: 1000,
    measuring_cylinder_10: 10, measuring_cylinder_25: 25,
    measuring_cylinder_50: 50, measuring_cylinder: 100,
    volumetric_flask: 100, volumetric_flask_250: 250,
    volumetric_flask_500: 500, volumetric_flask_1000: 1000,
    foam_cup: 200
  };
  for (const [type, capacity] of Object.entries(expectedVessels)) {
    assert.equal(chemistry.APPARATUS[type].capacityMl, capacity, type);
    assert.equal(chemistry.APPARATUS[type].kind, 'vessel', type);
  }
  for (const type of [
    'pipette_5', 'pipette_10', 'pipette_25', 'disposable_pipette',
    'weigh_boat', 'burette_50', 'bunsen_burner', 'scale',
    'evaporating_dish', 'tripod_stand', 'wire_gauze', 'watch_glass'
  ]) {
    assert.equal(chemistry.APPARATUS[type].kind, 'apparatus', type);
  }
  assert.throws(() => chemistry.addApparatus(chemistry.makeState(), 'measuring_cylinder'), /available apparatus/);
  assert.equal(chemistry.CHEMICALS.ammonium_sulfate.availableAsStock, false);
});

test('legacy saved runs without glucose stock remain valid', () => {
  const state = chemistry.makeState();
  delete state.stock.glucose;
  delete state.stock.sulfuric_acid;
  delete state.stock.ammonia_solution;
  delete state.stock.ammonium_sulfate;
  assert.equal(chemistry.validateState(state), true);
});
