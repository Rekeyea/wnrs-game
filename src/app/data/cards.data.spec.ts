import { ALL_CARDS } from './cards.data';
import { GameLevel } from '../enums/game-level.enum';

describe('Cards Data', () => {
  it('should have cards defined', () => {
    expect(ALL_CARDS).toBeDefined();
    expect(Array.isArray(ALL_CARDS)).toBe(true);
    expect(ALL_CARDS.length).toBeGreaterThan(0);
  });

  it('should have exactly 30 cards', () => {
    expect(ALL_CARDS.length).toBe(30);
  });

  it('should have 10 cards per level', () => {
    const level1Cards = ALL_CARDS.filter(card => card.level === GameLevel.PERCEPTION);
    const level2Cards = ALL_CARDS.filter(card => card.level === GameLevel.CONNECTION);
    const level3Cards = ALL_CARDS.filter(card => card.level === GameLevel.REFLECTION);

    expect(level1Cards.length).toBe(10);
    expect(level2Cards.length).toBe(10);
    expect(level3Cards.length).toBe(10);
  });

  it('should have valid card structure', () => {
    ALL_CARDS.forEach(card => {
      expect(card.id).toBeDefined();
      expect(typeof card.id).toBe('string');
      expect(card.question).toBeDefined();
      expect(typeof card.question).toBe('string');
      expect(card.question.length).toBeGreaterThan(0);
      expect(card.level).toBeDefined();
      expect([1, 2, 3]).toContain(card.level);
    });
  });

  it('should have unique card IDs', () => {
    const ids = ALL_CARDS.map(card => card.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ALL_CARDS.length);
  });

  it('should have non-empty questions', () => {
    ALL_CARDS.forEach(card => {
      expect(card.question.trim().length).toBeGreaterThan(5);
    });
  });
});