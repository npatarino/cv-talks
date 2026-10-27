/** Panel de notas del orador: plegable, redimensionable y recordado en localStorage. */

import { dom } from './dom.js';
import { emit } from './events.js';

export function initNotes() {
  // Speaker notes: toggle collapse
  dom.btnNotesToggle.addEventListener('click', () => {
    dom.notesPanel.classList.toggle('collapsed');
    const collapsed = dom.notesPanel.classList.contains('collapsed');
    localStorage.setItem('notesPanelCollapsed', collapsed ? '1' : '0');
  });
  if (localStorage.getItem('notesPanelCollapsed') === '1') {
    dom.notesPanel.classList.add('collapsed');
  }

  // Speaker notes: mark unsaved on input
  dom.notesTextarea.addEventListener('input', () => emit('form:changed'));

  // Speaker notes: drag-to-resize
  dom.notesResizeHandle.addEventListener('mousedown', e => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = dom.notesPanel.offsetHeight;
    function onMove(ev) {
      const delta = startY - ev.clientY;
      const newH = Math.max(36, startH + delta);
      dom.notesPanel.style.height = newH + 'px';
      if (newH > 36) dom.notesPanel.classList.remove('collapsed');
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      localStorage.setItem('notesPanelHeight', dom.notesPanel.offsetHeight + 'px');
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
  const savedH = localStorage.getItem('notesPanelHeight');
  if (savedH) dom.notesPanel.style.height = savedH;
}
