/** Avisos efímeros (esquina de la pantalla). `type`: '', 'success' o 'error'. */
export function toast(message, type = '') {
  const el = document.createElement('div');
  el.className = `toast${type ? ' ' + type : ''}`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}
