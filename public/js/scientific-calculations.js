(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ScientificCalculations = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const UNIT_GROUPS = {
    length: { m: 1, cm: 0.01, mm: 0.001, km: 1000, um: 1e-6 },
    area: { 'm2': 1, 'cm2': 1e-4, 'mm2': 1e-6, 'km2': 1e6 },
    volume: { 'm3': 1, L: 0.001, mL: 1e-6, 'cm3': 1e-6 },
    mass: { kg: 1, g: 0.001, mg: 1e-6, tonne: 1000 },
    time: { s: 1, ms: 0.001, min: 60, h: 3600 },
    pressure: { Pa: 1, kPa: 1000, bar: 100000, atm: 101325, mmHg: 133.322387415 },
    density: { 'kg/m3': 1, 'g/cm3': 1000, 'g/mL': 1000 },
    concentration: { 'mol/L': 1, 'mmol/L': 0.001, 'mol/m3': 0.001 },
    velocity: { 'm/s': 1, 'km/h': 1 / 3.6, 'cm/s': 0.01 },
    acceleration: { 'm/s2': 1, 'cm/s2': 0.01 },
    angle: { rad: 1, deg: Math.PI / 180 }
  };

  function finite(value, label) {
    const number = Number(value);
    if (!Number.isFinite(number)) throw new TypeError(`${label} must be a finite number.`);
    return number;
  }

  function convert(value, from, to) {
    const input = finite(value, 'Value');
    if (from === to) return input;
    if (from === 'C' || from === 'K' || from === 'F' || to === 'C' || to === 'K' || to === 'F') {
      const kelvin = from === 'C' ? input + 273.15 : from === 'F' ? (input - 32) * 5 / 9 + 273.15 : from === 'K' ? input : NaN;
      if (!Number.isFinite(kelvin)) throw new RangeError('Unsupported temperature unit.');
      const result = to === 'C' ? kelvin - 273.15 : to === 'F' ? (kelvin - 273.15) * 9 / 5 + 32 : to === 'K' ? kelvin : NaN;
      if (!Number.isFinite(result)) throw new RangeError('Unsupported temperature unit.');
      return result;
    }
    const group = Object.values(UNIT_GROUPS).find((units) => Object.hasOwn(units, from) && Object.hasOwn(units, to));
    if (!group) throw new RangeError(`Cannot convert ${from} to ${to}.`);
    return input * group[from] / group[to];
  }

  function liquidVolumeFraction(container, fillHeightFraction) {
    const u = Math.max(0, Math.min(1, finite(fillHeightFraction, 'Fill height fraction')));
    if (container === 'cone') return 1 - Math.pow(1 - u, 3); // broad base, pointed top
    if (container === 'hemisphere') return (3 * u - Math.pow(u, 3)) / 2; // flat circular base, dome above
    return u; // prismatic/cylindrical vertical walls
  }

  function liquidVolumeAtFill(capacity, container, fillPercent) {
    const cap = finite(capacity, 'Container capacity');
    if (cap < 0) throw new RangeError('Container capacity cannot be negative.');
    return cap * liquidVolumeFraction(container, finite(fillPercent, 'Fill percentage') / 100);
  }

  function molarConcentration(massGrams, volumeLitres, molarMassGramsPerMol) {
    const mass = finite(massGrams, 'Mass');
    const volume = finite(volumeLitres, 'Volume');
    const molarMass = finite(molarMassGramsPerMol, 'Molar mass');
    if (mass < 0 || volume <= 0 || molarMass <= 0) throw new RangeError('Mass must be non-negative; volume and molar mass must be positive.');
    return mass / molarMass / volume;
  }

  function propagatedUncertainty(value, uncertainty, scale = 1) {
    const magnitude = finite(value, 'Value');
    const error = finite(uncertainty, 'Uncertainty');
    const factor = finite(scale, 'Scale');
    if (error < 0) throw new RangeError('Uncertainty cannot be negative.');
    return { value: magnitude * factor, uncertainty: error * Math.abs(factor) };
  }

  return { convert, liquidVolumeFraction, liquidVolumeAtFill, molarConcentration, propagatedUncertainty };
});
