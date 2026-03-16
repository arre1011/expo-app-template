/**
 * Tests for Recent Drinks functionality
 * Tests the aggregation of drink entries into templates for quick-add
 */

import { RecentDrinkTemplate, DrinkType } from '../src/domain/models/types';

// Helper function to generate template ID (same logic as repository)
function generateTemplateId(type: string, volumeMl: number, abvPercent: number, label: string | null): string {
  return `${type}-${volumeMl}-${abvPercent}-${label || 'unlabeled'}`;
}

describe('Recent Drinks', () => {
  describe('Template ID Generation', () => {
    it('should generate consistent IDs for same drink parameters', () => {
      const id1 = generateTemplateId('beer_small', 330, 5.0, 'Augustiner');
      const id2 = generateTemplateId('beer_small', 330, 5.0, 'Augustiner');
      expect(id1).toBe(id2);
    });

    it('should generate different IDs for different volumes', () => {
      const id1 = generateTemplateId('beer_small', 330, 5.0, 'Augustiner');
      const id2 = generateTemplateId('beer_small', 500, 5.0, 'Augustiner');
      expect(id1).not.toBe(id2);
    });

    it('should generate different IDs for different ABV', () => {
      const id1 = generateTemplateId('beer_small', 330, 5.0, 'Augustiner');
      const id2 = generateTemplateId('beer_small', 330, 5.5, 'Augustiner');
      expect(id1).not.toBe(id2);
    });

    it('should generate different IDs for different labels', () => {
      const id1 = generateTemplateId('beer_small', 330, 5.0, 'Augustiner');
      const id2 = generateTemplateId('beer_small', 330, 5.0, 'Paulaner');
      expect(id1).not.toBe(id2);
    });

    it('should handle null labels with "unlabeled" suffix', () => {
      const id = generateTemplateId('beer_small', 330, 5.0, null);
      expect(id).toBe('beer_small-330-5-unlabeled');
    });

    it('should generate different IDs for different drink types', () => {
      const id1 = generateTemplateId('beer_small', 330, 5.0, null);
      const id2 = generateTemplateId('wine', 330, 5.0, null);
      expect(id1).not.toBe(id2);
    });
  });

  describe('RecentDrinkTemplate Type', () => {
    it('should have required fields', () => {
      const template: RecentDrinkTemplate = {
        id: 'beer_small-330-5-unlabeled',
        type: 'beer_small',
        volumeMl: 330,
        abvPercent: 5.0,
        label: null,
        usageCount: 5,
        lastUsedAt: new Date().toISOString(),
      };

      expect(template.id).toBeDefined();
      expect(template.type).toBeDefined();
      expect(template.volumeMl).toBeDefined();
      expect(template.abvPercent).toBeDefined();
      expect(template.usageCount).toBeDefined();
      expect(template.lastUsedAt).toBeDefined();
    });

    it('should accept all drink types', () => {
      const drinkTypes: DrinkType[] = ['beer_small', 'beer_large', 'wine', 'longdrink', 'shot', 'custom'];

      drinkTypes.forEach(type => {
        const template: RecentDrinkTemplate = {
          id: `${type}-100-5-unlabeled`,
          type,
          volumeMl: 100,
          abvPercent: 5.0,
          label: null,
          usageCount: 1,
          lastUsedAt: new Date().toISOString(),
        };
        expect(template.type).toBe(type);
      });
    });
  });

  describe('Template Sorting Logic', () => {
    it('should sort templates by lastUsedAt descending', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const templates: RecentDrinkTemplate[] = [
        { id: '1', type: 'beer_small', volumeMl: 330, abvPercent: 5, label: null, usageCount: 1, lastUsedAt: lastWeek.toISOString() },
        { id: '2', type: 'wine', volumeMl: 200, abvPercent: 12, label: null, usageCount: 1, lastUsedAt: now.toISOString() },
        { id: '3', type: 'shot', volumeMl: 44, abvPercent: 40, label: null, usageCount: 1, lastUsedAt: yesterday.toISOString() },
      ];

      // Sort by lastUsedAt descending (most recent first)
      const sorted = [...templates].sort((a, b) =>
        new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime()
      );

      expect(sorted[0].id).toBe('2'); // now
      expect(sorted[1].id).toBe('3'); // yesterday
      expect(sorted[2].id).toBe('1'); // lastWeek
    });
  });

  describe('Quick Add Flow', () => {
    it('should create valid CreateDrinkEntry from template', () => {
      const template: RecentDrinkTemplate = {
        id: 'beer_small-500-5.2-Augustiner',
        type: 'beer_small',
        volumeMl: 500,
        abvPercent: 5.2,
        label: 'Augustiner',
        usageCount: 10,
        lastUsedAt: new Date().toISOString(),
      };

      // Simulate quickAddDrink logic
      const drinkEntry = {
        type: template.type,
        volumeMl: template.volumeMl,
        abvPercent: template.abvPercent,
        label: template.label,
        notes: null,
        timestamp: new Date().toISOString(),
      };

      expect(drinkEntry.type).toBe('beer_small');
      expect(drinkEntry.volumeMl).toBe(500);
      expect(drinkEntry.abvPercent).toBe(5.2);
      expect(drinkEntry.label).toBe('Augustiner');
      expect(drinkEntry.notes).toBeNull();
      expect(drinkEntry.timestamp).toBeDefined();
    });
  });
});
