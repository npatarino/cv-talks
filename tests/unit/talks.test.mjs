import { describe, it, expect } from 'vitest';
import { groupTalks, monthOf } from '../../theme/lib/talks.mjs';

describe('monthOf', () => {
  it('recorta la fecha a año-mes', () => {
    expect(monthOf('2025-09-18')).toBe('2025-09');
    expect(monthOf('2026-05')).toBe('2026-05');
    expect(monthOf('')).toBe('');
    expect(monthOf(undefined)).toBe('');
  });
});

describe('groupTalks', () => {
  const decks = [
    { slug: 'mito', talk: 'mito', title: 'El mito', subtitle: 'Sub', date: '2026-05', edition: 'Commit 2026' },
    { slug: 'ego', title: 'Ego', date: '2025-09-18' },
    { slug: 'mito-freson', talk: 'mito', title: 'El mito', subtitle: 'Sub', date: '2026-06', edition: 'FresOn 2026' },
    { slug: 'consciente', title: 'Consciente', date: '2024-09' },
  ];

  it('una entrada por charla, fechada por la edición más reciente', () => {
    const talks = groupTalks(decks);
    expect(talks.map((t) => t.key)).toEqual(['mito', 'ego', 'consciente']);
    const mito = talks[0];
    expect(mito.month).toBe('2026-06');
    expect(mito.latest.slug).toBe('mito-freson');
    expect(mito.editions.map((e) => e.slug)).toEqual(['mito-freson', 'mito']);
  });

  it('un deck sin talk es una charla de una sola edición', () => {
    const ego = groupTalks(decks).find((t) => t.key === 'ego');
    expect(ego.editions).toHaveLength(1);
    expect(ego.month).toBe('2025-09');
    expect(ego.title).toBe('Ego');
  });

  it('cada edición lleva su propio mes', () => {
    const mito = groupTalks(decks)[0];
    expect(mito.editions.map((e) => e.month)).toEqual(['2026-06', '2026-05']);
  });
});
