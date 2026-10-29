/**
 * Chemistry Laboratory — 2D Canvas Drawing Engine
 * Draws laboratory apparatus, molecular Lewis structures,
 * liquid simulations, and titration workspace on Canvas 2D.
 */

/* global ChemData */
var ChemCanvas = (function () {
  'use strict';

  var canvas, ctx;
  var objects = [];
  var selectedId = null;
  var dragging = false;
  var dragOffset = { x: 0, y: 0 };
  var nextId = 1;
  var onSelectCallback = null;

  // ============================================================
  // INITIALISATION
  // ============================================================
  function init(canvasEl, onSelect) {
    canvas = canvasEl;
    ctx    = canvas.getContext('2d');
    onSelectCallback = onSelect || null;

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup',   onMouseUp);
    canvas.addEventListener('touchstart',onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove,  { passive: false });
    canvas.addEventListener('touchend',  onMouseUp);

    drawAll();
  }

  function resize() {
    if (!canvas || !canvas.parentElement) return;
    canvas.width  = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    drawAll();
  }

  // ============================================================
  // OBJECT MANAGEMENT
  // ============================================================
  function addObject(type, x, y, options) {
    var obj = Object.assign({ id: 'obj_' + (nextId++), type: type, x: x || 200, y: y || 200, selected: false }, options || {});
    objects.push(obj);
    drawAll();
    return obj;
  }

  function clearObjects() {
    objects = [];
    selectedId = null;
    drawAll();
  }

  function getSelected() {
    return objects.find(function(o) { return o.id === selectedId; }) || null;
  }

  function deleteSelected() {
    if (!selectedId) return;
    objects = objects.filter(function(o) { return o.id !== selectedId; });
    selectedId = null;
    drawAll();
  }

  function duplicateSelected() {
    var sel = getSelected();
    if (!sel) return;
    var copy = JSON.parse(JSON.stringify(sel));
    copy.id = 'obj_' + (nextId++);
    copy.x += 30; copy.y += 30;
    copy.selected = false;
    objects.push(copy);
    drawAll();
  }

  // ============================================================
  // HIT TEST
  // ============================================================
  function hitTest(mx, my) {
    for (var i = objects.length - 1; i >= 0; i--) {
      var o = objects[i];
      var hw = (o.width  || 80) / 2;
      var hh = (o.height || 80) / 2;
      if (mx >= o.x - hw && mx <= o.x + hw && my >= o.y - hh && my <= o.y + hh) {
        return o;
      }
    }
    return null;
  }

  function getXY(e) {
    var rect = canvas.getBoundingClientRect();
    var src  = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  }

  function onMouseDown(e) {
    var p = getXY(e);
    var hit = hitTest(p.x, p.y);
    objects.forEach(function(o) { o.selected = false; });
    if (hit) {
      hit.selected = true;
      selectedId   = hit.id;
      dragging     = true;
      dragOffset   = { x: p.x - hit.x, y: p.y - hit.y };
      if (onSelectCallback) onSelectCallback(hit);
    } else {
      selectedId = null;
    }
    drawAll();
  }

  function onMouseMove(e) {
    if (!dragging || !selectedId) return;
    var p = getXY(e);
    var o = getSelected();
    if (o) { o.x = p.x - dragOffset.x; o.y = p.y - dragOffset.y; }
    drawAll();
  }

  function onMouseUp() { dragging = false; }
  function onTouchStart(e) { e.preventDefault(); onMouseDown(e); }
  function onTouchMove(e)  { e.preventDefault(); onMouseMove(e); }

  // ============================================================
  // MAIN DRAW DISPATCHER
  // ============================================================
  function drawAll() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background grid
    ctx.strokeStyle = '#E8EDF2';
    ctx.lineWidth   = 0.5;
    for (var gx = 0; gx < canvas.width; gx += 30) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, canvas.height); ctx.stroke();
    }
    for (var gy = 0; gy < canvas.height; gy += 30) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(canvas.width, gy); ctx.stroke();
    }

    objects.forEach(function(obj) {
      ctx.save();
      ctx.translate(obj.x, obj.y);
      switch (obj.type) {
        case 'beaker':            drawBeaker(obj);       break;
        case 'conical_flask':     drawConicalFlask(obj); break;
        case 'test_tube':         drawTestTube(obj);     break;
        case 'burette':           drawBurette(obj);      break;
        case 'thermometer':       drawThermometer(obj);  break;
        case 'bunsen':            drawBunsen(obj);       break;
        case 'separating_funnel': drawSepFunnel(obj);    break;
        case 'condenser':         drawCondenser(obj);    break;
        case 'molecule_label':    drawMoleculeLabel(obj);break;
        case 'arrow_reaction':    drawReactionArrow(obj);break;
        case 'ph_strip':          drawPhStrip(obj);      break;
        case 'electrolysis':      drawElectrolysis(obj); break;
        default:                  drawGenericBox(obj);   break;
      }
      if (obj.selected) {
        ctx.strokeStyle = '#7C3AED';
        ctx.lineWidth   = 2;
        ctx.setLineDash([4, 3]);
        var hw = (obj.width || 80) / 2 + 5;
        var hh = (obj.height || 80) / 2 + 5;
        ctx.strokeRect(-hw, -hh, hw * 2, hh * 2);
        ctx.setLineDash([]);
      }
      ctx.restore();
    });
  }

  // ============================================================
  // APPARATUS DRAWING
  // ============================================================
  function drawBeaker(obj) {
    var w = obj.width  || 70;
    var h = obj.height || 80;
    var hw = w / 2, hh = h / 2;
    var fillFrac = (obj.fillFraction !== undefined) ? Math.max(0, Math.min(1, obj.fillFraction)) : 0.5;

    ctx.beginPath();
    ctx.moveTo(-hw, -hh);
    ctx.lineTo(-hw,  hh);
    ctx.lineTo( hw,  hh);
    ctx.lineTo( hw, -hh);
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth   = 2;
    ctx.stroke();

    if (fillFrac > 0) {
      var fillH = h * fillFrac;
      ctx.fillStyle = obj.liquidColor || 'rgba(8, 145, 178, 0.4)';
      ctx.fillRect(-hw + 2, hh - fillH, w - 4, fillH - 2);
    }

    ctx.beginPath();
    ctx.moveTo(-hw - 4, -hh + 4);
    ctx.lineTo(-hw - 4, -hh - 4);
    ctx.lineTo(-hw + 4, -hh - 4);
    ctx.stroke();

    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth   = 0.8;
    for (var m = 1; m <= 4; m++) {
      var my = hh - (h * m / 5);
      ctx.beginPath(); ctx.moveTo(-hw + 2, my); ctx.lineTo(-hw + 8, my); ctx.stroke();
    }

    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(obj.label || 'Beaker', 0, hh + 12);
  }

  function drawConicalFlask(obj) {
    var w = obj.width  || 80;
    var h = obj.height || 90;
    var hw = w / 2, hh = h / 2;
    var fillFrac = (obj.fillFraction !== undefined) ? obj.fillFraction : 0.4;

    ctx.beginPath();
    ctx.moveTo(-8, -hh);
    ctx.lineTo(-8, -hh + 20);
    ctx.lineTo(-hw, hh);
    ctx.lineTo( hw, hh);
    ctx.lineTo( 8, -hh + 20);
    ctx.lineTo( 8, -hh);
    ctx.closePath();
    ctx.strokeStyle = '#64748B'; ctx.lineWidth = 2; ctx.stroke();

    if (fillFrac > 0) {
      var flaskFillH = (h - 24) * fillFrac;
      ctx.fillStyle = obj.liquidColor || 'rgba(252, 196, 48, 0.5)';
      var topW = w * fillFrac * 0.95;
      ctx.fillRect(-topW/2, hh - flaskFillH, topW, flaskFillH - 2);
    }

    ctx.fillStyle = '#1E293B'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(obj.label || 'Conical Flask', 0, hh + 12);
  }

  function drawTestTube(obj) {
    var w = 24, h = obj.height || 70;
    var hw = w / 2, hh = h / 2;
    var fillFrac = (obj.fillFraction !== undefined) ? obj.fillFraction : 0.35;

    ctx.beginPath();
    ctx.moveTo(-hw, -hh);
    ctx.lineTo(-hw, hh - hw);
    ctx.arc(0, hh - hw, hw, Math.PI, 0);
    ctx.lineTo(hw, -hh);
    ctx.strokeStyle = '#64748B'; ctx.lineWidth = 1.5; ctx.stroke();

    if (fillFrac > 0) {
      var ttFillH = h * fillFrac;
      ctx.fillStyle = obj.liquidColor || 'rgba(220, 38, 38, 0.4)';
      ctx.fillRect(-hw + 1.5, hh - ttFillH, w - 3, ttFillH - 6);
    }

    ctx.fillStyle = '#1E293B'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(obj.label || 'Test Tube', 0, -hh - 5);
  }

  function drawBurette(obj) {
    var w = 16, h = obj.height || 160;
    var hw = w / 2, hh = h / 2;
    var reading = (obj.reading !== undefined) ? obj.reading : 12.50;
    var fillH = h * (reading / 50.0);

    ctx.beginPath();
    ctx.rect(-hw, -hh, w, h);
    ctx.strokeStyle = '#64748B'; ctx.lineWidth = 1.5; ctx.stroke();

    ctx.fillStyle = obj.liquidColor || 'rgba(8,145,178,0.35)';
    ctx.fillRect(-hw + 1.5, -hh + 1.5, w - 3, fillH - 1.5);

    ctx.strokeStyle = '#475569'; ctx.lineWidth = 0.7;
    ctx.fillStyle   = '#334155'; ctx.font = '7px monospace'; ctx.textAlign = 'left';
    for (var ml = 0; ml <= 50; ml += 2) {
      var my = -hh + (h * ml / 50);
      ctx.beginPath(); ctx.moveTo(hw - 6, my); ctx.lineTo(hw, my); ctx.stroke();
      if (ml % 10 === 0) ctx.fillText(ml, hw + 2, my + 3);
    }

    ctx.fillStyle = '#334155';
    ctx.fillRect(-hw - 8, hh - 10, w + 16, 8);

    ctx.beginPath();
    ctx.moveTo(-3, hh); ctx.lineTo(3, hh); ctx.lineTo(1, hh + 12); ctx.lineTo(-1, hh + 12); ctx.closePath();
    ctx.fillStyle = '#64748B'; ctx.fill();

    ctx.fillStyle = '#1E293B'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Burette', 0, hh + 20);
    ctx.fillStyle = '#7C3AED'; ctx.font = 'bold 9px monospace';
    ctx.fillText(reading.toFixed(2) + ' mL', 0, -hh - 8);
  }

  function drawThermometer(obj) {
    var temp = (obj.temperature !== undefined) ? obj.temperature : 25;
    var h    = obj.height || 120;
    var hh   = h / 2;
    var fillFrac = Math.max(0, Math.min(1, (temp + 10) / 120));

    ctx.beginPath();
    ctx.arc(0, hh - 8, 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(220,38,38,0.8)'; ctx.fill();
    ctx.strokeStyle = '#64748B'; ctx.lineWidth = 1; ctx.stroke();

    ctx.beginPath();
    ctx.rect(-4, -hh, 8, h - 16);
    ctx.strokeStyle = '#64748B'; ctx.lineWidth = 1; ctx.stroke();

    var mercH = (h - 20) * fillFrac;
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(-2.5, hh - 16 - mercH, 5, mercH);

    ctx.strokeStyle = '#475569'; ctx.lineWidth = 0.7;
    for (var t = 0; t <= 110; t += 10) {
      var ty = hh - 16 - ((h - 20) * (t + 10) / 120);
      ctx.beginPath(); ctx.moveTo(4, ty); ctx.lineTo(8, ty); ctx.stroke();
      ctx.fillStyle = '#334155'; ctx.font = '6px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(t + '°', 9, ty + 2);
    }

    ctx.fillStyle = '#7C3AED'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
    ctx.fillText(temp + '°C', 0, -hh - 8);
  }

  function drawBunsen(obj) {
    var hw = 16, hh = 40;
    ctx.fillStyle = '#475569';
    ctx.fillRect(-hw - 4, hh - 12, (hw + 4) * 2, 12);
    ctx.fillStyle = '#64748B';
    ctx.fillRect(-8, -hh + 8, 16, hh);
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(-9, -hh + 30, 18, 10);
    ctx.fillStyle = '#475569';
    ctx.fillRect(-hw - 4, hh - 24, hw - 4, 8);

    var isBlue = obj.flameType !== 'yellow';
    var fc1 = isBlue ? 'rgba(96,165,250,0.9)' : 'rgba(251,191,36,0.9)';
    var fc2 = isBlue ? 'rgba(37,99,235,0.7)'  : 'rgba(239,68,68,0.7)';
    ctx.beginPath();
    ctx.moveTo(-8, -hh + 8);
    ctx.bezierCurveTo(-14, -hh - 18, 14, -hh - 18, 8, -hh + 8);
    ctx.fillStyle = fc2; ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-5, -hh + 8);
    ctx.bezierCurveTo(-8, -hh - 10, 8, -hh - 10, 5, -hh + 8);
    ctx.fillStyle = fc1; ctx.fill();
    ctx.fillStyle = '#1E293B'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(obj.label || 'Bunsen', 0, hh + 8);
  }

  function drawSepFunnel(obj) {
    var w = obj.width || 50, h = obj.height || 100;
    var hw = w/2, hh = h/2;
    ctx.beginPath();
    ctx.ellipse(0, -hh + 28, hw, 28, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#64748B'; ctx.lineWidth = 1.5; ctx.stroke();

    ctx.fillStyle = obj.liquidColor || 'rgba(8,145,178,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, -hh + 28, hw - 2, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#334155'; ctx.fillRect(-8, -hh + 54, 16, 6);

    ctx.beginPath();
    ctx.moveTo(-4, -hh + 60); ctx.lineTo(-2, hh); ctx.lineTo(2, hh); ctx.lineTo(4, -hh + 60); ctx.closePath();
    ctx.strokeStyle = '#64748B'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#1E293B'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Sep. Funnel', 0, hh + 12);
  }

  function drawCondenser(obj) {
    var w = obj.width || 120, h = 30;
    var hw = w/2;
    ctx.beginPath();
    ctx.rect(-hw, -h, w, h * 2);
    ctx.strokeStyle = '#94A3B8'; ctx.lineWidth = 1.5; ctx.stroke();

    ctx.beginPath();
    ctx.rect(-hw + 8, -h * 0.5, w - 16, h);
    ctx.strokeStyle = '#64748B'; ctx.lineWidth = 1; ctx.stroke();

    ctx.fillStyle = '#0891B2'; ctx.font = '8px sans-serif';
    ctx.textAlign = 'left';  ctx.fillText('↑ Water out', -hw + 2, -h + 10);
    ctx.textAlign = 'right'; ctx.fillText('Water in ↓', hw - 2, h - 4);
    ctx.fillStyle = '#1E293B'; ctx.textAlign = 'center'; ctx.font = '8px sans-serif';
    ctx.fillText('Condenser', 0, h + 12);
  }

  function drawMoleculeLabel(obj) {
    ctx.font = 'bold ' + (obj.fontSize || 18) + 'px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = obj.color || '#1E293B';
    ctx.fillText(obj.formula || 'H₂O', 0, 0);
    if (obj.sublabel) {
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText(obj.sublabel, 0, 16);
    }
  }

  function drawReactionArrow(obj) {
    var len = obj.length || 80;
    ctx.strokeStyle = '#1E293B'; ctx.lineWidth = 2;
    var isReversible = obj.reversible;
    ctx.beginPath();
    ctx.moveTo(-len/2, 0); ctx.lineTo(len/2, 0);
    if (isReversible) { ctx.moveTo(-len/2, -4); ctx.lineTo(len/2, -4); }
    ctx.stroke();

    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.moveTo(len/2, 0); ctx.lineTo(len/2 - 8, -5); ctx.lineTo(len/2 - 8, 5); ctx.closePath(); ctx.fill();
    if (isReversible) {
      ctx.beginPath();
      ctx.moveTo(-len/2, -4); ctx.lineTo(-len/2 + 8, -9); ctx.lineTo(-len/2 + 8, 1); ctx.closePath(); ctx.fill();
    }
    if (obj.conditions) {
      ctx.font = '9px sans-serif'; ctx.fillStyle = '#64748B'; ctx.textAlign = 'center';
      ctx.fillText(obj.conditions, 0, -10);
    }
  }

  function drawPhStrip(obj) {
    var w = obj.width || 160, h = 20;
    var grd = ctx.createLinearGradient(-w/2, 0, w/2, 0);
    grd.addColorStop(0,   '#DC2626');
    grd.addColorStop(0.15,'#EA580C');
    grd.addColorStop(0.3, '#D97706');
    grd.addColorStop(0.5, '#16A34A');
    grd.addColorStop(0.65,'#0891B2');
    grd.addColorStop(0.85,'#2563EB');
    grd.addColorStop(1,   '#7C3AED');
    ctx.fillStyle = grd;
    ctx.fillRect(-w/2, -h/2, w, h);

    if (obj.pH !== undefined) {
      var markerX = -w/2 + (w * obj.pH / 14);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(markerX - 1, -h/2 - 4, 2, h + 8);
      ctx.font = 'bold 9px monospace'; ctx.fillStyle = '#000'; ctx.textAlign = 'center';
      ctx.fillText('pH ' + obj.pH.toFixed(1), markerX, h/2 + 14);
    }

    ctx.font = '7px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
    for (var ph = 0; ph <= 14; ph += 2) {
      ctx.fillText(ph, -w/2 + (w * ph / 14), h/2 - 2);
    }
  }

  function drawElectrolysis(obj) {
    var w = obj.width || 180, h = obj.height || 120;
    var hw = w/2, hh = h/2;
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 2;
    ctx.strokeRect(-hw, -hh + 20, w, h - 20);

    ctx.fillStyle = 'rgba(147,197,253,0.4)';
    ctx.fillRect(-hw + 2, -hh + 24, w - 4, h - 26);

    ctx.fillStyle = '#334155';
    ctx.fillRect(-hw + 20, -hh, 6, h - 20);
    ctx.fillRect( hw - 26, -hh, 6, h - 20);

    ctx.fillStyle = '#DC2626'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Anode (+)', -hw + 23, -hh - 5);
    ctx.fillStyle = '#2563EB';
    ctx.fillText('Cathode (−)', hw - 23, -hh - 5);

    ctx.strokeStyle = '#16A34A'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-hw + 60, 10); ctx.lineTo(-hw + 35, 10); ctx.stroke();
    ctx.strokeStyle = '#DC2626';
    ctx.beginPath(); ctx.moveTo(hw - 60, 10); ctx.lineTo(hw - 35, 10); ctx.stroke();
    ctx.font = '8px sans-serif'; ctx.fillStyle = '#16A34A'; ctx.textAlign = 'center';
    ctx.fillText('cations →', -hw + 80, 8);
    ctx.fillStyle = '#DC2626';
    ctx.fillText('← anions', hw - 80, 8);
    ctx.fillStyle = '#1E293B'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(obj.label || 'Electrolytic Cell', 0, hh + 12);
  }

  function drawGenericBox(obj) {
    var w = obj.width || 80, h = obj.height || 50;
    ctx.fillStyle = '#F1F5F9';
    ctx.fillRect(-w/2, -h/2, w, h);
    ctx.strokeStyle = '#94A3B8'; ctx.lineWidth = 1.5;
    ctx.strokeRect(-w/2, -h/2, w, h);
    ctx.fillStyle = '#475569'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(obj.label || obj.type, 0, 4);
  }

  // ============================================================
  // TITRATION SCENE
  // ============================================================
  function drawTitrationScene(canvasEl, state) {
    var c  = canvasEl;
    if (!c) return;
    var cx = c.getContext('2d');
    var w  = c.width, h = c.height;
    cx.clearRect(0, 0, w, h);

    cx.fillStyle = '#F8FAFC'; cx.fillRect(0, 0, w, h);

    var bx = w * 0.3, buretteH = h * 0.5, buretteW = 20;
    var reading  = state.buretteReading || 0;
    var fillFrac = reading / 50;

    cx.fillStyle = '#64748B';
    cx.fillRect(bx - 40, 10, 8, h * 0.6);
    cx.fillRect(bx - 40, 20, 50, 5);

    cx.strokeStyle = '#64748B'; cx.lineWidth = 2;
    cx.strokeRect(bx - buretteW/2, 30, buretteW, buretteH);

    cx.fillStyle = state.buretteColor || 'rgba(8,145,178,0.5)';
    cx.fillRect(bx - buretteW/2 + 2, 32, buretteW - 4, buretteH * fillFrac);

    cx.strokeStyle = '#94A3B8'; cx.lineWidth = 0.7;
    for (var ml = 0; ml <= 50; ml += 5) {
      var my = 32 + buretteH * ml / 50;
      cx.beginPath(); cx.moveTo(bx + buretteW/2 - 8, my); cx.lineTo(bx + buretteW/2, my); cx.stroke();
      cx.fillStyle = '#475569'; cx.font = '8px monospace'; cx.textAlign = 'left';
      cx.fillText(ml, bx + buretteW/2 + 2, my + 3);
    }

    cx.fillStyle = '#334155'; cx.fillRect(bx - buretteW/2 - 6, 30 + buretteH, buretteW + 12, 6);

    cx.beginPath(); cx.moveTo(bx - 4, 36 + buretteH); cx.lineTo(bx + 4, 36 + buretteH); cx.lineTo(bx + 1, 36 + buretteH + 20); cx.lineTo(bx - 1, 36 + buretteH + 20); cx.closePath();
    cx.fillStyle = '#64748B'; cx.fill();

    cx.fillStyle = '#7C3AED'; cx.font = 'bold 11px monospace'; cx.textAlign = 'center';
    cx.fillText(reading.toFixed(2) + ' mL', bx, 22);

    var fx = w * 0.3, fy = h * 0.82, fw = 70, fh = 65;
    cx.beginPath();
    cx.moveTo(fx - 10, fy - fh);
    cx.lineTo(fx - fw/2, fy);
    cx.lineTo(fx + fw/2, fy);
    cx.lineTo(fx + 10, fy - fh);
    cx.closePath();
    cx.fillStyle = state.flaskColor || 'rgba(252,196,48,0.45)';
    cx.fill();
    cx.strokeStyle = '#64748B'; cx.lineWidth = 2; cx.stroke();

    if (state.indicatorTriggered) {
      cx.fillStyle = state.endpointColor || 'rgba(236,72,153,0.35)';
      cx.beginPath();
      cx.moveTo(fx - 10, fy - fh);
      cx.lineTo(fx - fw/2, fy); cx.lineTo(fx + fw/2, fy); cx.lineTo(fx + 10, fy - fh);
      cx.closePath(); cx.fill();
    }

    cx.fillStyle = '#334155'; cx.font = 'bold 12px sans-serif'; cx.textAlign = 'center';
    cx.fillText('Titration Workspace', w/2, 16);
    cx.font = '10px sans-serif'; cx.fillStyle = '#64748B';
    cx.fillText('Deliver titrant dropwise into conical flask.', w/2, 30);
    if (state.indicatorTriggered) {
      cx.fillStyle = '#DC2626'; cx.font = 'bold 12px sans-serif';
      cx.fillText('ENDPOINT REACHED', w/2, h - 10);
    }
  }

  // ============================================================
  // TITRATION CURVE CANVAS
  // ============================================================
  function drawTitrationCurve(canvasEl, dataPoints, config) {
    var c  = canvasEl;
    if (!c) return;
    var cx = c.getContext('2d');
    var w  = c.width, h = c.height;
    var pad = { top:30, right:20, bottom:40, left:50 };
    cx.clearRect(0, 0, w, h);
    cx.fillStyle = '#fff'; cx.fillRect(0, 0, w, h);

    var plotW = w - pad.left - pad.right;
    var plotH = h - pad.top  - pad.bottom;

    cx.strokeStyle = '#334155'; cx.lineWidth = 1.5;
    cx.beginPath();
    cx.moveTo(pad.left, pad.top); cx.lineTo(pad.left, pad.top + plotH);
    cx.lineTo(pad.left + plotW, pad.top + plotH);
    cx.stroke();

    cx.fillStyle = '#334155'; cx.font = 'bold 10px sans-serif';
    cx.textAlign = 'center';
    cx.fillText((config && config.xLabel) || 'Volume of Titrant Added (cm³)', pad.left + plotW/2, h - 5);
    cx.save(); cx.translate(12, pad.top + plotH/2); cx.rotate(-Math.PI/2);
    cx.fillText('pH', 0, 0); cx.restore();

    if (!dataPoints || dataPoints.length < 2) {
      cx.fillStyle = '#94A3B8'; cx.font = '12px sans-serif'; cx.textAlign = 'center';
      cx.fillText('Start titration to generate curve...', pad.left + plotW/2, pad.top + plotH/2);
      return;
    }

    var maxVol = Math.max.apply(null, dataPoints.map(function(p){ return p.vol; }));
    if (maxVol < 30) maxVol = 30;
    var minPH = 0, maxPH = 14;

    function toX(v)  { return pad.left  + (v / maxVol) * plotW; }
    function toY(ph) { return pad.top + plotH - ((ph - minPH) / (maxPH - minPH)) * plotH; }

    cx.strokeStyle = '#E2E8F0'; cx.lineWidth = 0.7;
    for (var ph = 0; ph <= 14; ph += 2) {
      cx.beginPath(); cx.moveTo(pad.left, toY(ph)); cx.lineTo(pad.left + plotW, toY(ph)); cx.stroke();
      cx.fillStyle = '#94A3B8'; cx.font = '8px sans-serif'; cx.textAlign = 'right';
      cx.fillText(ph, pad.left - 4, toY(ph) + 3);
    }

    if (config && config.equivalenceVol) {
      cx.strokeStyle = '#DC2626'; cx.lineWidth = 1; cx.setLineDash([4,3]);
      var ex = toX(config.equivalenceVol);
      cx.beginPath(); cx.moveTo(ex, pad.top); cx.lineTo(ex, pad.top + plotH); cx.stroke();
      cx.setLineDash([]);
      cx.fillStyle = '#DC2626'; cx.font = '9px sans-serif'; cx.textAlign = 'center';
      cx.fillText('Eq. point', ex, pad.top - 4);
    }

    cx.strokeStyle = '#7C3AED'; cx.lineWidth = 2; cx.setLineDash([]);
    cx.beginPath();
    cx.moveTo(toX(dataPoints[0].vol), toY(dataPoints[0].pH));
    for (var i = 1; i < dataPoints.length; i++) {
      cx.lineTo(toX(dataPoints[i].vol), toY(dataPoints[i].pH));
    }
    cx.stroke();
  }

  // ============================================================
  // ENERGY PROFILE CANVAS
  // ============================================================
  function drawEnergyProfile(canvasEl, config) {
    var c  = canvasEl;
    if (!c) return;
    var cx = c.getContext('2d');
    var w  = c.width, h = c.height;
    var pad = { top:30, right:30, bottom:40, left:60 };
    cx.clearRect(0, 0, w, h); cx.fillStyle = '#fff'; cx.fillRect(0, 0, w, h);

    var plotW = w - pad.left - pad.right;
    var plotH = h - pad.top  - pad.bottom;
    var isExo  = (config && config.type === 'exothermic');
    var Ea     = (config && config.Ea)     || 80;
    var deltaH = (config && config.deltaH) || (isExo ? -60 : 40);

    var reactantE = 100;
    var transE    = reactantE + Ea;
    var productE  = reactantE + deltaH;
    var maxE      = Math.max(reactantE, transE, productE) + 20;
    var minE      = Math.min(reactantE, productE) - 20;

    function toY(e) { return pad.top + plotH - ((e - minE) / (maxE - minE)) * plotH; }

    cx.strokeStyle = '#334155'; cx.lineWidth = 1.5;
    cx.beginPath();
    cx.moveTo(pad.left, pad.top); cx.lineTo(pad.left, pad.top + plotH);
    cx.lineTo(pad.left + plotW, pad.top + plotH);
    cx.stroke();

    cx.fillStyle = '#334155'; cx.font = 'bold 10px sans-serif'; cx.textAlign = 'center';
    cx.fillText('Reaction Coordinate', pad.left + plotW/2, h - 4);
    cx.save(); cx.translate(14, pad.top + plotH/2); cx.rotate(-Math.PI/2);
    cx.fillText('Energy (kJ mol⁻¹)', 0, 0); cx.restore();

    var x0 = pad.left, x1 = pad.left + plotW * 0.35, x2 = pad.left + plotW * 0.65, x3 = pad.left + plotW;
    var y0 = toY(reactantE), y1 = toY(transE), y3 = toY(productE);

    cx.strokeStyle = isExo ? '#DC2626' : '#2563EB'; cx.lineWidth = 3;
    cx.beginPath();
    cx.moveTo(x0, y0);
    cx.bezierCurveTo(x0 + plotW*0.2, y0, x1 - plotW*0.05, y1, x1, y1);
    cx.bezierCurveTo(x1 + plotW*0.05, y1, x2 - plotW*0.05, y1, x2, y1);
    cx.bezierCurveTo(x2 + plotW*0.05, y1, x3 - plotW*0.1, y3, x3, y3);
    cx.stroke();

    cx.strokeStyle = '#D97706'; cx.lineWidth = 1.5;
    cx.setLineDash([3,2]);
    cx.beginPath(); cx.moveTo(pad.left + 20, y0); cx.lineTo(pad.left + 20, y1); cx.stroke();
    cx.setLineDash([]);
    cx.fillStyle = '#D97706'; cx.font = 'bold 9px sans-serif'; cx.textAlign = 'left';
    cx.fillText('Eₐ = ' + Ea + ' kJ/mol', pad.left + 22, (y0 + y1)/2);

    cx.strokeStyle = isExo ? '#DC2626' : '#2563EB'; cx.lineWidth = 1.5;
    cx.setLineDash([3,2]);
    cx.beginPath(); cx.moveTo(x3 - 20, y0); cx.lineTo(x3 - 20, y3); cx.stroke();
    cx.setLineDash([]);
    cx.fillStyle = isExo ? '#DC2626' : '#2563EB'; cx.font = 'bold 9px sans-serif'; cx.textAlign = 'right';
    cx.fillText('ΔH = ' + deltaH + ' kJ/mol', x3 - 22, (y0 + y3)/2);

    cx.fillStyle = '#059669'; cx.font = 'bold 10px sans-serif'; cx.textAlign = 'left';
    cx.fillText('Reactants', x0 + 4, y0 - 6);
    cx.fillStyle = isExo ? '#DC2626' : '#2563EB'; cx.textAlign = 'right';
    cx.fillText('Products', x3 - 4, y3 - 6);
    cx.fillStyle = '#D97706'; cx.textAlign = 'center';
    cx.fillText('Transition State', (x1 + x2)/2, y1 - 8);

    cx.fillStyle = '#0F172A'; cx.font = 'bold 11px sans-serif'; cx.textAlign = 'center';
    cx.fillText(isExo ? 'Exothermic Reaction Energy Profile' : 'Endothermic Reaction Energy Profile', pad.left + plotW/2, pad.top - 8);
  }

  return {
    init:               init,
    resize:             resize,
    addObject:          addObject,
    clearObjects:       clearObjects,
    getSelected:        getSelected,
    deleteSelected:     deleteSelected,
    duplicateSelected:  duplicateSelected,
    drawAll:            drawAll,
    getObjects:         function() { return objects; },
    setObjects:         function(arr) { objects = arr; drawAll(); },
    drawTitrationScene: drawTitrationScene,
    drawTitrationCurve: drawTitrationCurve,
    drawEnergyProfile:  drawEnergyProfile
  };
})();
