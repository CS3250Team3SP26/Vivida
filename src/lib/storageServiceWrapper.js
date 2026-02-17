/**
 * StorageService - A helper that saves and loads theme groups 
   and the active group ID using the browser's storage API.
 */

/**
 * @param {Array} groups
 * @returns {Promise}
 */
async function saveGroups(groups) {
    try {
        await browser.storage.local.set({ groups: groups });
        console.log('Groups saved successfully!');
    } catch (error) {
        console.error('Oops! Could not save groups:', error);
        throw error;
    }
}

/**
 * @returns {Promise<Array>}
 */
async function loadGroups() {
    try {
        const result = await browser.storage.local.get('groups');
        return result.groups || [];
    } catch (error) {
        console.error('Oops! Could not load groups:', error);
        return [];
    }
}

/**
 * Saves which group is currently active (selected)
 * @param {string} id
 * @returns {Promise}
 */
async function saveActiveGroupId(id) {
    try {
        await browser.storage.local.set({ activeGroupId: id });
        console.log('Active group ID saved:', id);
    } catch (error) {
        console.error('Oops! Could not save active group ID:', error);
        throw error;
    }
}

/**
 * Gets which group is currently active
 * @returns {Promise<string|null>}
 */
async function loadActiveGroupId() {
    try {
        const result = await browser.storage.local.get('activeGroupId');
        return result.activeGroupId || null;
    } catch (error) {
        console.error('Oops! Could not load active group ID:', error);
        return null;
    }
}

export { saveGroups, loadGroups, saveActiveGroupId, loadActiveGroupId };