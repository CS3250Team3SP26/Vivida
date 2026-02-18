/**
 * StorageService - A helper that saves and loads theme groups 
   and the active group ID using the browser's storage API.
 */

/**
 * Saves the provided theme groups to browser storage.
 * @param {Array<ThemeGroup>} groups - An array of theme groups to save.
 * @returns {Promise} - Resolves when groups are saved successfully, rejects on error
 * @throws {TypeError} - If the input is not an array of theme groups.
 * @throws {Error} - If there is an error during the save operation.
 */
async function saveGroups(groups) {
    if (!Array.isArray(groups)) {
        throw new TypeError('Invalid input: groups should be an array');
    }
    try {
        await browser.storage.local.set({ groups: groups });
        console.log('Groups saved successfully!');
    } catch (error) {
        console.error('Could not save groups:', error);
        throw error;
    }
}

/**
 * Loads the saved theme groups from browser storage.
 * @returns {Promise<Array>} - A promise that resolves to an array of theme groups, rejects on error.
 * @throws {Error} - If there is an error during the load operation.
 */
async function loadGroups() {
    try {
        const result = await browser.storage.local.get('groups');
        return result.groups || [];
    } catch (error) {
        console.error('Could not load groups:', error);
        return error;
    }
}

/**
 * Saves which group is currently active (selected)
 * @param {string}  - The ID of the active group to save.
 * @returns {Promise} - Resolves when the active group ID is saved successfully, rejects on error.
 * @throws {TypeError} - If the input is not a string.
 * @throws {Error} - If there is an error during the save operation.
 */
async function saveActiveGroupId(id) {
    if (typeof id !== 'string') {
        throw new TypeError('Invalid input: active group ID should be a string');
    }
    try {
        await browser.storage.local.set({ activeGroupId: id });
        console.log('Active group ID saved:', id);
    } catch (error) {
        console.error('Could not save active group ID:', error);
        throw error;
    }
}

/**
 * Gets which group is currently active
 * @returns {Promise<string|null>} - A promise that resolves to the active group ID, or null if not set, rejects on error.
 * @throws {Error} - If there is an error during the load operation.
 */
async function loadActiveGroupId() {
    try {
        const result = await browser.storage.local.get('activeGroupId');
        return result.activeGroupId || null;
    } catch (error) {
        console.error('Could not load active group ID:', error);
        throw error;
    }
}

export { saveGroups, loadGroups, saveActiveGroupId, loadActiveGroupId };