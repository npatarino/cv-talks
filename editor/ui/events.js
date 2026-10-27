/**
 * Bus de eventos mínimo. Lo usan los módulos hoja (formulario, sidebar…) para
 * avisar al controlador sin importarlo, evitando dependencias circulares.
 *
 * Eventos:
 *  - 'form:changed'           el usuario tocó algo del formulario o las notas
 *  - 'slide:select'  filename   clic en una slide de la sidebar
 *  - 'slide:drop'    filename   slide soltada sobre otra (reordenar)
 *  - 'section:move'  {index, start}  cabecera de sección soltada sobre una slide
 *  - 'slide:menu'    {x, y, filename}  menú contextual de una slide
 */

const handlers = new Map();

export function on(event, fn) {
  if (!handlers.has(event)) handlers.set(event, new Set());
  handlers.get(event).add(fn);
  return () => handlers.get(event).delete(fn);
}

export function emit(event, payload) {
  for (const fn of handlers.get(event) ?? []) fn(payload);
}
