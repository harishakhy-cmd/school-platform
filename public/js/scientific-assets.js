(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const list = $('asset-list');
  const status = $('asset-status');
  const editor = $('asset-editor');
  let isAdmin = false;

  function addMetadataRow(list, label, value, link) {
    if (!value) return;
    const row = document.createElement('div');
    const term = document.createElement('dt');
    const detail = document.createElement('dd');
    term.textContent = label;
    if (link) {
      const anchor = document.createElement('a');
      anchor.href = link;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.textContent = value;
      detail.appendChild(anchor);
    } else {
      detail.textContent = value;
    }
    row.append(term, detail);
    list.appendChild(row);
  }

  function showEmptyState(title, message, isError) {
    const empty = document.createElement('div');
    empty.className = `sv-library-empty${isError ? ' sv-library-error' : ''}`;
    const icon = document.createElement('i');
    icon.className = `fa-solid ${isError ? 'fa-triangle-exclamation' : 'fa-magnifying-glass'}`;
    icon.setAttribute('aria-hidden', 'true');
    const heading = document.createElement('strong');
    heading.textContent = title;
    const description = document.createElement('span');
    description.textContent = message;
    empty.append(icon, heading, description);
    list.appendChild(empty);
  }

  function renderAsset(asset) {
    const card = document.createElement('article');
    card.className = 'sv-card sv-asset-card';

    const media = document.createElement('div');
    media.className = 'sv-asset-media';
    if (asset.thumbnail_url) {
      const image = document.createElement('img');
      image.src = asset.thumbnail_url;
      image.alt = `${asset.name} preview`;
      image.loading = 'lazy';
      image.addEventListener('error', () => {
        image.remove();
        const fallback = document.createElement('i');
        fallback.className = 'fa-solid fa-cube';
        fallback.setAttribute('aria-hidden', 'true');
        media.appendChild(fallback);
      }, { once: true });
      media.appendChild(image);
    } else {
      const icon = document.createElement('i');
      icon.className = 'fa-solid fa-cube';
      icon.setAttribute('aria-hidden', 'true');
      media.appendChild(icon);
    }

    const content = document.createElement('div');
    content.className = 'sv-asset-content';
    const kicker = document.createElement('div');
    kicker.className = 'sv-asset-kicker';
    const category = document.createElement('span');
    category.textContent = `${asset.subject || 'Science'}${asset.category ? ` · ${asset.category}` : ''}`;
    const format = document.createElement('span');
    format.className = 'sv-format-pill';
    format.textContent = String(asset.model_format || 'asset').toUpperCase();
    const importStatus = document.createElement('span');
    importStatus.className = 'sv-format-pill';
    importStatus.textContent = String(asset.import_status || 'candidate').replaceAll('_', ' ');
    kicker.append(category, format, importStatus);

    const title = document.createElement('h2');
    title.className = 'sv-asset-title';
    title.textContent = asset.name;
    const description = document.createElement('p');
    description.className = 'sv-asset-description';
    description.textContent = asset.description || 'Explore this sourced scientific learning asset.';

    const provenance = document.createElement('dl');
    provenance.className = 'sv-asset-provenance';
    addMetadataRow(provenance, 'Review', String(asset.validation_status || 'Needs review').replaceAll('_', ' '));
    addMetadataRow(provenance, 'Institution', asset.source_institution);
    addMetadataRow(provenance, 'Record ID', asset.source_record_id);
    addMetadataRow(provenance, 'License', asset.license || 'Not specified');
    addMetadataRow(provenance, 'Attribution', asset.attribution);
    let sourceUrl = '';
    try {
      const parsedUrl = new URL(asset.source_url);
      if (parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:') sourceUrl = parsedUrl.href;
    } catch (_) { /* Keep malformed source metadata visible without making it clickable. */ }
    addMetadataRow(provenance, 'Source', sourceUrl ? 'View original record' : asset.source_url, sourceUrl);

    const actions = document.createElement('div');
    actions.className = 'sv-asset-actions';
    if (isAdmin && asset.validation_status !== 'verified' && asset.model_url) {
      const review = document.createElement('div');
      review.className = 'sv-review-actions';
      const reviewActions = asset.validation_status === 'source_verified'
        ? [['verified', 'Complete scientific review']]
        : [['source_verified', 'Verify source'], ['verified', 'Complete review']];
      reviewActions.forEach(([validationStatus, text]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-sm btn-outline-success';
        button.textContent = text;
        button.addEventListener('click', () => reviewAsset(asset.asset_key, validationStatus));
        review.appendChild(button);
      });
      content.appendChild(review);
    }

    if (['glb', 'gltf', 'obj', 'stl', 'pdb', 'sdf', 'mol', 'png', 'jpg', 'jpeg', 'svg'].includes(asset.model_format) && asset.model_url) {
      const view = document.createElement('a');
      view.href = `/scientific-viewer.html?asset=${encodeURIComponent(asset.asset_key)}`;
      view.className = 'btn btn-sm sv-view-asset';
      view.innerHTML = ['png', 'jpg', 'jpeg', 'svg'].includes(asset.model_format)
        ? '<i class="fa-regular fa-image" aria-hidden="true"></i> Open image viewer'
        : '<i class="fa-solid fa-cube" aria-hidden="true"></i> Open interactive viewer';
      actions.appendChild(view);
    }
    if (['csv', 'data'].includes(asset.model_format) && asset.model_url) {
      const source = document.createElement('a');
      source.href = asset.model_url;
      source.target = '_blank';
      source.rel = 'noopener noreferrer';
      source.className = 'btn btn-sm sv-view-asset';
      source.textContent = 'Open source data';
      actions.appendChild(source);
    }

    content.prepend(kicker, title, description, provenance);
    if (actions.childElementCount) content.appendChild(actions);
    card.append(media, content);
    return card;
  }

  async function loadAssets(event) {
    event?.preventDefault();
    status.textContent = 'Searching the scientific asset registry…';
    status.setAttribute('aria-busy', 'true');
    list.setAttribute('aria-busy', 'true');
    list.replaceChildren();
    const params = new URLSearchParams();
    if ($('asset-q').value.trim()) params.set('q', $('asset-q').value.trim());
    if ($('asset-subject').value) params.set('subject', $('asset-subject').value);
    if ($('asset-format').value) params.set('format', $('asset-format').value);
    try {
      const response = await fetch(`/api/science/assets?${params}`);
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Could not load scientific assets.');
      status.textContent = `${data.assets.length} permitted asset${data.assets.length === 1 ? '' : 's'} found.`;
      data.assets.forEach((asset) => list.appendChild(renderAsset(asset)));
      if (!data.assets.length) showEmptyState('No matching assets', 'Try a broader search or choose a different subject or format.');
    } catch (error) {
      status.textContent = error.message;
      showEmptyState('Could not load the library', error.message || 'Please try again in a moment.', true);
    } finally {
      status.setAttribute('aria-busy', 'false');
      list.setAttribute('aria-busy', 'false');
    }
  }

  const initialParams = new URLSearchParams(window.location.search);
  if (['biology', 'chemistry', 'physics', 'geography', 'mathematics', 'computer-science'].includes(initialParams.get('subject'))) {
    $('asset-subject').value = initialParams.get('subject');
  }
  if (initialParams.get('q')) $('asset-q').value = initialParams.get('q').slice(0, 120);

  async function checkStaff() {
    try {
      const response = await fetch('/api/admin/auth/me');
      if (!response.ok) return;
      const data = await response.json();
      if (['super_admin', 'ordinary_admin', 'tutor'].includes(data.role)) editor.hidden = false;
      isAdmin = ['super_admin', 'ordinary_admin'].includes(data.role);
    } catch (_) { /* Students can browse permitted assets without this optional staff check. */ }
  }

  async function reviewAsset(assetKey, validation_status) {
    if (!window.confirm(validation_status === 'verified'
      ? 'Confirm you reviewed this asset’s structure and scientific labels?'
      : 'Confirm you checked the original source and license for this asset?')) return;
    try {
      const response = await fetch(`/api/science/assets/${encodeURIComponent(assetKey)}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ validation_status, is_public: true })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Could not update asset review.');
      loadAssets();
    } catch (error) { status.textContent = error.message; }
  }

  $('asset-search').addEventListener('submit', loadAssets);
  $('asset-create-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const result = $('asset-create-status'); result.textContent = 'Submitting for review…';
    const payload = {
      asset_key: $('new-asset-key').value.trim(), name: $('new-asset-name').value.trim(),
      subject: $('new-asset-subject').value, model_format: $('new-asset-format').value,
      model_url: $('new-asset-model').value.trim(), source_url: $('new-asset-source').value.trim(),
      source_institution: $('new-asset-institution').value.trim(), license: $('new-asset-license').value.trim(),
      category: $('new-asset-category').value.trim(), description: $('new-asset-description').value.trim(),
      attribution: $('new-asset-attribution').value.trim(), source_record_id: $('new-asset-record').value.trim()
    };
    try {
      const response = await fetch('/api/science/assets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Submission failed.');
      result.textContent = data.message; event.target.reset(); loadAssets();
    } catch (error) { result.textContent = error.message; }
  });
  checkStaff().finally(loadAssets);
})();
