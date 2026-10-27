/**
 * Navegador de iconos: los del propio deck (reutilizables sin subir de nuevo)
 * y los del design system (se importan al deck al elegirlos).
 */

import { state } from '../state.js';
import { toast } from '../toast.js';
import { getAssets, getDesignSystemIcons } from '../api-client.js';
import { IMAGE_EXT_RE } from '../lib/glyph.mjs';
import { uploadAssetForDeck } from './upload.js';

// Los iconos del design system no cambian durante la sesión: se piden una vez.
let iconBrowserData = null;

export async function openIconBrowser(deckSlug, onComplete) {
  if (!iconBrowserData) {
    try {
      iconBrowserData = await getDesignSystemIcons();
    } catch (e) {
      toast('Failed to load icons: ' + e.message, 'error');
      return;
    }
  }

  // Icons/images already imported into this deck — re-fetched each open since
  // they may have changed. These can be reused without re-uploading.
  let deckIcons = [];
  if (deckSlug) {
    const assets = await getAssets(deckSlug).catch(() => []);
    deckIcons = (assets || []).filter(f => IMAGE_EXT_RE.test(f));
  }

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';

  const modal = document.createElement('div');
  modal.className = 'icon-browser-modal';

  const header = document.createElement('div');
  header.className = 'icon-browser-header';
  
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search icons...';
  searchInput.className = 'icon-search-input';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.textContent = '✕';
  closeBtn.className = 'icon-browser-close';
  closeBtn.title = 'Close (Esc)';
  closeBtn.setAttribute('aria-label', 'Close');

  function closeModal() {
    backdrop.remove();
    document.removeEventListener('keydown', onKeydown);
  }
  function onKeydown(e) {
    if (e.key === 'Escape') { e.preventDefault(); closeModal(); }
  }
  closeBtn.onclick = closeModal;
  // Click on the dimmed area outside the modal closes it.
  backdrop.addEventListener('mousedown', e => { if (e.target === backdrop) closeModal(); });
  document.addEventListener('keydown', onKeydown);

  header.appendChild(searchInput);
  header.appendChild(closeBtn);
  modal.appendChild(header);

  const container = document.createElement('div');
  container.className = 'icon-browser-container';
  modal.appendChild(container);
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  function renderIcons(query) {
    container.innerHTML = '';
    const q = query ? query.toLowerCase() : '';
    let renderedAny = false;

    // Deck-imported icons first — selectable without re-uploading.
    const matchingDeckIcons = deckIcons.filter(
      f => !q || f.toLowerCase().includes(q),
    );
    if (matchingDeckIcons.length) {
      renderedAny = true;
      const section = document.createElement('div');
      section.className = 'icon-category-section';

      const title = document.createElement('h3');
      title.textContent = 'In this deck';
      section.appendChild(title);

      const grid = document.createElement('div');
      grid.className = 'icon-browser-grid';

      for (const filename of matchingDeckIcons) {
        const item = document.createElement('div');
        item.className = 'icon-browser-item';
        item.title = filename;

        const wrapper = document.createElement('div');
        wrapper.className = 'icon-svg-wrapper';
        const img = document.createElement('img');
        img.src = `${state.previewOrigin}/talks/decks/${deckSlug}/assets/${filename}`;
        img.alt = filename;
        wrapper.appendChild(img);

        const label = document.createElement('span');
        label.textContent = filename.replace(/\.[^.]+$/, '');

        item.appendChild(wrapper);
        item.appendChild(label);

        item.addEventListener('click', () => {
          onComplete(filename);
          closeModal();
        });

        grid.appendChild(item);
      }
      section.appendChild(grid);
      container.appendChild(section);
    }

    // Group design-system icons by category
    const grouped = {};
    for (const icon of iconBrowserData) {
      if (q && !icon.filename.toLowerCase().includes(q) && !icon.category.toLowerCase().includes(q)) continue;
      if (!grouped[icon.category]) grouped[icon.category] = [];
      grouped[icon.category].push(icon);
    }

    if (!renderedAny && Object.keys(grouped).length === 0) {
      container.innerHTML = '<p class="empty-state">No icons found.</p>';
      return;
    }

    for (const [category, icons] of Object.entries(grouped)) {
      const section = document.createElement('div');
      section.className = 'icon-category-section';
      
      const title = document.createElement('h3');
      title.textContent = category;
      section.appendChild(title);

      const grid = document.createElement('div');
      grid.className = 'icon-browser-grid';

      for (const icon of icons) {
        const item = document.createElement('div');
        item.className = 'icon-browser-item';
        item.title = icon.filename;
        
        // Wrap SVG content
        const svgWrapper = document.createElement('div');
        svgWrapper.className = 'icon-svg-wrapper';
        svgWrapper.innerHTML = icon.svgContent;
        
        const label = document.createElement('span');
        label.textContent = icon.filename.replace('.svg', '');
        
        item.appendChild(svgWrapper);
        item.appendChild(label);

        item.addEventListener('click', async () => {
          const btnTxt = item.querySelector('span');
          const originalTxt = btnTxt.textContent;
          btnTxt.textContent = 'Importing...';
          try {
            const blob = new Blob([icon.svgContent], { type: 'image/svg+xml' });
            const filename = await uploadAssetForDeck(deckSlug, blob, 'image/svg+xml', icon.filename);
            if (filename) {
              onComplete(filename);
              closeModal();
            }
          } catch (e) {
            toast('Failed to import icon: ' + e.message, 'error');
            btnTxt.textContent = originalTxt;
          }
        });

        grid.appendChild(item);
      }
      section.appendChild(grid);
      container.appendChild(section);
    }
  }

  searchInput.addEventListener('input', e => renderIcons(e.target.value));
  renderIcons('');
  searchInput.focus();
}
