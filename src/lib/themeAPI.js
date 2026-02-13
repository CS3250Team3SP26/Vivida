/**
 * themeAPI.js
 * @fileoverview Provides functions to interact with the browser's theme management API.
 * @module lib/themeAPI
 */

/**
 * Retrieves the list of installed themes from the browser.
 * @returns {Promise<Array>} - A promise that resolves to an array of theme objects.
 */
async function getThemes() {
    try {
        const allExtensions = await browser.management.getAll();
        const themes = allExtensions.filter(ext => ext.type === "theme");
        console.log("Retrieved themes:", themes);
        return themes;
    } catch (error) {
        console.error("Error retrieving themes:", error);
        return [];
    }
}

/**
 * Validates whether a given theme ID corresponds to an installed theme.
 * @param {String} themeId - The ID of the theme to validate.
 * @returns {Promise<Boolean>} - A promise that resolves to true if the theme ID is valid, false otherwise.
 */
async function isValidTheme(themeId) {
    if (typeof themeId !== 'string' || themeId.trim() === '') {
        return false; // Invalid theme ID
    }
    try {
        const themeInfo = await browser.management.get(themeId);
        return themeInfo.type === 'theme';
    } catch (error) {
        console.error("Error validating theme ID:", error);
        return false; // Theme ID does not exist or is not a theme
    }
}

/**
 * Enables a theme by its ID.
 * @param {String} themeId - The ID of the theme to enable.
 * @returns {Promise<void>} - A promise that resolves when the theme is enabled.
 * @throws {Error} - If the theme ID is invalid or if there is an error enabling the theme.
 */
async function enableTheme(themeId) {
    // Validate the theme ID before attempting to enable it
    const isValid = await isValidTheme(themeId);
    if (!isValid) {
        throw new Error("Invalid theme ID");
    }
    // Attempt to enable the theme
    try {
        await browser.management.enableTheme(themeId, true);
    } catch (error) {
        console.error("Error enabling theme:", error);
        throw error;
    }
}

export { getThemes, enableTheme, isValidTheme };