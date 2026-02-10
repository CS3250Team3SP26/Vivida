/**
 * @fileoverview Unit tests for themeGroups module
 */
const { ThemeGroup } = require('../../src/lib/themeGroups');

describe('ThemeGroup Class', () => {
  let group;                

    beforeEach(() => {
        group = new ThemeGroup('Test Group');
    });

    /* ============================================
   * CONSTRUCTOR TESTS
   * ============================================ */
    test('should create a ThemeGroup instance', () => {
        expect(group).toBeInstanceOf(ThemeGroup);
        expect(group.name).toBe('Test Group');
        expect(group.themes).toEqual([]);
    });

    test('should initialize with themes', () => {
        const themes = ['Theme1', 'Theme2'];
        const themedGroup = new ThemeGroup('Test Group', themes);
        expect(themedGroup.themes).toEqual(themes);
    });

    test('should throw error for invalid name (null)', () => {
        expect(() => new ThemeGroup(null)).toThrow(TypeError);
        expect(() => new ThemeGroup(null)).toThrow('Name must be a non-empty string');
    });

    test('should throw error for invalid name (empty string)', () => {
        expect(() => new ThemeGroup('')).toThrow(TypeError);
        expect(() => new ThemeGroup('  ')).toThrow(TypeError);
    });

    test('should throw error for invalid name (not a string)', () => {
        expect(() => new ThemeGroup(123)).toThrow(TypeError);
        expect(() => new ThemeGroup({})).toThrow(TypeError);
    });

    test('should throw error for invalid themes parameter (not an array)', () => {
        expect(() => new ThemeGroup('Test', 'not-an-array')).toThrow(TypeError);
        expect(() => new ThemeGroup('Test', 'not-an-array')).toThrow('Themes must be an array');
    });

    /* ============================================
    * ADD THEM TESTS
    * ============================================ */
    test('should add a theme to the group', () => {
        group.addTheme('Dark Theme');
        expect(group.themes).toContain('Dark Theme');
    });

    test('should add multiple themes to the group', () => {
        group.addTheme('Dark Theme');
        group.addTheme('Light Theme');
        expect(group.themes).toEqual(['Dark Theme', 'Light Theme']);
    });

    test('should throw error when adding invalid theme (null)', () => {
        expect(() => group.addTheme(null)).toThrow(TypeError);
        expect(() => group.addTheme(null)).toThrow('Theme must be a non-empty string');
    });

    test('should throw error when adding invalid theme (empty string)', () => {
        expect(() => group.addTheme('')).toThrow(TypeError);
        expect(() => group.addTheme('  ')).toThrow(TypeError);
    });

    test('should throw error when adding invalid theme (not a string)', () => {
        expect(() => group.addTheme(123)).toThrow(TypeError);
        expect(() => group.addTheme({})).toThrow(TypeError);
    });

    /* ============================================
    * REMOVE THEME TESTS
    * ============================================ */
    test('should remove a theme from the group', () => {
        group.addTheme('Light Theme');
        group.removeTheme('Light Theme');
        expect(group.themes).not.toContain('Light Theme');
    });

    test('should throw error when removing invalid theme (null)', () => {
        expect(() => group.removeTheme(null)).toThrow(TypeError);
        expect(() => group.removeTheme(null)).toThrow('Theme must be a non-empty string');
    });

    test('should throw error when removing invalid theme (empty string)', () => {
        expect(() => group.removeTheme('')).toThrow(TypeError);
        expect(() => group.removeTheme('  ')).toThrow(TypeError);
    });

    test('should throw error when removing invalid theme (not a string)', () => {
        expect(() => group.removeTheme(123)).toThrow(TypeError);
        expect(() => group.removeTheme({})).toThrow(TypeError);
    });
});