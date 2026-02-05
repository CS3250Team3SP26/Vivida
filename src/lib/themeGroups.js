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
     */
    constructor(name, themes = []) {
        this.name = name;
        this.themes = themes;
    }// constructor

    /**
     * Adds a theme to the group
     * @param {string} theme - The theme to add
     */
    addTheme(theme) {
        this.themes.push(theme);
    }// addTheme

    /**
     * Removes a theme from the group
     * @param {string} theme - The theme to remove
     */
    removeTheme(theme) {
        this.themes = this.themes.filter(t => t !== theme);
    }// removeTheme
}// ThemeGroup

// Export for use in other modules
module.exports = { ThemeGroup };
