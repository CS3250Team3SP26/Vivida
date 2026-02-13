/**
 * themeAPI.js
 * @fileoverview Provides functions to interact with the browser's theme management API.
 * @module lib/themeAPI
 */

/**
 * Retrieves the list of installed themes from the browser.
 * @returns {Promise<Array>} A promise that resolves to an array of theme objects.
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

export { getThemes };