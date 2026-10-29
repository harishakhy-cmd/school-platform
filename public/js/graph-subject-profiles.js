/**
 * Client-Side Subject Profiles Registry
 * Interactive Graphing & Data Visualization Lab
 */

window.GRAPH_SUBJECT_PROFILES = {
  MATHEMATICS: {
    id: 'MATHEMATICS',
    name: 'Mathematics',
    icon: 'fa-square-root-variable',
    color: '#2563EB',
    defaultGraphType: 'cartesian_function',
    supportedGraphTypes: [
      { id: 'cartesian_function', name: 'Function Plotter y = f(x)', icon: 'fa-chart-line' },
      { id: 'scatter_plot', name: 'Coordinate Points & Scatter', icon: 'fa-braille' },
      { id: 'inequalities', name: 'Inequalities & Regions', icon: 'fa-draw-polygon' }
    ],
    defaultUnits: { x: '', y: '' },
    variableLabels: { x: 'x', y: 'y = f(x)' },
    presets: [
      { name: 'Linear: y = mx + c', expr: 'm * x + c', params: { m: 2, c: 1 } },
      { name: 'Quadratic: y = ax² + bx + c', expr: 'a * x^2 + b * x + c', params: { a: 1, b: -2, c: -3 } },
      { name: 'Cubic: y = ax³ + bx² + cx + d', expr: 'a * x^3 + b * x^2 + c * x + d', params: { a: 1, b: 0, c: -3, d: 0 } },
      { name: 'Reciprocal / Hyperbola: y = a / x', expr: 'a / x', params: { a: 1 } },
      { name: 'Exponential: y = a · e^(kx)', expr: 'a * exp(k * x)', params: { a: 1, k: 0.5 } },
      { name: 'Logarithmic: y = a · ln(x)', expr: 'a * log(x)', params: { a: 1 } },
      { name: 'Trigonometric Sine: y = A·sin(Bx + C) + D', expr: 'A * sin(B * x + C) + D', params: { A: 2, B: 1, C: 0, D: 0 } },
      { name: 'Trigonometric Cosine: y = A·cos(Bx + C) + D', expr: 'A * cos(B * x + C) + D', params: { A: 2, B: 1, C: 0, D: 0 } },
      { name: 'Absolute Value: y = a·|x - h| + k', expr: 'a * abs(x - h) + k', params: { a: 1, h: 0, k: 0 } }
    ],
    analysisTools: [
      { id: 'coordinate_inspect', name: 'Coordinate Inspector', icon: 'fa-crosshairs' },
      { id: 'roots', name: 'Roots / Zeros (x-intercepts)', icon: 'fa-bullseye' },
      { id: 'extrema', name: 'Extrema (Max / Min Turning Points)', icon: 'fa-arrows-up-down' },
      { id: 'intersections', name: 'Curve Intersections', icon: 'fa-circle-xmark' },
      { id: 'tangent', name: 'Tangent Line & Derivative (dy/dx)', icon: 'fa-slash' },
      { id: 'integral', name: 'Area Under Curve (Definite Integral ∫)', icon: 'fa-shapes' },
      { id: 'table', name: 'Table of Values & Step Generator', icon: 'fa-table' }
    ]
  },

  PHYSICS: {
    id: 'PHYSICS',
    name: 'Physics',
    icon: 'fa-atom',
    color: '#0284C7',
    defaultGraphType: 'scientific_data',
    supportedGraphTypes: [
      { id: 'scientific_data', name: 'Scientific Laboratory Experiment (X-Y)', icon: 'fa-flask' },
      { id: 'cartesian_function', name: 'Theoretical Physical Law Curve', icon: 'fa-chart-line' },
      { id: 'scatter_plot', name: 'Experimental Scatter & Best-Fit Line', icon: 'fa-braille' }
    ],
    defaultUnits: { x: 's', y: 'm' },
    variableLabels: { x: 'Time (t)', y: 'Displacement (s)' },
    presets: [
      { name: 'Displacement vs Time: s = ut + ½at²', expr: 'u * x + 0.5 * a * x^2', params: { u: 0, a: 9.8 }, xLabel: 'Time (t)', xUnit: 's', yLabel: 'Distance (s)', yUnit: 'm' },
      { name: 'Velocity vs Time: v = u + at', expr: 'u + a * x', params: { u: 0, a: 2.5 }, xLabel: 'Time (t)', xUnit: 's', yLabel: 'Velocity (v)', yUnit: 'm/s' },
      { name: 'Ohm’s Law: V = I · R', expr: 'R * x', params: { R: 10 }, xLabel: 'Current (I)', xUnit: 'A', yLabel: 'Voltage (V)', yUnit: 'V' },
      { name: 'Hooke’s Law: F = k · x', expr: 'k * x', params: { k: 50 }, xLabel: 'Extension (x)', xUnit: 'm', yLabel: 'Force (F)', yUnit: 'N' },
      { name: 'Simple Harmonic Wave: y = A·sin(ωt)', expr: 'A * sin(w * x)', params: { A: 5, w: 2 }, xLabel: 'Time (t)', xUnit: 's', yLabel: 'Displacement (y)', yUnit: 'cm' }
    ],
    analysisTools: [
      { id: 'slope', name: 'Gradient / Slope (Velocity / Resistance / k)', icon: 'fa-chart-line' },
      { id: 'best_fit', name: 'Linear & Polynomial Best-Fit Line', icon: 'fa-arrow-trend-up' },
      { id: 'tangent', name: 'Instantaneous Rate of Change', icon: 'fa-slash' },
      { id: 'integral', name: 'Area Under Curve (Work / Impulse / Distance)', icon: 'fa-shapes' },
      { id: 'stats', name: 'Mean, Std Deviation & R² Correlation', icon: 'fa-calculator' }
    ]
  },

  CHEMISTRY: {
    id: 'CHEMISTRY',
    name: 'Chemistry',
    icon: 'fa-vial',
    color: '#D97706',
    defaultGraphType: 'scientific_data',
    supportedGraphTypes: [
      { id: 'scientific_data', name: 'Titration & Reaction Kinetics', icon: 'fa-flask-vial' },
      { id: 'cartesian_function', name: 'Kinetics & Rate Laws', icon: 'fa-chart-line' },
      { id: 'scatter_plot', name: 'Solubility & Calibration Curves', icon: 'fa-braille' }
    ],
    defaultUnits: { x: 'mL', y: 'pH' },
    variableLabels: { x: 'Volume Added (V)', y: 'pH Value' },
    presets: [
      { name: 'Acid-Base Titration Sigmoid Curve', expr: '7 + 6 * (2 / (1 + exp(-0.8 * (x - 25))) - 1)', params: {}, xLabel: 'Titrant Volume', xUnit: 'mL', yLabel: 'pH', yUnit: 'pH' },
      { name: '1st Order Reaction Kinetics: [A] = [A]₀ · e^(-kt)', expr: 'A0 * exp(-k * x)', params: { A0: 1.0, k: 0.05 }, xLabel: 'Time (t)', xUnit: 'min', yLabel: 'Concentration [A]', yUnit: 'M' },
      { name: 'Beer-Lambert Absorbance Law: A = ε · c', expr: 'epsilon * x', params: { epsilon: 150 }, xLabel: 'Concentration (c)', xUnit: 'M', yLabel: 'Absorbance (A)', yUnit: 'AU' }
    ],
    analysisTools: [
      { id: 'equivalence_point', name: 'Equivalence & End-Point Finder', icon: 'fa-bullseye' },
      { id: 'best_fit', name: 'Calibration Curve & R² Correlation', icon: 'fa-arrow-trend-up' },
      { id: 'stats', name: 'Data Point Statistics', icon: 'fa-calculator' }
    ]
  },

  BIOLOGY: {
    id: 'BIOLOGY',
    name: 'Biology',
    icon: 'fa-dna',
    color: '#059669',
    defaultGraphType: 'scientific_data',
    supportedGraphTypes: [
      { id: 'scientific_data', name: 'Biological Growth & Enzyme Kinetics', icon: 'fa-seedling' },
      { id: 'cartesian_function', name: 'Population Modeling & Sigmoids', icon: 'fa-chart-line' },
      { id: 'bar_chart', name: 'Species & Phenotypic Comparisons', icon: 'fa-chart-column' }
    ],
    defaultUnits: { x: '°C', y: 'μmol/min' },
    variableLabels: { x: 'Environmental Factor', y: 'Biological Rate / Yield' },
    presets: [
      { name: 'Enzyme Activity vs Temperature Bell Curve', expr: 'Vmax * exp(-0.5 * ((x - Topt) / 10)^2)', params: { Vmax: 100, Topt: 37 }, xLabel: 'Temperature', xUnit: '°C', yLabel: 'Enzyme Activity', yUnit: '%' },
      { name: 'Logistic Population Growth: N(t) = K / (1 + A·e^(-rt))', expr: 'K / (1 + A * exp(-r * x))', params: { K: 500, A: 49, r: 0.3 }, xLabel: 'Time (t)', xUnit: 'days', yLabel: 'Population Size (N)', yUnit: 'individuals' },
      { name: 'Michaelis-Menten Enzyme Kinetics: V = (Vmax · [S]) / (Km + [S])', expr: '(Vmax * x) / (Km + x)', params: { Vmax: 100, Km: 15 }, xLabel: 'Substrate Concentration [S]', xUnit: 'mM', yLabel: 'Initial Velocity (V₀)', yUnit: 'μmol/min' }
    ],
    analysisTools: [
      { id: 'optimum_point', name: 'Optimum Environmental Point (Peak)', icon: 'fa-arrow-up' },
      { id: 'carrying_capacity', name: 'Carrying Capacity Asymptote (K)', icon: 'fa-grip-lines' },
      { id: 'stats', name: 'Descriptive Statistics & Error Bars', icon: 'fa-chart-simple' }
    ]
  },

  ECONOMICS: {
    id: 'ECONOMICS',
    name: 'Economics & Commerce',
    icon: 'fa-coins',
    color: '#E11D48',
    defaultGraphType: 'cartesian_function',
    supportedGraphTypes: [
      { id: 'cartesian_function', name: 'Supply, Demand & Market Curves', icon: 'fa-chart-line' },
      { id: 'bar_chart', name: 'Sectoral Distribution & Trade', icon: 'fa-chart-column' },
      { id: 'line_graph', name: 'Time-Series Economic Indicators', icon: 'fa-arrow-trend-up' }
    ],
    defaultUnits: { x: 'Units', y: '$' },
    variableLabels: { x: 'Quantity (Q)', y: 'Price (P)' },
    presets: [
      { name: 'Market Equilibrium: Demand & Supply', expr: '100 - 1.2 * x', params: {}, xLabel: 'Quantity (Q)', xUnit: 'units', yLabel: 'Price (P)', yUnit: '$' },
      { name: 'Total Cost vs Total Revenue', expr: '25 * x', params: {}, xLabel: 'Output Quantity (Q)', xUnit: 'units', yLabel: 'Revenue / Cost', yUnit: '$' }
    ],
    analysisTools: [
      { id: 'equilibrium', name: 'Equilibrium Price & Quantity (P*, Q*)', icon: 'fa-scale-balanced' },
      { id: 'intersections', name: 'Curve Intersections', icon: 'fa-circle-xmark' },
      { id: 'integral', name: 'Consumer & Producer Surplus Area', icon: 'fa-shapes' }
    ]
  },

  GEOGRAPHY: {
    id: 'GEOGRAPHY',
    name: 'Geography & Environment',
    icon: 'fa-earth-africa',
    color: '#0D9488',
    defaultGraphType: 'bar_line_combo',
    supportedGraphTypes: [
      { id: 'bar_line_combo', name: 'Climograph (Rainfall + Temp)', icon: 'fa-cloud-sun-rain' },
      { id: 'line_graph', name: 'River Discharge Hydrograph', icon: 'fa-water' },
      { id: 'bar_chart', name: 'Population Pyramids & Demographics', icon: 'fa-chart-column' }
    ],
    defaultUnits: { x: 'Month', y: 'mm' },
    variableLabels: { x: 'Month / Timeline', y: 'Precipitation (mm)' },
    presets: [
      { name: 'Climograph: Equatorial Rainforest (Entebbe)', type: 'climograph', data: { rainfall: [88, 102, 168, 256, 242, 122, 75, 84, 98, 125, 172, 118], temp: [26.2, 26.5, 26.1, 25.8, 25.4, 25.1, 24.8, 25.2, 25.6, 26.0, 26.1, 25.9] } },
      { name: 'Climograph: Tropical Savanna (Gulu)', type: 'climograph', data: { rainfall: [18, 32, 88, 164, 215, 178, 204, 235, 192, 142, 64, 22], temp: [28.4, 29.1, 28.5, 27.2, 26.3, 25.8, 25.2, 25.4, 25.9, 26.4, 27.1, 27.8] } },
      { name: 'Climograph: Semi-Arid Pastoral (Moroto)', type: 'climograph', data: { rainfall: [12, 18, 45, 95, 120, 85, 78, 65, 42, 38, 25, 15], temp: [31.2, 32.0, 31.5, 29.8, 28.5, 27.9, 27.4, 27.6, 28.2, 29.1, 30.0, 30.8] } },
      { name: 'Flood Hydrograph: Storm Discharge vs Time', expr: 'Qbase + Qpeak * exp(-0.5 * ((x - tpeak) / 5)^2)', params: { Qbase: 20, Qpeak: 120, tpeak: 14 }, xLabel: 'Time after storm initiation', xUnit: 'hours', yLabel: 'River Discharge', yUnit: 'm³/s', xMin: 0, xMax: 48, yMin: 0, yMax: 160 },
      { name: 'Glacial Recession: Rwenzori Ice Cap (1906-2024)', expr: 'A0 * exp(-k * x)', params: { A0: 7.5, k: 0.026 }, xLabel: 'Years elapsed since 1906', xUnit: 'years', yLabel: 'Glacial Surface Area', yUnit: 'km²', xMin: 0, xMax: 130, yMin: 0, yMax: 8 },
      { name: 'River Longitudinal Profile: Source to Base Level', expr: 'H0 * exp(-k * x)', params: { H0: 3500, k: 0.012 }, xLabel: 'Downstream Distance from Source', xUnit: 'km', yLabel: 'Channel Bed Elevation', yUnit: 'm', xMin: 0, xMax: 300, yMin: 0, yMax: 4000 },
      { name: 'Demographic Transition Model: Birth vs Death Rate', expr: '15 + 30 / (1 + exp(0.08 * (x - 40)))', params: {}, xLabel: 'Development Timeline (Stages 1 to 5)', xUnit: 'decades', yLabel: 'Crude Rate per 1,000', yUnit: 'per 1000', xMin: 0, xMax: 80, yMin: 0, yMax: 50 }
    ],
    analysisTools: [
      { id: 'stats', name: 'Annual Totals & Seasonal Variance', icon: 'fa-calculator' }
    ]
  },

  STATISTICS: {
    id: 'STATISTICS',
    name: 'Statistics & Data Science',
    icon: 'fa-chart-pie',
    color: '#7C3AED',
    defaultGraphType: 'histogram',
    supportedGraphTypes: [
      { id: 'histogram', name: 'Histogram & Frequency Distribution', icon: 'fa-chart-column' },
      { id: 'scatter_plot', name: 'Scatter Plot & Linear Regression', icon: 'fa-braille' },
      { id: 'bar_chart', name: 'Categorical Bar Chart', icon: 'fa-chart-column' },
      { id: 'pie_chart', name: 'Pie / Donut Chart', icon: 'fa-chart-pie' }
    ],
    defaultUnits: { x: '', y: 'Frequency' },
    variableLabels: { x: 'Value / Class Intervals', y: 'Frequency (f)' },
    presets: [
      { name: 'Normal Gaussian Distribution Curve N(μ, σ²)', expr: '(1 / (sigma * sqrt(2 * pi))) * exp(-0.5 * ((x - mu) / sigma)^2)', params: { mu: 50, sigma: 10 }, xLabel: 'Score (x)', xUnit: '', yLabel: 'Probability Density f(x)', yUnit: '' }
    ],
    analysisTools: [
      { id: 'stats', name: 'Mean, Median, Mode & Standard Deviation', icon: 'fa-calculator' },
      { id: 'best_fit', name: 'Linear Regression & R²', icon: 'fa-arrow-trend-up' }
    ]
  },

  AGRICULTURE: {
    id: 'AGRICULTURE',
    name: 'Agriculture & Soil Science',
    icon: 'fa-wheat-awn',
    color: '#16A34A',
    defaultGraphType: 'scientific_data',
    supportedGraphTypes: [
      { id: 'scientific_data', name: 'Crop Yield & Fertilizer Response', icon: 'fa-seedling' },
      { id: 'bar_chart', name: 'Variety Yield Comparison', icon: 'fa-chart-column' },
      { id: 'line_graph', name: 'Soil Moisture Monitoring', icon: 'fa-cloud-rain' }
    ],
    defaultUnits: { x: 'kg/ha', y: 'tonnes/ha' },
    variableLabels: { x: 'Nitrogen Application (kg/ha)', y: 'Crop Yield (tonnes/ha)' },
    presets: [
      { name: 'Nitrogen Fertilizer Diminishing Returns', expr: 'Y0 + a * x - b * x^2', params: { Y0: 2.0, a: 0.06, b: 0.00015 }, xLabel: 'Nitrogen Applied (N)', xUnit: 'kg/ha', yLabel: 'Crop Yield', yUnit: 'tonnes/ha' }
    ],
    analysisTools: [
      { id: 'optimum_dosage', name: 'Economic Optimum Input Dosage', icon: 'fa-bullseye' },
      { id: 'best_fit', name: 'Agronomic Response Curve & R²', icon: 'fa-arrow-trend-up' },
      { id: 'stats', name: 'Mean Treatment Comparisons', icon: 'fa-calculator' }
    ]
  },

  CUSTOM: {
    id: 'CUSTOM',
    name: 'General / Custom Subject',
    icon: 'fa-chart-pie',
    color: '#4B5563',
    defaultGraphType: 'cartesian_function',
    supportedGraphTypes: [
      { id: 'cartesian_function', name: 'Function Plotter', icon: 'fa-chart-line' },
      { id: 'scientific_data', name: 'Data Points (X-Y)', icon: 'fa-flask' },
      { id: 'bar_chart', name: 'Bar Chart', icon: 'fa-chart-column' },
      { id: 'pie_chart', name: 'Pie Chart', icon: 'fa-chart-pie' }
    ],
    defaultUnits: { x: '', y: '' },
    variableLabels: { x: 'X Axis', y: 'Y Axis' },
    presets: [
      { name: 'Linear: y = mx + c', expr: 'm * x + c', params: { m: 1, c: 0 } },
      { name: 'Quadratic: y = x²', expr: 'x^2', params: {} }
    ],
    analysisTools: [
      { id: 'coordinate_inspect', name: 'Coordinate Inspector', icon: 'fa-crosshairs' },
      { id: 'slope', name: 'Gradient / Slope', icon: 'fa-chart-line' },
      { id: 'stats', name: 'Summary Statistics', icon: 'fa-calculator' }
    ]
  }
};
