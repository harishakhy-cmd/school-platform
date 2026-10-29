/**
 * Interactive Geography & Earth Sciences Laboratory
 * Scientific Hydrology, Storm Hydrograph & Weather Station Instrument Engine
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.GeoWeatherHydro = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const GeoWeatherHydro = {};

  // 1. RELATIVE HUMIDITY & HYGROMETER PSYCHROMETRIC CALCULATOR
  // Formula based on Magnus-Tetens approximation
  GeoWeatherHydro.calculateRelativeHumidity = function (dryBulbC, wetBulbC, pressureHpa = 1013.25) {
    const depression = dryBulbC - wetBulbC;
    if (depression < 0) {
      return { error: 'Wet bulb temperature cannot exceed dry bulb temperature' };
    }

    // Saturation vapor pressure at dry bulb (es) and wet bulb (ew)
    const es = 6.112 * Math.exp((17.67 * dryBulbC) / (dryBulbC + 243.5));
    const ew = 6.112 * Math.exp((17.67 * wetBulbC) / (wetBulbC + 243.5));

    // Actual vapor pressure (e) via psychrometric constant A = 0.00066 * (1 + 0.00115 * Tw)
    const A = 0.00066 * (1 + 0.00115 * wetBulbC);
    const e = ew - A * pressureHpa * depression;

    const relativeHumidity = Math.max(0, Math.min(100, (e / es) * 100));

    // Dew point temperature approximation
    const b = (Math.log(relativeHumidity / 100) + (17.27 * dryBulbC) / (237.3 + dryBulbC));
    const dewPointC = (237.3 * b) / (17.27 - b);

    return {
      dryBulbC: parseFloat(dryBulbC.toFixed(1)),
      wetBulbC: parseFloat(wetBulbC.toFixed(1)),
      wetBulbDepressionC: parseFloat(depression.toFixed(1)),
      relativeHumidityPercent: Math.round(relativeHumidity),
      dewPointC: parseFloat(dewPointC.toFixed(1)),
      comfortLevel: relativeHumidity < 30 ? 'Dry / Arid' : relativeHumidity <= 65 ? 'Comfortable' : 'Humid / Muggy'
    };
  };

  // 2. SOLAR ALTITUDE & SUN DECLINATION ASTRONOMY CALCULATOR
  GeoWeatherHydro.calculateSolarPosition = function (latitudeDeg, dayOfYear) {
    // Cooper's equation for solar declination delta in degrees
    const declinationDeg = 23.45 * Math.sin(((284 + dayOfYear) / 365) * 2 * Math.PI);

    // Solar noon altitude: 90 - |lat - declination|
    const zenithAngleDeg = Math.abs(latitudeDeg - declinationDeg);
    const solarAltitudeDeg = Math.max(0, 90 - zenithAngleDeg);

    // Approximate day length in hours at given latitude
    const latRad = latitudeDeg * (Math.PI / 180);
    const decRad = declinationDeg * (Math.PI / 180);
    let hourAngleCos = -Math.tan(latRad) * Math.tan(decRad);
    let dayLengthHours = 12;

    if (hourAngleCos <= -1) {
      dayLengthHours = 24; // Midnight sun
    } else if (hourAngleCos >= 1) {
      dayLengthHours = 0; // Polar night
    } else {
      const hourAngleRad = Math.acos(hourAngleCos);
      dayLengthHours = (2 * hourAngleRad * (180 / Math.PI)) / 15;
    }

    let seasonName = 'Equinox Period';
    if (dayOfYear >= 70 && dayOfYear <= 90) seasonName = 'Vernal Equinox (Sun overhead at Equator 0°)';
    else if (dayOfYear >= 160 && dayOfYear <= 180) seasonName = 'Northern Solstice (Sun overhead at Tropic of Cancer 23.5°N)';
    else if (dayOfYear >= 255 && dayOfYear <= 275) seasonName = 'Autumnal Equinox (Sun overhead at Equator 0°)';
    else if (dayOfYear >= 345 || dayOfYear <= 15) seasonName = 'Southern Solstice (Sun overhead at Tropic of Capricorn 23.5°S)';

    return {
      dayOfYear,
      latitudeDeg,
      declinationDeg: parseFloat(declinationDeg.toFixed(2)),
      solarNoonAltitudeDeg: parseFloat(solarAltitudeDeg.toFixed(2)),
      dayLengthHours: parseFloat(dayLengthHours.toFixed(1)),
      seasonName
    };
  };

  // 3. RIVER STORM HYDROGRAPH SIMULATOR
  GeoWeatherHydro.generateStormHydrograph = function (rainfallPeakMm = 45, basinType = 'rural_vegetated') {
    // Basin parameters: 'urban_impervious' vs 'rural_vegetated' vs 'deforested_steep'
    let lagTimeHours = 6;
    let baseFlowCumecs = 12;
    let peakDischargeMultiplier = 2.2;

    if (basinType === 'urban_impervious') {
      lagTimeHours = 2.5; // Short lag time, steep rising limb
      peakDischargeMultiplier = 4.2;
    } else if (basinType === 'deforested_steep') {
      lagTimeHours = 3.5;
      peakDischargeMultiplier = 3.6;
    }

    const timeStepsHours = [];
    const rainfallSeries = [];
    const dischargeSeries = [];
    const totalHours = 24;

    for (let h = 0; h <= totalHours; h += 1) {
      timeStepsHours.push(h);

      // Storm hyetograph: rainfall concentrated in hours 2 to 5
      let rain = 0;
      if (h === 2) rain = rainfallPeakMm * 0.4;
      else if (h === 3) rain = rainfallPeakMm;
      else if (h === 4) rain = rainfallPeakMm * 0.7;
      else if (h === 5) rain = rainfallPeakMm * 0.2;
      rainfallSeries.push(rain);

      // River discharge curve (unit hydrograph gamma curve)
      const stormPeakHour = 3 + lagTimeHours;
      const sigma = lagTimeHours * 0.7;
      const exponent = -Math.pow(h - stormPeakHour, 2) / (2 * Math.pow(sigma, 2));
      const stormFlow = (rainfallPeakMm * peakDischargeMultiplier) * Math.exp(exponent);

      dischargeSeries.push(parseFloat((baseFlowCumecs + (h >= 2 ? stormFlow : 0)).toFixed(1)));
    }

    const peakDischarge = Math.max(...dischargeSeries);
    const peakDischargeHour = timeStepsHours[dischargeSeries.indexOf(peakDischarge)];

    return {
      basinType,
      rainfallPeakMm,
      lagTimeHours,
      peakDischargeCumecs: peakDischarge,
      peakHour: peakDischargeHour,
      baseFlowCumecs,
      timeStepsHours,
      rainfallSeries,
      dischargeSeries
    };
  };

  return GeoWeatherHydro;
});
