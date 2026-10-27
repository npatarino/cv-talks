import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { modifiedFiles, revertFile } from '../../editor/api/store/git.mjs';

let repo;
const git = (...args) => spawnSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', ...args], { cwd: repo, encoding: 'utf8' });

beforeEach(() => {
  repo = fs.mkdtempSync(path.join(os.tmpdir(), 'git-store-'));
  git('init', '-q');
  fs.mkdirSync(path.join(repo, 'decks', 'd'), { recursive: true });
  fs.writeFileSync(path.join(repo, 'decks', 'd', 'a.md'), 'original\n');
  git('add', '.');
  git('commit', '-q', '-m', 'init');
});
afterEach(() => { fs.rmSync(repo, { recursive: true, force: true }); });

describe('modifiedFiles', () => {
  it('lista modificados y sin trackear, relativos a la raíz del repo', () => {
    expect(modifiedFiles(repo)).toEqual([]);
    fs.writeFileSync(path.join(repo, 'decks', 'd', 'a.md'), 'changed\n');
    fs.writeFileSync(path.join(repo, 'decks', 'd', 'new.md'), 'new\n');
    expect(modifiedFiles(repo).sort()).toEqual(['decks/d/a.md', 'decks/d/new.md']);
  });

  it('devuelve [] fuera de un repo', () => {
    const plain = fs.mkdtempSync(path.join(os.tmpdir(), 'no-git-'));
    try { expect(modifiedFiles(plain)).toEqual([]); }
    finally { fs.rmSync(plain, { recursive: true, force: true }); }
  });
});

describe('revertFile', () => {
  it('restaura el fichero al contenido de HEAD', () => {
    const f = path.join(repo, 'decks', 'd', 'a.md');
    fs.writeFileSync(f, 'changed\n');
    revertFile(f);
    expect(fs.readFileSync(f, 'utf8')).toBe('original\n');
  });

  it('lanza con el error de git si el fichero no está en HEAD', () => {
    expect(() => revertFile(path.join(repo, 'decks', 'd', 'nope.md'))).toThrow();
  });
});
