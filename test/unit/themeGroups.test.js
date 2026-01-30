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

    /* ============================================
    * REMOVE THEME TESTS
    * ============================================ */
    test('should remove a theme from the group', () => {
        group.addTheme('Light Theme');
        group.removeTheme('Light Theme');
        expect(group.themes).not.toContain('Light Theme');
    });
});