/**
 * @fileoverview Theme groups data structure and related functions
 * 
 * This module defines the structure for managing theme groups,
 * including creation, retrieval, and manipulation of theme groups.
 * @module lib/themeGroups
 */

/**
 * A ThemeGroup represents a collection of themes
 * and their assciated name
 * 
 * @class
 */
class ThemeGroup {
    /**
     *
     * @param {string} name - display name for the group
     * @param {Array<string>} themes - list of themes in the group
     * @throws {TypeError} If name is not a string or themes is not an array
     */
    constructor(name, themes = []) {
        if (typeof name !== 'string' || name.trim() === '') {
            throw new TypeError('Name must be a non-empty string');
        }
        if (!Array.isArray(themes)) {
            throw new TypeError('Themes must be an array');
        }
        this.name = name;
        this.themes = themes;
    }// constructor

    /**
     * Adds a theme to the group
     * @param {string} theme - The theme to add
     * @throws {TypeError} If theme is not a valid string
     */
    addTheme(theme) {
        if (typeof theme !== 'string' || theme.trim() === '') {
            throw new TypeError('Theme must be a non-empty string');
        }
        this.themes.push(theme);
    }// addTheme

    /**
     * Removes a theme from the group
     * @param {string} theme - The theme to remove
     * @throws {TypeError} If theme is not a valid string
     */
    removeTheme(theme) {
        if (typeof theme !== 'string' || theme.trim() === '') {
            throw new TypeError('Theme must be a non-empty string');
        }
        this.themes = this.themes.filter(t => t !== theme);
    }// removeTheme
}// ThemeGroup

// Export for use in other modules
module.exports = { ThemeGroup };
