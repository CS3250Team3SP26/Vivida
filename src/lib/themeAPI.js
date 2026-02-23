/**
 * themeAPI.js
 * @fileoverview Provides functions to interact with the browser's theme management API.
 * @module lib/themeAPI
 */

/**
 * Retrieves the list of installed themes from the browser.
 * @returns {Promise<Array>} - A promise that resolves to an array of ExtensionInfo objects.
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
 * Retrieves the currently active theme from the browser.
 * @returns {Promise<ExtensionInfo|null>} A promise that resolves to the active theme's ExtensionInfo object, or null if no theme is active.
 */
async function getCurrentTheme() {
    const allThemes = await getThemes();
    const currentTheme = allThemes.find(ext => ext.enabled);
    console.log("Current active theme:", currentTheme);
    return currentTheme || null;  // Returns single theme or null
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
        await browser.management.setEnabled(themeId, true);
        console.log(`Theme with ID ${themeId} has been enabled.`);
    } catch (error) {
        console.error("Error enabling theme:", error);
        throw error;
    }
}

/**
 * Disables a theme by its ID.
 * @param {String} themeId - The ID of the theme to disable.
 * @return {Promise<void>} - A promise that resolves when the theme is disabled.
 * @throws {Error} - If the theme ID is invalid or if there is an error disabling the theme.
 */
async function disableTheme(themeId) {
    // Validate the theme ID before attempting to disable it
    const isValid = await isValidTheme(themeId);
    if (!isValid) {
        throw new Error("Invalid theme ID");
    }
    // Attempt to disable the theme
    try {
        await browser.management.setEnabled(themeId, false);
        console.log(`Theme with ID ${themeId} has been disabled.`);
    } catch (error) {
        console.error("Error disabling theme:", error);
        throw error;
    }
}

/**
 * Checks if a theme is currently enabled by its ID.
 * Does not rely on the isValidTheme function to ensure that the theme ID is valid before checking if it's enabled.
 * Instead preforms the check directly and handles any errors that may arise from an invalid theme ID.
 * @param {String} themeId - The ID of the theme to check.
 * @returns {Promise<Boolean>} - A promise that resolves to true if the theme is enabled, false otherwise.
 */
async function isThemeEnabled(themeId) {
    if (typeof themeId !== 'string' || themeId.trim() === '') {
        return false; // Invalid theme ID
    }
    try {
        const themeInfo = await browser.management.get(themeId);
        return themeInfo.type === 'theme' && themeInfo.enabled;
    } catch (error) {
        console.error("Error checking if theme is enabled:", error);
        return false; // Theme ID does not exist or is not a theme
    }
}

/**
 * Retrieves theme information by its ID.
 * @param {string} themeId - The ID of the theme to retrieve.
 * @returns {Promise<ExtensionInfo>} A promise that resolves to the theme's ExtensionInfo object.
 * @throws {Error} If the theme ID is invalid or does not correspond to a theme.
 */
async function getThemeById(themeId) {
    if (typeof themeId !== 'string' || themeId.trim() === '') {
        throw new Error("Invalid theme ID");
    }
    try {
        const themeInfo = await browser.management.get(themeId);
        if (themeInfo.type !== 'theme') {
            throw new Error("ID does not correspond to a theme");
        }
        console.log("Retrieved theme info:", themeInfo);
        return themeInfo;
    } catch (error) {
        console.error("Error checking theme info", error);
        throw error;
    }
}

export { getThemes, getCurrentTheme, enableTheme, disableTheme, isValidTheme, isThemeEnabled, getThemeById };