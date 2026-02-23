/**
 * @fileoverview Unit tests for themeGroups module
 */
import { ThemeGroup } from'../../src/lib/themeGroups.js';

describe('ThemeGroup Class', () => {
  let group;                

    beforeEach(() => {
        group = new ThemeGroup('Test Group');
    });

    /* ============================================
   * CONSTRUCTOR TESTS
   * ============================================ */
    describe('constructor', () => {
        test('should create a ThemeGroup instance with valid parameters', () => {
            const newGroup = new ThemeGroup('My Group', ['Theme1', 'Theme2']);
            expect(newGroup.name).toBe('My Group');
            expect(newGroup.themes).toEqual(['Theme1', 'Theme2']);
            expect(newGroup.id).toMatch(/^group-\d+-\d+$/); // ID should match the generated format
        });

        test('should throw TypeError if name is not a non-empty string', () => {
            expect(() => new ThemeGroup(123, [])).toThrow(TypeError);
            expect(() => new ThemeGroup('', [])).toThrow(TypeError);
            expect(() => new ThemeGroup('   ', [])).toThrow(TypeError);
        });

        test('should throw TypeError if themes is not an array', () => {
            expect(() => new ThemeGroup('My Group', 'Not an array')).toThrow(TypeError);
            expect(() => new ThemeGroup('My Group', 123)).toThrow(TypeError);
            expect(() => new ThemeGroup('My Group', null)).toThrow(TypeError);
        });
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

    test('should add a theme and return a True', () => {
        const result = group.addTheme('Dark Theme');
        expect(result).toBe(true);
        expect(group.themes).toContain('Dark Theme');
        expect(group.themeCount()).toBe(1);
    });

    test('should not add duplicate themes and shoudl return a False', () => {
        group.addTheme('Dark Theme');
        const result = group.addTheme('Dark Theme');
        expect(result).toBe(false);
        expect(group.themes).toEqual(['Dark Theme']);
        expect(group.themeCount()).toBe(1);
    });

     test('should outputTypeError if theme is not a string when adding', () => {
        expect(() => group.addTheme(123)).toThrow(TypeError);
        expect(() => group.addTheme(null)).toThrow(TypeError);
        expect(() => group.addTheme(undefined)).toThrow(TypeError);
    });

    test('should not allow adding an empty string', () => {
        expect(() => group.addTheme('')).toThrow(TypeError);
        expect(() => group.addTheme('   ')).toThrow(TypeError);
        expect(() => group.addTheme('\t')).toThrow(TypeError);
    });

    /* ============================================
    * REMOVE THEME TESTS
    * ============================================ */
    test('should remove a theme from the group', () => {
        group.addTheme('Light Theme');
        group.removeTheme('Light Theme');
        expect(group.themes).not.toContain('Light Theme');
    });

    test('should remove a theme and return True', () => {
        group.addTheme('Light Theme');
        const result = group.removeTheme('Light Theme');
        expect(result).toBe(true);
        expect(group.themes).not.toContain('Light Theme');
        expect(group.themeCount()).toBe(0);
    })

    test('should return False when trying to remove a non existing theme', () => {
        const result = group.removeTheme('Non Existing Theme');
        expect(result).toBe(false);
        expect(group.themeCount()).toBe(0);
    });

    test('should only remove one instance of.a theme', () => {
        group.addTheme('Dark Theme');
        group.addTheme('Light Theme');
        group.addTheme('big beautiful red porsche theme');

        const result = group.removeTheme('Light Theme');
        expect(result).toBe(true);
        expect(group.themes).toEqual(['Dark Theme', 'big beautiful red porsche theme']);
        expect(group.themeCount()).toBe(2);
    });

    test('should throw TypeError if theme is not a string when removing', () => {
        expect(() => group.removeTheme(123)).toThrow(TypeError);
        expect(() => group.removeTheme(null)).toThrow(TypeError);
        expect(() => group.removeTheme({})).toThrow(TypeError);
    });

    /* ============================================
    * THEME COUNT TESTs
    * ============================================ */

    describe('themeCount', () => {
        test('should return 0 if no themes are in the group', () => {
            expect(group.themeCount()).toBe(0);
        });

        test('should return the correct number after adding thmes', () => {
            group.addTheme('Dark Theme');
            expect(group.themeCount()).toBe(1);

            group.addTheme('Light Theme');
            expect(group.themeCount()).toBe(2);

            group.addTheme('Big BEatiful Red Porsche Theme');
            expect(group.themeCount()).toBe(3);
        });
        
        test('should return the correct number after removing themes', () => {
            group.addTheme('Dark Theme');
            group.addTheme('Light Theme');
            group.addTheme('Big Beautiful Red Porsche Theme');

            group.removeTheme('Dark Theme');
            expect(group.themeCount()).toBe(2);

            group.removeTheme('Light Theme');
            expect(group.themeCount()).toBe(1);
        });

        /*============================================
        * Redundant? 
        * ============================================*/   

        test('should return 0 aftet removing everything ', () => {
            group.addTheme('Dark Theme');
            group.addTheme('Light Theme');

            group.removeTheme('Dark Theme');
            group.removeTheme('Light Theme');
            expect(group.themeCount()).toBe(0);
        });



    });

    /* ============================================
    * HAS THEME TRESTS
    * ============================================ */

    describe('hasTheme', () => {
        test('should return true if the theme exists', () => {
            group.addTheme('Dark Theme');
            expect(group.hasTheme('Dark Theme')).toBe(true);
        });

        test('should return false when theme does not exist', () => {
            expect(group.hasTheme('Non Existing Theme')).toBe(false);
        });

        test('should be case sensitive', () => {
            group.addTheme('Dark Theme');
            expect(group.hasTheme('dark theme')).toBe(false);
            expect(group.hasTheme('DARK THEM')).toBe(false);
        });

        test('should throw TypeError if theme is not a string when checking', () => {
            expect(() => group.hasTheme(123)).toThrow(TypeError);
            expect(() => group.hasTheme(null)).toThrow(TypeError);
            expect(() => group.hasTheme(undefined)).toThrow(TypeError);
        });

    })



});