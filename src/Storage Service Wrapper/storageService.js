/**
 * StorageService - A helper that saves and loads theme groups 
   and the active group ID using the browser's storage API.
 */

/**
 * Saves all your theme groups to the browser's storage
 * Like putting all your toys in labeled boxes
 * @param {Array} groups - All the theme groups you want to save
 * @returns {Promise} - A promise that completes when saving is done
 */
async function saveGroups(groups) {
    try {
        // browser.storage.local is like a magic toy box that remembers things
        await browser.storage.local.set({ groups: groups });
        console.log('✅ Groups saved successfully!');
    } catch (error) {
        // If something goes wrong, tell us nicely
        console.error('❌ Oops! Could not save groups:', error);
        throw error; // Pass the error up so others know too
    }
}

/**
 * Gets all your theme groups from storage
 * Like opening the toy box to see what's inside
 * @returns {Promise<Array>} - A promise with your groups (or empty if none exist)
 */
async function loadGroups() {
    try {
        const result = await browser.storage.local.get('groups');
        // If there are no groups saved yet, give back an empty list
        return result.groups || [];
    } catch (error) {
        console.error('❌ Oops! Could not load groups:', error);
        return []; // Return empty list if something breaks
    }
}

/**
 * Saves which group is currently active (selected)
 * Like remembering which toy you were playing with last
 * @param {string} id - The ID of the active group
 * @returns {Promise} - A promise that completes when saving is done
 */
async function saveActiveGroupId(id) {
    try {
        await browser.storage.local.set({ activeGroupId: id });
        console.log('✅ Active group ID saved:', id);
    } catch (error) {
        console.error('❌ Oops! Could not save active group ID:', error);
        throw error;
    }
}

/**
 * Gets which group is currently active
 * Like checking which toy you left out last time
 * @returns {Promise<string|null>} - The active group ID or null if none
 */
async function loadActiveGroupId() {
    try {
        const result = await browser.storage.local.get('activeGroupId');
        return result.activeGroupId || null;
    } catch (error) {
        console.error('❌ Oops! Could not load active group ID:', error);
        return null; // Return null if something breaks
    }
}

// Export so other files can use these helpers
export { saveGroups, loadGroups, saveActiveGroupId, loadActiveGroupId };