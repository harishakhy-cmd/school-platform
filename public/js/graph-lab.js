/**
 * Graphing Lab Workbench Controller
 * Interactive Graphing & Data Visualization Lab
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // 1. Initialize Graph Engine
  const graphEngine = new GraphEngine('main-graph-container', {
    subject: 'MATHEMATICS',
    xMin: -10,
    xMax: 10,
    yMin: -10,
    yMax: 10,
    xLabel: 'x',
    yLabel: 'y = f(x)'
  });

  // Default initial function
  graphEngine.addFunction('x^2 - 2*x - 3', { id: 'f1', label: 'f(x) = x² - 2x - 3', color: '#2563EB' });
  graphEngine.setParameters({ a: 1, b: -2, c: -3, m: 2 });

  let currentSubject = 'MATHEMATICS';
  let activeGraphId = null;

  // DOM Elements
  const subjectSelect = document.getElementById('gl-subject-select');
  const presetSelect = document.getElementById('gl-preset-select');
  const functionsList = document.getElementById('gl-functions-list');
  const parametersList = document.getElementById('gl-parameters-list');
  const valuesTable = document.getElementById('gl-values-table');
  const analysisResults = document.getElementById('gl-analysis-results');

  // 2. Subject Selection & Profile Switcher
  function loadSubjectProfile(subjectCode) {
    currentSubject = subjectCode;
    const profile = window.GRAPH_SUBJECT_PROFILES[subjectCode] || window.GRAPH_SUBJECT_PROFILES.CUSTOM;

    // Update Presets Dropdown
    presetSelect.innerHTML = '<option value="" disabled selected>-- Select Preset Formula --</option>';
    if (profile.presets) {
      profile.presets.forEach((p, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = p.name;
        presetSelect.appendChild(opt);
      });
    }

    // Update Axis Labels & Units
    if (profile.variableLabels) {
      graphEngine.options.xLabel = profile.variableLabels.x || 'X';
      graphEngine.options.yLabel = profile.variableLabels.y || 'Y';
    }
    if (profile.defaultUnits) {
      graphEngine.options.xUnit = profile.defaultUnits.x || '';
      graphEngine.options.yUnit = profile.defaultUnits.y || '';
      document.getElementById('gl-axis-xunit').value = profile.defaultUnits.x || '';
      document.getElementById('gl-axis-yunit').value = profile.defaultUnits.y || '';
    }

    graphEngine.render();
    renderFunctionsUI();
    renderParametersUI();
    updateValuesTable();
  }

  subjectSelect?.addEventListener('change', (e) => {
    loadSubjectProfile(e.target.value);
  });

  // 3. Preset Formula Selection Listener
  presetSelect?.addEventListener('change', (e) => {
    const profile = window.GRAPH_SUBJECT_PROFILES[currentSubject] || window.GRAPH_SUBJECT_PROFILES.CUSTOM;
    const preset = profile.presets[parseInt(e.target.value, 10)];
    if (!preset) return;

    if (preset.expr) {
      graphEngine.functions = [];
      graphEngine.addFunction(preset.expr, { label: preset.name, color: '#2563EB' });
      if (preset.params) {
        graphEngine.setParameters(preset.params);
      }
    } else if (preset.data && preset.type === 'climograph') {
      graphEngine.functions = [];
      const rainfallPoints = preset.data.rainfall.map((r, i) => ({ x: i + 1, y: r }));
      graphEngine.setDatasets([
        { id: 'rainfall', label: 'Rainfall (mm)', type: 'bar', color: '#0284C7', points: rainfallPoints }
      ]);
      graphEngine.options.xMin = 0;
      graphEngine.options.xMax = 13;
      graphEngine.options.yMin = 0;
      graphEngine.options.yMax = Math.ceil(Math.max(...preset.data.rainfall) * 1.25 / 50) * 50;
      graphEngine.options.xLabel = 'Month (1=Jan ... 12=Dec)';
      graphEngine.options.yLabel = 'Precipitation (mm)';
    }

    if (preset.xMin !== undefined) graphEngine.options.xMin = preset.xMin;
    if (preset.xMax !== undefined) graphEngine.options.xMax = preset.xMax;
    if (preset.yMin !== undefined) graphEngine.options.yMin = preset.yMin;
    if (preset.yMax !== undefined) graphEngine.options.yMax = preset.yMax;

    if (preset.xLabel) graphEngine.options.xLabel = preset.xLabel;
    if (preset.yLabel) graphEngine.options.yLabel = preset.yLabel;
    if (preset.xUnit) graphEngine.options.xUnit = preset.xUnit;
    if (preset.yUnit) graphEngine.options.yUnit = preset.yUnit;

    renderFunctionsUI();
    renderParametersUI();
    updateValuesTable();
  });

  // 4. Function Management UI
  function renderFunctionsUI() {
    if (!functionsList) return;
    functionsList.innerHTML = '';

    graphEngine.functions.forEach((fn, idx) => {
      const row = document.createElement('div');
      row.className = 'func-input-row';
      row.innerHTML = `
        <span class="func-color-badge" style="background:${fn.color};" title="Color"></span>
        <input type="text" class="form-control form-control-sm font-monospace" value="${fn.expr}" data-id="${fn.id}" />
        <button type="button" class="btn btn-xs text-danger btn-del-func" data-id="${fn.id}" title="Remove"><i class="fa-solid fa-xmark"></i></button>
      `;

      // Input change listener
      const input = row.querySelector('input');
      input.addEventListener('input', (e) => {
        graphEngine.updateFunction(e.target.getAttribute('data-id'), e.target.value);
        updateValuesTable();
      });

      // Delete button listener
      row.querySelector('.btn-del-func').addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        graphEngine.removeFunction(id);
        renderFunctionsUI();
        updateValuesTable();
      });

      functionsList.appendChild(row);
    });
  }

  document.getElementById('btn-add-func')?.addEventListener('click', () => {
    const colors = ['#2563EB', '#DC2626', '#059669', '#7C3AED', '#D97706'];
    const col = colors[graphEngine.functions.length % colors.length];
    graphEngine.addFunction('x', { color: col });
    renderFunctionsUI();
    updateValuesTable();
  });

  // 5. Interactive Parameter Sliders
  function renderParametersUI() {
    if (!parametersList) return;
    parametersList.innerHTML = '';

    const keys = Object.keys(graphEngine.parameters);
    if (keys.length === 0) {
      parametersList.innerHTML = '<span class="text-muted small">No active parameters in current formula.</span>';
      return;
    }

    keys.forEach(key => {
      const val = graphEngine.parameters[key];
      const div = document.createElement('div');
      div.className = 'param-slider-group';
      div.innerHTML = `
        <span class="param-slider-label">${key} =</span>
        <input type="range" class="form-range flex-grow-1" min="-10" max="10" step="0.1" value="${val}" data-param="${key}" />
        <span class="param-slider-val" id="pval-${key}">${val}</span>
      `;

      const slider = div.querySelector('input[type="range"]');
      slider.addEventListener('input', (e) => {
        const k = e.target.getAttribute('data-param');
        const v = parseFloat(e.target.value);
        document.getElementById(`pval-${k}`).textContent = v;
        graphEngine.setParameter(k, v);
        updateValuesTable();
      });

      parametersList.appendChild(div);
    });
  }

  // 6. Data Points Modal & Paste Parser
  document.getElementById('btn-open-data-modal')?.addEventListener('click', () => {
    const modal = new bootstrap.Modal(document.getElementById('modal-data'));
    modal.show();
  });

  document.getElementById('btn-save-data-points')?.addEventListener('click', () => {
    const text = document.getElementById('gl-data-paste-area').value.trim();
    if (!text) return;

    const lines = text.split('\n');
    const points = [];

    lines.forEach(line => {
      const parts = line.split(/[,\t\s]+/).map(p => parseFloat(p.trim())).filter(p => !isNaN(p));
      if (parts.length >= 2) {
        points.push({ x: parts[0], y: parts[1] });
      }
    });

    if (points.length > 0) {
      graphEngine.datasets = [];
      graphEngine.addDataset({
        label: 'Experimental Data',
        type: 'scatter',
        color: '#059669',
        points: points,
        showBestFit: document.getElementById('gl-toggle-bestfit').checked
      });

      // Adjust axis bounds to fit data
      const xs = points.map(p => p.x);
      const ys = points.map(p => p.y);
      graphEngine.options.xMin = Math.min(...xs) - 1;
      graphEngine.options.xMax = Math.max(...xs) + 1;
      graphEngine.options.yMin = Math.min(...ys) - 1;
      graphEngine.options.yMax = Math.max(...ys) + 1;
      graphEngine.render();

      bootstrap.Modal.getInstance(document.getElementById('modal-data'))?.hide();
      alert(`Loaded ${points.length} data points successfully!`);
    }
  });

  document.getElementById('btn-load-noaa-co2')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    const status = document.getElementById('gl-noaa-status');
    button.disabled = true;
    status.textContent = 'Loading observed data from NOAA…';
    try {
      const response = await fetch('/api/science/assets/sources/noaa/mauna-loa-co2', { credentials: 'same-origin' });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || `NOAA data request failed (${response.status}).`);
      const { points, firstYear, lastYear, provenance } = result.dataset;
      if (!Array.isArray(points) || points.length < 2) throw new Error('NOAA returned too few valid observations to plot.');

      graphEngine.functions = [];
      graphEngine.setDatasets([{
        id: 'noaa-mauna-loa-co2',
        label: 'Observed CO₂ (ppm)',
        type: 'scatter',
        color: '#0891b2',
        points: points.map((point) => ({ x: point.decimalYear, y: point.co2Ppm }))
      }]);
      graphEngine.options.xMin = firstYear;
      graphEngine.options.xMax = lastYear + 1;
      graphEngine.options.yMin = Math.floor(Math.min(...points.map((point) => point.co2Ppm)) / 10) * 10;
      graphEngine.options.yMax = Math.ceil(Math.max(...points.map((point) => point.co2Ppm)) / 10) * 10;
      graphEngine.options.xLabel = 'Year';
      graphEngine.options.yLabel = 'Atmospheric CO₂';
      graphEngine.options.xUnit = '';
      graphEngine.options.yUnit = 'ppm';
      document.getElementById('gl-axis-xunit').value = '';
      document.getElementById('gl-axis-yunit').value = 'ppm';
      document.getElementById('gl-axis-xmin').value = graphEngine.options.xMin;
      document.getElementById('gl-axis-xmax').value = graphEngine.options.xMax;
      document.getElementById('gl-axis-ymin').value = graphEngine.options.yMin;
      document.getElementById('gl-axis-ymax').value = graphEngine.options.yMax;
      graphEngine.render();
      renderFunctionsUI();
      updateValuesTable();
      status.replaceChildren(document.createTextNode(`${points.length} monthly observations · ${firstYear}–${lastYear}. ${provenance.attribution} ${provenance.limitation} `));
      const sourceLink = document.createElement('a');
      sourceLink.href = provenance.source_url;
      sourceLink.target = '_blank';
      sourceLink.rel = 'noopener noreferrer';
      sourceLink.textContent = 'Source and notes';
      status.appendChild(sourceLink);
    } catch (error) {
      status.textContent = error.message || 'NOAA observations could not be loaded.';
    } finally {
      button.disabled = false;
    }
  });

  document.getElementById('gl-toggle-bestfit')?.addEventListener('change', (e) => {
    if (graphEngine.datasets.length > 0) {
      graphEngine.datasets[0].showBestFit = e.target.checked;
      graphEngine.render();
    }
  });

  // 7. Analysis Tools
  document.getElementById('btn-tool-roots')?.addEventListener('click', () => {
    const roots = graphEngine.calculateRoots(0);
    switchTrayTab('analysis');
    analysisResults.innerHTML = `
      <h6 class="fw-bold text-primary mb-2"><i class="fa-solid fa-bullseye me-2"></i> Roots / Zeros (x-intercepts)</h6>
      <p class="mb-1">${roots.length > 0 ? `Calculated Roots at x = <strong>${roots.join(', ')}</strong>` : 'No real roots detected in visible domain.'}</p>
    `;
  });

  document.getElementById('btn-tool-tangent')?.addEventListener('click', () => {
    graphEngine.activeTool = 'tangent';
    graphEngine.tangentPointX = 1.0;
    graphEngine.render();
    switchTrayTab('analysis');
    analysisResults.innerHTML = `
      <h6 class="fw-bold text-danger mb-2"><i class="fa-solid fa-slash me-2"></i> Tangent Line & Derivative at x₀ = 1.0</h6>
      <p class="mb-1">Tangent line plotted on graph in red. Drag or inspect graph to observe instantaneous rate of change (dy/dx).</p>
    `;
  });

  document.getElementById('btn-tool-integral')?.addEventListener('click', () => {
    graphEngine.activeTool = 'integral';
    graphEngine.integralLimits = { a: -2, b: 2 };
    const area = graphEngine.calculateIntegral(-2, 2, 0);
    graphEngine.render();
    switchTrayTab('analysis');
    analysisResults.innerHTML = `
      <h6 class="fw-bold text-primary mb-2"><i class="fa-solid fa-shapes me-2"></i> Definite Integral ∫ [-2 to 2] f(x)dx</h6>
      <p class="mb-1">Area Under Curve: <strong>${area}</strong></p>
      <small class="text-muted">Shaded area represents definite integral / physical quantity.</small>
    `;
  });

  document.getElementById('btn-tool-stats')?.addEventListener('click', () => {
    let vals = [];
    if (graphEngine.datasets.length > 0 && graphEngine.datasets[0].points) {
      vals = graphEngine.datasets[0].points.map(p => p.y);
    } else {
      const tbl = graphEngine.generateTableOfValues(-5, 5, 1);
      vals = tbl.map(r => r.f1).filter(v => !isNaN(v));
    }

    const stats = graphEngine.calculateStatistics(vals);
    switchTrayTab('analysis');
    if (stats) {
      analysisResults.innerHTML = `
        <h6 class="fw-bold text-primary mb-2"><i class="fa-solid fa-calculator me-2"></i> Descriptive Statistics Summary</h6>
        <div class="row g-2 small">
          <div class="col-4"><strong>Count (N):</strong> ${stats.count}</div>
          <div class="col-4"><strong>Mean (μ):</strong> ${stats.mean}</div>
          <div class="col-4"><strong>Median:</strong> ${stats.median}</div>
          <div class="col-4"><strong>Min:</strong> ${stats.min}</div>
          <div class="col-4"><strong>Max:</strong> ${stats.max}</div>
          <div class="col-4"><strong>Range:</strong> ${stats.range}</div>
          <div class="col-4"><strong>Std Dev (σ):</strong> ${stats.stdDev}</div>
          <div class="col-4"><strong>Sum:</strong> ${stats.sum}</div>
        </div>
      `;
    }
  });

  // 8. Bottom Tray Tab Switcher
  function switchTrayTab(tabName) {
    document.querySelectorAll('.graph-tray-tab').forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-tab') === tabName);
    });
    document.getElementById('tray-tab-table')?.classList.toggle('d-none', tabName !== 'table');
    document.getElementById('tray-tab-analysis')?.classList.toggle('d-none', tabName !== 'analysis');
  }

  document.querySelectorAll('.graph-tray-tab').forEach(t => {
    t.addEventListener('click', () => switchTrayTab(t.getAttribute('data-tab')));
  });

  document.getElementById('btn-toggle-tray')?.addEventListener('click', () => {
    document.getElementById('graph-bottom-tray')?.classList.toggle('collapsed');
  });

  // 9. Table of Values Generator
  function updateValuesTable() {
    if (!valuesTable) return;
    const observedDataset = graphEngine.functions.length === 0
      ? graphEngine.datasets.find((dataset) => Array.isArray(dataset.points) && dataset.points.length)
      : null;
    const start = parseFloat(document.getElementById('gl-tbl-start')?.value || '-5');
    const end = parseFloat(document.getElementById('gl-tbl-end')?.value || '5');
    const step = parseFloat(document.getElementById('gl-tbl-step')?.value || '1');

    const tbody = valuesTable.querySelector('tbody');
    tbody.innerHTML = '';

    if (observedDataset) {
      const header = valuesTable.querySelector('thead tr');
      header.replaceChildren();
      ['Year', observedDataset.label].forEach((label) => {
        const th = document.createElement('th');
        th.textContent = label;
        header.appendChild(th);
      });
      observedDataset.points.slice(-12).forEach((point) => {
        const tr = document.createElement('tr');
        const year = document.createElement('td');
        const value = document.createElement('td');
        year.textContent = point.x.toFixed(3);
        value.textContent = point.y.toFixed(2);
        tr.append(year, value);
        tbody.appendChild(tr);
      });
      return;
    }

    const header = valuesTable.querySelector('thead tr');
    header.replaceChildren();
    ['x', 'y₁ = f(x)'].forEach((label) => {
      const th = document.createElement('th');
      th.textContent = label;
      header.appendChild(th);
    });
    const rows = graphEngine.generateTableOfValues(start, end, step);
    rows.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><strong>${r.x}</strong></td><td>${r.f1 !== undefined ? r.f1 : '-'}</td>`;
      tbody.appendChild(tr);
    });
  }

  document.getElementById('btn-recalc-table')?.addEventListener('click', updateValuesTable);

  document.getElementById('btn-copy-table')?.addEventListener('click', () => {
    const start = parseFloat(document.getElementById('gl-tbl-start')?.value || '-5');
    const end = parseFloat(document.getElementById('gl-tbl-end')?.value || '5');
    const step = parseFloat(document.getElementById('gl-tbl-step')?.value || '1');
    const rows = graphEngine.generateTableOfValues(start, end, step);
    let str = "x\ty\n" + rows.map(r => `${r.x}\t${r.f1}`).join('\n');
    navigator.clipboard.writeText(str).then(() => alert('Table copied to clipboard!'));
  });

  // 10. Axis Bound Inputs Listener
  ['xmin', 'xmax', 'ymin', 'ymax'].forEach(bound => {
    document.getElementById(`gl-axis-${bound}`)?.addEventListener('change', (e) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val)) {
        if (bound === 'xmin') graphEngine.options.xMin = val;
        if (bound === 'xmax') graphEngine.options.xMax = val;
        if (bound === 'ymin') graphEngine.options.yMin = val;
        if (bound === 'ymax') graphEngine.options.yMax = val;
        graphEngine.render();
      }
    });
  });

  // 11. Save Graph API integration
  document.getElementById('btn-gl-save')?.addEventListener('click', async () => {
    const title = prompt('Enter a Title for this Graph:', 'My Interactive Graph');
    if (!title) return;

    const payload = {
      id: activeGraphId,
      title: title,
      subjectCode: currentSubject,
      graphType: graphEngine.options.graphType,
      config: {
        xMin: graphEngine.options.xMin,
        xMax: graphEngine.options.xMax,
        yMin: graphEngine.options.yMin,
        yMax: graphEngine.options.yMax,
        xLabel: graphEngine.options.xLabel,
        yLabel: graphEngine.options.yLabel,
        xUnit: graphEngine.options.xUnit,
        yUnit: graphEngine.options.yUnit,
        parameters: graphEngine.parameters
      },
      functions: graphEngine.functions.map(f => ({ expr: f.expr, label: f.label, color: f.color })),
      dataPoints: graphEngine.datasets
    };

    try {
      const res = await fetch('/api/graphing/graphs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        activeGraphId = data.graphId;
        alert('Graph saved successfully to your repository!');
      } else {
        alert('Error: ' + data.message);
      }
    } catch (err) {
      alert('Failed to save graph.');
    }
  });

  // 12. Saved Graphs Modal & Repository
  document.getElementById('btn-gl-my-graphs')?.addEventListener('click', async () => {
    const modal = new bootstrap.Modal(document.getElementById('modal-saved-graphs'));
    modal.show();

    const listContainer = document.getElementById('saved-graphs-list');
    listContainer.innerHTML = '<div class="p-3 text-center text-muted"><i class="fa-solid fa-spinner fa-spin me-2"></i> Loading saved graphs & templates...</div>';

    try {
      const res = await fetch('/api/graphing/graphs');
      const data = await res.json();
      if (data.success && data.graphs.length > 0) {
        listContainer.innerHTML = '';
        data.graphs.forEach(g => {
          const item = document.createElement('a');
          item.href = '#';
          item.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
          item.innerHTML = `
            <div>
              <h6 class="mb-1 fw-bold text-primary">${g.is_template ? '⭐ [Template] ' : ''}${g.title}</h6>
              <p class="mb-0 text-muted small">${g.subject_code || 'General'} · ${g.topic || 'Interactive Plot'}</p>
            </div>
            <button class="btn btn-sm btn-outline-primary btn-load-graph" data-id="${g.id}"><i class="fa-solid fa-arrow-right"></i> Open</button>
          `;

          item.querySelector('.btn-load-graph').addEventListener('click', async (e) => {
            e.preventDefault();
            const graphId = e.currentTarget.getAttribute('data-id');
            const gRes = await fetch(`/api/graphing/graphs/${graphId}`);
            const gData = await gRes.json();
            if (gData.success) {
              loadGraphDataIntoEngine(gData.graph);
              bootstrap.Modal.getInstance(document.getElementById('modal-saved-graphs'))?.hide();
            }
          });

          listContainer.appendChild(item);
        });
      } else {
        listContainer.innerHTML = '<div class="p-3 text-center text-muted">No saved graphs found.</div>';
      }
    } catch {
      listContainer.innerHTML = '<div class="p-3 text-center text-danger">Failed to load graphs.</div>';
    }
  });

  function loadGraphDataIntoEngine(graph) {
    activeGraphId = graph.id;
    if (graph.subject_code) {
      subjectSelect.value = graph.subject_code;
      loadSubjectProfile(graph.subject_code);
    }

    if (graph.config) {
      if (graph.config.xMin !== undefined) graphEngine.options.xMin = graph.config.xMin;
      if (graph.config.xMax !== undefined) graphEngine.options.xMax = graph.config.xMax;
      if (graph.config.yMin !== undefined) graphEngine.options.yMin = graph.config.yMin;
      if (graph.config.yMax !== undefined) graphEngine.options.yMax = graph.config.yMax;
      if (graph.config.xLabel) graphEngine.options.xLabel = graph.config.xLabel;
      if (graph.config.yLabel) graphEngine.options.yLabel = graph.config.yLabel;
      if (graph.config.parameters) graphEngine.setParameters(graph.config.parameters);
    }

    if (graph.functions) {
      graphEngine.setFunctions(graph.functions);
    }

    if (graph.data_points) {
      graphEngine.setDatasets(graph.data_points);
    }

    renderFunctionsUI();
    renderParametersUI();
    updateValuesTable();
    graphEngine.render();
  }

  // 13. Export Handlers
  document.getElementById('btn-export-png')?.addEventListener('click', (e) => {
    e.preventDefault();
    const link = document.createElement('a');
    link.download = 'graph.png';
    link.href = graphEngine.toDataURL('image/png');
    link.click();
  });

  document.getElementById('btn-export-csv')?.addEventListener('click', (e) => {
    e.preventDefault();
    const rows = graphEngine.generateTableOfValues(-10, 10, 1);
    let csv = "X,Y\r\n" + rows.map(r => `${r.x},${r.f1}`).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.download = 'graph_data.csv';
    link.href = URL.createObjectURL(blob);
    link.click();
  });

  document.getElementById('btn-export-embed')?.addEventListener('click', (e) => {
    e.preventDefault();
    const embedCode = `<iframe src="${window.location.origin}/graphing-lab.html?embed=true&graphId=${activeGraphId || ''}" width="100%" height="450" frameborder="0" allowfullscreen></iframe>`;
    navigator.clipboard.writeText(embedCode).then(() => alert('Embed code copied to clipboard! Paste it into Lesson content or Quiz descriptions.'));
  });

  // 14. Wizard Modal Trigger
  document.getElementById('btn-gl-wizard')?.addEventListener('click', () => {
    const modal = new bootstrap.Modal(document.getElementById('modal-wizard'));
    modal.show();
  });

  document.getElementById('btn-apply-wizard')?.addEventListener('click', () => {
    const wzSubject = document.getElementById('wz-subject').value;
    subjectSelect.value = wzSubject;
    loadSubjectProfile(wzSubject);
    bootstrap.Modal.getInstance(document.getElementById('modal-wizard'))?.hide();
  });

  // Initial load with URL query parameter support
  const urlParams = new URLSearchParams(window.location.search);
  const initialSubject = urlParams.get('subject') || 'MATHEMATICS';
  if (subjectSelect) subjectSelect.value = initialSubject;
  loadSubjectProfile(initialSubject);

  const presetParam = urlParams.get('preset');
  if (presetParam !== null && presetSelect) {
    presetSelect.value = presetParam;
    presetSelect.dispatchEvent(new Event('change'));
  }
});
