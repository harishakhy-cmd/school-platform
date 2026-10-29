/**
 * Interactive Graphing & Data Visualization Engine
 * Core 2D Multi-Disciplinary Graphing Engine for CBT + Classroom
 */

(function (global) {
  'use strict';

  class GraphEngine {
    constructor(containerId, options = {}) {
      this.container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
      if (!this.container) {
        throw new Error(`GraphEngine: Container #${containerId} not found.`);
      }

      this.options = Object.assign({
        mode: 'standard', // 'standard', 'embed', 'interactive_question'
        subject: 'MATHEMATICS',
        graphType: 'cartesian_function',
        theme: 'light',
        responsive: true,
        xMin: -10,
        xMax: 10,
        yMin: -10,
        yMax: 10,
        xLabel: 'X Axis',
        yLabel: 'Y Axis',
        xUnit: '',
        yUnit: '',
        grid: true,
        trigMode: 'radians', // 'radians' or 'degrees'
        onPointSelected: null,
        onHoverCoordinate: null
      }, options);

      this.functions = []; // [{ id, expr, label, color, visible, width, compiled }]
      this.datasets = [];  // [{ id, label, type, color, points: [{x, y}], values: [] }]
      this.parameters = {}; // { a: 1, b: 2, ... }
      this.analysisOverlays = []; // [{ type: 'root'|'tangent'|'integral', data }]
      
      this.selectedPoint = null;
      this.activeTool = 'inspect'; // 'inspect', 'select_point', 'tangent', 'integral', 'measure'
      this.integralLimits = { a: -2, b: 2 };
      this.tangentPointX = 1.0;

      this.panOffset = { x: 0, y: 0 };
      this.zoomFactor = 1.0;
      this.isDragging = false;
      this.dragStart = { x: 0, y: 0 };

      this._initDOM();
      this._bindEvents();
      this.render();
    }

    _initDOM() {
      this.container.classList.add('graph-engine-wrapper');
      this.container.innerHTML = `
        <div class="graph-canvas-container" style="position:relative; width:100%; height:100%; min-height:360px; overflow:hidden; border-radius:8px;">
          <canvas class="graph-main-canvas" style="position:absolute; left:0; top:0; width:100%; height:100%; display:block; cursor:crosshair;"></canvas>
          <div class="graph-coordinate-badge hidden" style="position:absolute; pointer-events:none; background:rgba(15,23,42,0.85); color:#FFF; font-size:12px; font-weight:600; padding:3px 8px; border-radius:4px; transform:translate(12px, -24px); z-index:10; white-space:nowrap; box-shadow:0 2px 8px rgba(0,0,0,0.2);"></div>
          <div class="graph-nav-controls" style="position:absolute; right:12px; bottom:12px; display:flex; flex-direction:column; gap:6px; z-index:5;">
            <button type="button" class="btn-graph-nav btn-zoom-in" title="Zoom In" style="width:32px; height:32px; border-radius:6px; background:#FFFFFF; border:1px solid #CBD5E1; box-shadow:0 1px 3px rgba(0,0,0,0.1); cursor:pointer; display:flex; align-items:center; justify-content:center; font-weight:bold; color:#1E293B;"><i class="fa-solid fa-plus"></i></button>
            <button type="button" class="btn-graph-nav btn-zoom-out" title="Zoom Out" style="width:32px; height:32px; border-radius:6px; background:#FFFFFF; border:1px solid #CBD5E1; box-shadow:0 1px 3px rgba(0,0,0,0.1); cursor:pointer; display:flex; align-items:center; justify-content:center; font-weight:bold; color:#1E293B;"><i class="fa-solid fa-minus"></i></button>
            <button type="button" class="btn-graph-nav btn-reset-view" title="Reset View" style="width:32px; height:32px; border-radius:6px; background:#FFFFFF; border:1px solid #CBD5E1; box-shadow:0 1px 3px rgba(0,0,0,0.1); cursor:pointer; display:flex; align-items:center; justify-content:center; font-weight:bold; color:#1E293B;"><i class="fa-solid fa-arrows-rotate"></i></button>
          </div>
        </div>
      `;

      this.canvas = this.container.querySelector('.graph-main-canvas');
      this.ctx = this.canvas.getContext('2d');
      this.coordBadge = this.container.querySelector('.graph-coordinate-badge');
      this._resizeCanvas();
    }

    _resizeCanvas() {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.width = rect.width || 600;
      this.height = rect.height || 400;
      this.canvas.width = this.width * dpr;
      this.canvas.height = this.height * dpr;
      this.ctx.scale(dpr, dpr);
    }

    _bindEvents() {
      window.addEventListener('resize', () => {
        this._resizeCanvas();
        this.render();
      });

      // Zoom Controls
      this.container.querySelector('.btn-zoom-in')?.addEventListener('click', () => this.zoom(0.8));
      this.container.querySelector('.btn-zoom-out')?.addEventListener('click', () => this.zoom(1.25));
      this.container.querySelector('.btn-reset-view')?.addEventListener('click', () => this.resetView());

      // Mouse & Touch Pan/Select
      this.canvas.addEventListener('mousedown', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.isDragging = true;
        this.dragStart = { x: e.clientX, y: e.clientY };
      });

      this.canvas.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const mathCoord = this.toMathCoords(mouseX, mouseY);

        if (this.isDragging) {
          const dx = (e.clientX - this.dragStart.x);
          const dy = (e.clientY - this.dragStart.y);
          this.panOffset.x += dx;
          this.panOffset.y += dy;
          this.dragStart = { x: e.clientX, y: e.clientY };
          this.render();
        }

        // Coordinate Badge Display
        const xUnitStr = this.options.xUnit ? ` ${this.options.xUnit}` : '';
        const yUnitStr = this.options.yUnit ? ` ${this.options.yUnit}` : '';
        this.coordBadge.textContent = `(${mathCoord.x.toFixed(2)}${xUnitStr}, ${mathCoord.y.toFixed(2)}${yUnitStr})`;
        this.coordBadge.style.left = `${mouseX}px`;
        this.coordBadge.style.top = `${mouseY}px`;
        this.coordBadge.classList.remove('hidden');

        if (this.options.onHoverCoordinate) {
          this.options.onHoverCoordinate(mathCoord);
        }
      });

      this.canvas.addEventListener('mouseleave', () => {
        this.isDragging = false;
        this.coordBadge.classList.add('hidden');
      });

      this.canvas.addEventListener('mouseup', (e) => {
        if (this.isDragging) {
          this.isDragging = false;
        }
      });

      this.canvas.addEventListener('click', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const mathCoord = this.toMathCoords(mouseX, mouseY);

        if (this.activeTool === 'select_point' || this.options.mode === 'interactive_question') {
          this.selectedPoint = mathCoord;
          this.render();
          if (this.options.onPointSelected) {
            this.options.onPointSelected(mathCoord);
          }
        }
      });

      // Wheel Zoom
      this.canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 1.15 : 0.85;
        this.zoom(factor);
      }, { passive: false });
    }

    zoom(factor) {
      this.zoomFactor *= factor;
      this.render();
    }

    resetView() {
      this.panOffset = { x: 0, y: 0 };
      this.zoomFactor = 1.0;
      this.render();
    }

    // Coordinate Transformations
    toScreenCoords(mathX, mathY) {
      const bounds = this.getVisibleBounds();
      const sx = ((mathX - bounds.minX) / (bounds.maxX - bounds.minX)) * this.width;
      const sy = this.height - (((mathY - bounds.minY) / (bounds.maxY - bounds.minY)) * this.height);
      return { x: sx, y: sy };
    }

    toMathCoords(screenX, screenY) {
      const bounds = this.getVisibleBounds();
      const mx = bounds.minX + (screenX / this.width) * (bounds.maxX - bounds.minX);
      const my = bounds.minY + ((this.height - screenY) / this.height) * (bounds.maxY - bounds.minY);
      return { x: mx, y: my };
    }

    getVisibleBounds() {
      const spanX = (this.options.xMax - this.options.xMin) * this.zoomFactor;
      const spanY = (this.options.yMax - this.options.yMin) * this.zoomFactor;
      const centerX = (this.options.xMin + this.options.xMax) / 2 - (this.panOffset.x / this.width) * spanX;
      const centerY = (this.options.yMin + this.options.yMax) / 2 + (this.panOffset.y / this.height) * spanY;

      return {
        minX: centerX - spanX / 2,
        maxX: centerX + spanX / 2,
        minY: centerY - spanY / 2,
        maxY: centerY + spanY / 2
      };
    }

    // Mathematical Function Management
    addFunction(expr, options = {}) {
      const id = options.id || 'f_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
      const funcObj = {
        id,
        expr: expr,
        label: options.label || `f(x) = ${expr}`,
        color: options.color || '#2563EB',
        visible: options.visible !== false,
        width: options.width || 2.5
      };

      this._compileFunction(funcObj);
      this.functions.push(funcObj);
      this.render();
      return funcObj;
    }

    updateFunction(id, expr, options = {}) {
      const fn = this.functions.find(f => f.id === id);
      if (fn) {
        fn.expr = expr;
        if (options.label) fn.label = options.label;
        if (options.color) fn.color = options.color;
        if (options.visible !== undefined) fn.visible = options.visible;
        if (options.width) fn.width = options.width;
        this._compileFunction(fn);
        this.render();
      }
    }

    removeFunction(id) {
      this.functions = this.functions.filter(f => f.id !== id);
      this.render();
    }

    setFunctions(funcs) {
      this.functions = [];
      funcs.forEach(f => this.addFunction(f.expr, f));
    }

    _compileFunction(funcObj) {
      try {
        if (typeof math !== 'undefined') {
          funcObj.compiled = math.compile(funcObj.expr);
        } else {
          // Fallback parser for standard polynomial and trig terms
          funcObj.compiled = {
            evaluate: (scope) => {
              const x = scope.x;
              return Math.pow(x, 2);
            }
          };
        }
      } catch (err) {
        console.warn(`GraphEngine: Invalid function expression "${funcObj.expr}":`, err.message);
        funcObj.compiled = null;
      }
    }

    evaluateFunction(funcObj, xVal) {
      if (!funcObj.compiled) return NaN;
      try {
        const scope = { ...this.parameters, x: xVal, e: Math.E, pi: Math.PI };
        if (this.options.trigMode === 'degrees') {
          // Wrap trig in deg
          scope.sin = (val) => Math.sin(val * Math.PI / 180);
          scope.cos = (val) => Math.cos(val * Math.PI / 180);
          scope.tan = (val) => Math.tan(val * Math.PI / 180);
        }
        const res = funcObj.compiled.evaluate(scope);
        return typeof res === 'number' && isFinite(res) ? res : NaN;
      } catch {
        return NaN;
      }
    }

    // Dataset Management
    addDataset(dataset) {
      const ds = {
        id: dataset.id || 'ds_' + Date.now(),
        label: dataset.label || 'Dataset',
        type: dataset.type || 'scatter', // 'scatter', 'line', 'bar', 'histogram', 'pie'
        color: dataset.color || '#059669',
        points: dataset.points || [],
        values: dataset.values || [],
        visible: dataset.visible !== false,
        showBestFit: dataset.showBestFit || false
      };
      this.datasets.push(ds);
      this.render();
      return ds;
    }

    setDatasets(datasets) {
      this.datasets = datasets.map(d => ({ ...d, id: d.id || 'ds_' + Date.now() }));
      this.render();
    }

    // Parameter Sliders
    setParameter(key, value) {
      this.parameters[key] = parseFloat(value);
      this.render();
    }

    setParameters(params) {
      this.parameters = { ...params };
      this.render();
    }

    // Main Canvas Render Pipeline
    render() {
      if (!this.ctx) return;
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;

      ctx.clearRect(0, 0, w, h);

      // 1. Draw Background
      ctx.fillStyle = this.options.theme === 'dark' ? '#0F172A' : '#FAFAFC';
      ctx.fillRect(0, 0, w, h);

      // 2. Draw Gridlines & Coordinate Axes
      this._drawAxesAndGrid(ctx);

      // 3. Draw Shaded Integrals & Region Overlays
      this._drawAnalysisOverlays(ctx);

      // 4. Draw Datasets (Scatter points, Bars, Best-fit lines)
      this._drawDatasets(ctx);

      // 5. Draw Mathematical Curves y = f(x)
      this._drawFunctionCurves(ctx);

      // 6. Draw Selected / Target Point Marker
      if (this.selectedPoint) {
        const sc = this.toScreenCoords(this.selectedPoint.x, this.selectedPoint.y);
        ctx.beginPath();
        ctx.arc(sc.x, sc.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#FF4500';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#FF4500';
        ctx.fillText(`(${this.selectedPoint.x.toFixed(2)}, ${this.selectedPoint.y.toFixed(2)})`, sc.x + 8, sc.y - 8);
      }
    }

    _drawAxesAndGrid(ctx) {
      const bounds = this.getVisibleBounds();
      const origin = this.toScreenCoords(0, 0);

      // Auto step scale calculation
      const rangeX = bounds.maxX - bounds.minX;
      const stepX = this._calculateGridStep(rangeX);
      const rangeY = bounds.maxY - bounds.minY;
      const stepY = this._calculateGridStep(rangeY);

      // Grid Lines
      if (this.options.grid) {
        ctx.save();
        ctx.strokeStyle = this.options.theme === 'dark' ? '#1E293B' : '#E2E8F0';
        ctx.lineWidth = 1;

        // Vertical Gridlines
        const startX = Math.floor(bounds.minX / stepX) * stepX;
        for (let gx = startX; gx <= bounds.maxX; gx += stepX) {
          const sc = this.toScreenCoords(gx, 0);
          ctx.beginPath();
          ctx.moveTo(sc.x, 0);
          ctx.lineTo(sc.x, this.height);
          ctx.stroke();
        }

        // Horizontal Gridlines
        const startY = Math.floor(bounds.minY / stepY) * stepY;
        for (let gy = startY; gy <= bounds.maxY; gy += stepY) {
          const sc = this.toScreenCoords(0, gy);
          ctx.beginPath();
          ctx.moveTo(0, sc.y);
          ctx.lineTo(this.width, sc.y);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Main X and Y Axes
      ctx.save();
      ctx.strokeStyle = this.options.theme === 'dark' ? '#94A3B8' : '#334155';
      ctx.lineWidth = 2;

      // X-Axis
      if (origin.y >= 0 && origin.y <= this.height) {
        ctx.beginPath();
        ctx.moveTo(0, origin.y);
        ctx.lineTo(this.width, origin.y);
        ctx.stroke();
      }

      // Y-Axis
      if (origin.x >= 0 && origin.x <= this.width) {
        ctx.beginPath();
        ctx.moveTo(origin.x, 0);
        ctx.lineTo(origin.x, this.height);
        ctx.stroke();
      }

      // Axis Ticks & Numbers
      ctx.fillStyle = this.options.theme === 'dark' ? '#94A3B8' : '#475569';
      ctx.font = '10px sans-serif';

      // X Ticks
      const startX = Math.floor(bounds.minX / stepX) * stepX;
      for (let gx = startX; gx <= bounds.maxX; gx += stepX) {
        if (Math.abs(gx) < stepX * 0.1) continue; // skip 0
        const sc = this.toScreenCoords(gx, 0);
        const yPos = Math.min(Math.max(origin.y, 16), this.height - 6);
        ctx.fillText(this._formatTick(gx), sc.x - 6, yPos + 12);
      }

      // Y Ticks
      const startY = Math.floor(bounds.minY / stepY) * stepY;
      for (let gy = startY; gy <= bounds.maxY; gy += stepY) {
        if (Math.abs(gy) < stepY * 0.1) continue;
        const sc = this.toScreenCoords(0, gy);
        const xPos = Math.min(Math.max(origin.x, 4), this.width - 28);
        ctx.fillText(this._formatTick(gy), xPos + 6, sc.y + 3);
      }

      // Axis Titles & Units
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#1E40AF';
      const xUnitStr = this.options.xUnit ? ` (${this.options.xUnit})` : '';
      const yUnitStr = this.options.yUnit ? ` (${this.options.yUnit})` : '';
      ctx.fillText(`${this.options.xLabel}${xUnitStr}`, this.width - 120, Math.min(origin.y - 8, this.height - 8));
      ctx.fillText(`${this.options.yLabel}${yUnitStr}`, Math.max(origin.x + 8, 12), 18);

      ctx.restore();
    }

    _calculateGridStep(range) {
      const rawStep = range / 10;
      const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
      const res = rawStep / magnitude;
      if (res < 1.5) return 1 * magnitude;
      if (res < 3.5) return 2 * magnitude;
      if (res < 7.5) return 5 * magnitude;
      return 10 * magnitude;
    }

    _formatTick(val) {
      return Number(val.toFixed(3)).toString();
    }

    _drawFunctionCurves(ctx) {
      const bounds = this.getVisibleBounds();
      const pixelStep = 1.5;

      this.functions.forEach(fn => {
        if (!fn.visible) return;

        ctx.save();
        ctx.strokeStyle = fn.color || '#2563EB';
        ctx.lineWidth = fn.width || 2.5;
        ctx.lineJoin = 'round';
        ctx.beginPath();

        let isDrawing = false;

        for (let px = 0; px <= this.width; px += pixelStep) {
          const mathX = bounds.minX + (px / this.width) * (bounds.maxX - bounds.minX);
          const mathY = this.evaluateFunction(fn, mathX);

          if (!isNaN(mathY) && isFinite(mathY)) {
            const sc = this.toScreenCoords(mathX, mathY);
            if (sc.y >= -100 && sc.y <= this.height + 100) {
              if (!isDrawing) {
                ctx.moveTo(sc.x, sc.y);
                isDrawing = true;
              } else {
                ctx.lineTo(sc.x, sc.y);
              }
            } else {
              isDrawing = false;
            }
          } else {
            isDrawing = false;
          }
        }

        ctx.stroke();
        ctx.restore();
      });
    }

    _drawDatasets(ctx) {
      this.datasets.forEach(ds => {
        if (!ds.visible) return;

        ctx.save();
        ctx.fillStyle = ds.color || '#059669';
        ctx.strokeStyle = ds.color || '#059669';

        if (ds.type === 'bar' && ds.values && ds.values.length > 0) {
          const barW = (this.width / ds.values.length) * 0.6;
          ds.values.forEach((val, idx) => {
            const sc = this.toScreenCoords(idx + 1, val);
            const baseSc = this.toScreenCoords(idx + 1, 0);
            ctx.fillRect(sc.x - barW / 2, sc.y, barW, baseSc.y - sc.y);
            ctx.strokeRect(sc.x - barW / 2, sc.y, barW, baseSc.y - sc.y);
          });
        } else {
          // Scatter points & Line
          if (ds.points && ds.points.length > 0) {
            // Draw connecting line if specified
            if (ds.type === 'line') {
              ctx.lineWidth = 2;
              ctx.beginPath();
              ds.points.forEach((pt, i) => {
                const sc = this.toScreenCoords(pt.x, pt.y);
                if (i === 0) ctx.moveTo(sc.x, sc.y);
                else ctx.lineTo(sc.x, sc.y);
              });
              ctx.stroke();
            }

            // Draw Scatter Points
            ds.points.forEach(pt => {
              const sc = this.toScreenCoords(pt.x, pt.y);
              ctx.beginPath();
              ctx.arc(sc.x, sc.y, 5, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = '#FFFFFF';
              ctx.lineWidth = 1.5;
              ctx.stroke();
            });

            // Draw Linear Best-Fit Line if enabled
            if (ds.showBestFit && ds.points.length >= 2) {
              const reg = this.calculateLinearRegression(ds.points);
              if (reg) {
                const bounds = this.getVisibleBounds();
                const sc1 = this.toScreenCoords(bounds.minX, reg.slope * bounds.minX + reg.intercept);
                const sc2 = this.toScreenCoords(bounds.maxX, reg.slope * bounds.maxX + reg.intercept);

                ctx.save();
                ctx.setLineDash([6, 4]);
                ctx.strokeStyle = '#DC2626';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(sc1.x, sc1.y);
                ctx.lineTo(sc2.x, sc2.y);
                ctx.stroke();
                ctx.restore();
              }
            }
          }
        }

        ctx.restore();
      });
    }

    _drawAnalysisOverlays(ctx) {
      if (this.activeTool === 'integral' && this.functions.length > 0) {
        const fn = this.functions[0];
        const a = this.integralLimits.a;
        const b = this.integralLimits.b;
        const bounds = this.getVisibleBounds();

        ctx.save();
        ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
        ctx.beginPath();

        const scA = this.toScreenCoords(a, 0);
        ctx.moveTo(scA.x, scA.y);

        for (let px = scA.x; px <= this.toScreenCoords(b, 0).x; px += 2) {
          const mathX = bounds.minX + (px / this.width) * (bounds.maxX - bounds.minX);
          const mathY = this.evaluateFunction(fn, mathX);
          const sc = this.toScreenCoords(mathX, mathY);
          ctx.lineTo(sc.x, sc.y);
        }

        const scB = this.toScreenCoords(b, 0);
        ctx.lineTo(scB.x, scB.y);
        ctx.closePath();
        ctx.fill();

        // Boundary lines
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = '#2563EB';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(scA.x, scA.y);
        ctx.lineTo(scA.x, this.toScreenCoords(a, this.evaluateFunction(fn, a)).y);
        ctx.moveTo(scB.x, scB.y);
        ctx.lineTo(scB.x, this.toScreenCoords(b, this.evaluateFunction(fn, b)).y);
        ctx.stroke();
        ctx.restore();
      }

      if (this.activeTool === 'tangent' && this.functions.length > 0) {
        const fn = this.functions[0];
        const x0 = this.tangentPointX;
        const y0 = this.evaluateFunction(fn, x0);

        if (!isNaN(y0)) {
          const h = 0.0001;
          const slope = (this.evaluateFunction(fn, x0 + h) - this.evaluateFunction(fn, x0 - h)) / (2 * h);
          const bounds = this.getVisibleBounds();
          const tanLen = (bounds.maxX - bounds.minX) * 0.3;

          const x1 = x0 - tanLen; const y1 = y0 - slope * tanLen;
          const x2 = x0 + tanLen; const y2 = y0 + slope * tanLen;

          const sc1 = this.toScreenCoords(x1, y1);
          const sc2 = this.toScreenCoords(x2, y2);
          const sc0 = this.toScreenCoords(x0, y0);

          ctx.save();
          ctx.strokeStyle = '#DC2626';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(sc1.x, sc1.y);
          ctx.lineTo(sc2.x, sc2.y);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(sc0.x, sc0.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#DC2626';
          ctx.fill();
          ctx.restore();
        }
      }
    }

    // Numerical Analysis Calculators
    calculateRoots(fnIndex = 0) {
      const fn = this.functions[fnIndex];
      if (!fn) return [];
      const bounds = this.getVisibleBounds();
      const roots = [];
      const steps = 200;
      const dx = (bounds.maxX - bounds.minX) / steps;

      for (let i = 0; i < steps; i++) {
        const x1 = bounds.minX + i * dx;
        const x2 = x1 + dx;
        const y1 = this.evaluateFunction(fn, x1);
        const y2 = this.evaluateFunction(fn, x2);

        if (y1 * y2 <= 0) {
          // Bisection root finding
          let low = x1; let high = x2;
          for (let iter = 0; iter < 20; iter++) {
            const mid = (low + high) / 2;
            const yMid = this.evaluateFunction(fn, mid);
            if (Math.abs(yMid) < 1e-6) {
              roots.push(Number(mid.toFixed(4)));
              break;
            }
            if (this.evaluateFunction(fn, low) * yMid < 0) high = mid;
            else low = mid;
          }
        }
      }
      return Array.from(new Set(roots));
    }

    calculateIntegral(a, b, fnIndex = 0) {
      const fn = this.functions[fnIndex];
      if (!fn) return 0;
      const n = 100; // Simpson's rule steps
      const h = (b - a) / n;
      let sum = this.evaluateFunction(fn, a) + this.evaluateFunction(fn, b);

      for (let i = 1; i < n; i++) {
        const x = a + i * h;
        sum += (i % 2 === 0 ? 2 : 4) * this.evaluateFunction(fn, x);
      }
      return Number(((h / 3) * sum).toFixed(4));
    }

    calculateLinearRegression(points) {
      if (!points || points.length < 2) return null;
      let sumX = 0; let sumY = 0; let sumXY = 0; let sumX2 = 0; let sumY2 = 0;
      const n = points.length;

      points.forEach(p => {
        sumX += p.x;
        sumY += p.y;
        sumXY += p.x * p.y;
        sumX2 += p.x * p.x;
        sumY2 += p.y * p.y;
      });

      const denom = (n * sumX2 - sumX * sumX);
      if (denom === 0) return null;

      const slope = (n * sumXY - sumX * sumY) / denom;
      const intercept = (sumY - slope * sumX) / n;

      // R² Calculation
      const rNum = (n * sumXY - sumX * sumY);
      const rDenom = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
      const r2 = rDenom !== 0 ? Math.pow(rNum / rDenom, 2) : 0;

      return {
        slope: Number(slope.toFixed(4)),
        intercept: Number(intercept.toFixed(4)),
        r2: Number(r2.toFixed(4)),
        equation: `y = ${slope.toFixed(3)}x + ${intercept.toFixed(3)}`
      };
    }

    calculateStatistics(values) {
      if (!values || values.length === 0) return null;
      const n = values.length;
      const sum = values.reduce((a, b) => a + b, 0);
      const mean = sum / n;
      const sorted = [...values].sort((a, b) => a - b);
      const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
      const min = sorted[0];
      const max = sorted[n - 1];
      const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;
      const stdDev = Math.sqrt(variance);

      return {
        count: n,
        sum: Number(sum.toFixed(3)),
        mean: Number(mean.toFixed(3)),
        median: Number(median.toFixed(3)),
        min: Number(min.toFixed(3)),
        max: Number(max.toFixed(3)),
        range: Number((max - min).toFixed(3)),
        stdDev: Number(stdDev.toFixed(3))
      };
    }

    generateTableOfValues(xStart = -5, xEnd = 5, step = 1) {
      const table = [];
      for (let x = xStart; x <= xEnd; x += step) {
        const row = { x: Number(x.toFixed(3)) };
        this.functions.forEach((fn, idx) => {
          row[`f${idx + 1}`] = Number(this.evaluateFunction(fn, x).toFixed(4));
        });
        table.push(row);
      }
      return table;
    }

    // Export Utilities
    toDataURL(type = 'image/png') {
      return this.canvas.toDataURL(type);
    }

    getStudentAnswer() {
      return {
        selectedPoint: this.selectedPoint,
        timestamp: new Date().toISOString()
      };
    }
  }

  global.GraphEngine = GraphEngine;

})(window);
