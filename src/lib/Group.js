/**
 * @fileoverview Theme groups data structure and related functions
 * 
 * This module defines the structure for managing theme groups,
 * including creation, retrieval, and manipulation of theme groups.
 * @module lib/Groups
 */

/**
 * A ThemeGroup represents a collection of themes
 * and their assciated name
 * 
 * @class
 */
class Group {
    /**
     * create new theme group instanxe
     * @param {string} name - display name for the group
     * @param {Array<string>} themes - list of themes in the group
     * @throws {TypeError} - if the name is not a string or themes are not an array
     * 
     */
    constructor(name, themes = []) {
        if (typeof name !== 'string' || name.trim() === '') {
            throw new TypeError('Name must be a non-empty string');
        }
        if (!Array.isArray(themes)) {
            throw new TypeError('Themes must be an array');
        }
        this.name = name;
        this.themes = [...themes];
    }// constructor

    /**
     * Adds a theme to the group
     * @param {string} theme - The theme to add
     * @returns {boolean} - true if theme is added, false if theme already exists
     * @throws {TypeError} - if the theme is not a string
     * 
     */
    addTheme(theme) {
        if (typeof theme !== 'string') {
            throw new TypeError('Theme must be a string');
        }

        //validates that the string is not epmty or whitespaced
        if (theme.trim() === '') {
            throw new TypeError('Theme must be a non-empty string');
        }

        if (this.hasTheme(theme)) {
            return false; // Theme already exists
        }

        this.themes.push(theme);
        return true; // Theme has been added successfully

    }// addTheme

    /**
     * Removes a theme from the group
     * @param {string} theme - The theme to remove
     * @returns {boolean} - True if theme has been removes, false if theme is not found
     * @throws {TypeError} - if the theme is not a string
     */
    removeTheme(theme) {
        if (typeof theme !== 'string') {
            throw new TypeError('Theme must be a string');
        }

        if (this.hasTheme(theme) === false) {
            return false; // Theme not found
        }

        this.themes = this.themes.filter(t => t !== theme);
        return true; // Theme has been removed successfully
    }// removeTheme

    /**
     * Returns the number of themes in the group
     * @returns {number} - count of themes
     */
    themeCount() {
        return this.themes.length;
    }

    /**
     * checks if a theme exists in the group
     * @param {string} theme - The theme to check for
     * @returns {boolean} - true if theme exists, otherwise it falsw
     * @throws {TypeError} - if the theme is not a string
     */
    hasTheme(theme) {
        if (typeof theme !== 'string') {
            throw new TypeError('Theme must be a string');
        }
        
        return this.themes.includes(theme);
    }

 
}// Group

export { Group };
