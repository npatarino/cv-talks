/**
 * Acceso a git para el editor: ficheros modificados y revertir una slide.
 * Todo con spawnSync (el editor es una herramienta local de un solo usuario).
 */

import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { TALKS_ROOT } from '../../config.mjs';

function git(args, cwd) {
  return spawnSync('git', args, { cwd, encoding: 'utf8', timeout: 15_000 });
}

const lines = (out) => (out || '').trim().split('\n').filter(Boolean);

/**
 * Ficheros con cambios sin commitear (modificados + sin trackear), con rutas
 * relativas a la raíz del repo. Devuelve [] si git no está disponible.
 */
export function modifiedFiles(cwd = TALKS_ROOT) {
  try {
    const modified = git(['diff', '--name-only', 'HEAD'], cwd);
    const untracked = git(['ls-files', '--others', '--exclude-standard'], cwd);
    return [...lines(modified.stdout), ...lines(untracked.stdout)];
  } catch {
    return [];
  }
}

/**
 * Descarta los cambios locales de un fichero (git checkout HEAD -- file).
 * Se ejecuta desde el directorio del propio fichero, así git localiza su repo.
 * @param {string} absPath
 * @throws {Error} con el stderr de git si falla
 */
export function revertFile(absPath) {
  const result = git(['checkout', 'HEAD', '--', path.basename(absPath)], path.dirname(absPath));
  if (result.status !== 0) {
    throw new Error(result.stderr || 'git checkout failed');
  }
}
