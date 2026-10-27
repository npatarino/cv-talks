/** Menú contextual (clic derecho) de una slide de la sidebar. */

let contextMenuEl = null;

export function closeSlideContextMenu() {
  if (contextMenuEl) {
    contextMenuEl.remove();
    contextMenuEl = null;
    document.removeEventListener('mousedown', onContextOutside, true);
    document.removeEventListener('keydown', onContextEscape, true);
    window.removeEventListener('scroll', closeSlideContextMenu, true);
  }
}

function onContextOutside(e) {
  if (contextMenuEl && !contextMenuEl.contains(e.target)) closeSlideContextMenu();
}

function onContextEscape(e) {
  if (e.key === 'Escape') closeSlideContextMenu();
}

/**
 * @param {{onDuplicate: (filename: string) => void, onDelete: (filename: string) => void}} actions
 */
export function openSlideContextMenu(x, y, filename, { onDuplicate, onDelete }) {
  closeSlideContextMenu();
  const menu = document.createElement('div');
  menu.className = 'context-menu';

  const items = [
    {
      label: 'Duplicate slide',
      icon: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 4h5v8h-5zM6.5 2h5v8h-5z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      action: () => onDuplicate(filename),
    },
    {
      label: 'Delete slide',
      danger: true,
      icon: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.7 7.5h6.6L11 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      action: () => onDelete(filename),
    },
  ];

  items.forEach(({ label, danger, icon, action }) => {
    const btn = document.createElement('button');
    btn.className = 'context-menu-item' + (danger ? ' danger' : '');
    btn.innerHTML = `${icon}<span>${label}</span>`;
    btn.addEventListener('click', () => {
      closeSlideContextMenu();
      action();
    });
    menu.appendChild(btn);
  });

  // Position before measuring — set visibility hidden first so we can read
  // the size without flashing the menu off-screen.
  menu.style.visibility = 'hidden';
  menu.style.position = 'fixed';
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
  document.body.appendChild(menu);

  // Clamp to viewport
  const rect = menu.getBoundingClientRect();
  let left = x, top = y;
  if (left + rect.width > window.innerWidth - 8) left = window.innerWidth - rect.width - 8;
  if (top + rect.height > window.innerHeight - 8) top = window.innerHeight - rect.height - 8;
  menu.style.left = left + 'px';
  menu.style.top = top + 'px';
  menu.style.visibility = '';

  contextMenuEl = menu;
  // Use capture phase so outside-click closes even when other handlers stop propagation.
  document.addEventListener('mousedown', onContextOutside, true);
  document.addEventListener('keydown', onContextEscape, true);
  window.addEventListener('scroll', closeSlideContextMenu, true);
}
