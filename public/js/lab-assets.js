(function () {
  'use strict';

  const script = document.currentScript;
  const subject = script?.dataset.subject;
  if (!subject) return;

  const viewerFormats = new Set(['glb', 'gltf', 'obj', 'stl', 'pdb', 'sdf', 'mol', 'png', 'jpg', 'jpeg', 'svg']);
  const dock = document.createElement('details');
  dock.className = 'lab-asset-dock';
  dock.innerHTML = '<summary><span aria-hidden="true">▦</span> Sourced assets</summary><div class="lab-asset-dock-body"><p class="lab-asset-dock-status" role="status" aria-live="polite">Open to load reviewed assets for this lab.</p><div class="lab-asset-dock-list"></div></div>';
  document.body.appendChild(dock);
  const status = dock.querySelector('.lab-asset-dock-status');
  const list = dock.querySelector('.lab-asset-dock-list');
  let loaded = false;

  function addLink(parent, href, label, external) {
    const link = document.createElement('a');
    link.className = 'lab-asset-link';
    link.href = href;
    link.textContent = label;
    if (external) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
    parent.appendChild(link);
  }

  function renderAsset(asset) {
    const card = document.createElement('article');
    card.className = 'lab-asset-card';
    const title = document.createElement('h3');
    title.textContent = asset.name;
    const description = document.createElement('p');
    description.textContent = asset.description || 'Source-linked learning asset.';
    const metadata = document.createElement('p');
    metadata.className = 'lab-asset-meta';
    metadata.textContent = `${asset.source_institution || 'Source not recorded'} · ${asset.license || 'License not recorded'} · ${String(asset.import_status || 'candidate').replaceAll('_', ' ')}`;
    card.append(title, description, metadata);

    if (asset.model_url && viewerFormats.has(String(asset.model_format).toLowerCase())) {
      addLink(card, `/scientific-viewer.html?asset=${encodeURIComponent(asset.asset_key)}`, 'Open viewer', false);
    } else if (asset.model_url) {
      addLink(card, asset.model_url, 'Open source data', !asset.model_url.startsWith('/'));
    }

    if (asset.asset_key === 'math-noaa-mauna-loa-co2') {
      const load = document.createElement('button');
      load.type = 'button';
      load.className = 'lab-asset-link';
      load.textContent = 'Load observations in graph';
      load.addEventListener('click', () => document.getElementById('btn-load-noaa-co2')?.click());
      card.appendChild(load);
    } else if (asset.asset_key === 'geography-aster-dem') {
      const load = document.createElement('button');
      load.type = 'button';
      load.className = 'lab-asset-link';
      load.textContent = 'Sample real elevation in Geography Lab';
      load.addEventListener('click', () => document.getElementById('btn-geo-real-terrain')?.click());
      card.appendChild(load);
    }

    if (asset.source_url) addLink(card, asset.source_url, 'Source record and license', true);
    return card;
  }

  async function loadAssets() {
    if (loaded) return;
    loaded = true;
    status.textContent = 'Loading permitted assets…';
    try {
      const response = await fetch(`/api/science/assets?subject=${encodeURIComponent(subject)}&limit=50`, { credentials: 'same-origin' });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || `Asset registry request failed (${response.status}).`);
      if (!result.assets.length) {
        status.textContent = 'No published source-reviewed assets are registered for this lab yet.';
        return;
      }
      result.assets.forEach((asset) => list.appendChild(renderAsset(asset)));
      status.textContent = `${result.assets.length} source-reviewed item${result.assets.length === 1 ? '' : 's'} available.`;
    } catch (error) {
      loaded = false;
      status.textContent = `Asset registry unavailable: ${error.message}`;
    }
  }

  dock.addEventListener('toggle', () => {
    if (dock.open) loadAssets();
  });
})();
