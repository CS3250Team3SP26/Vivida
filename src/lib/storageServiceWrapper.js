/**
 * @fileoverview Storage service wrapper for theme group management
 * Stores and retrieves serialized theme group objects from browser.storage.local
 * @module lib/storageServiceWrapper
 */

/**
 * Saves the provided theme groups to browser storage
 * @param {Array<Object>} groups - Array of serialized theme group objects
 * @param {string} groups[].id - Unique group identifier
 * @param {string} groups[].name - Group display name
 * @param {Array<string>} groups[].themeIds - Array of theme extension IDs
 * @returns {Promise<void>} Resolves when groups are saved successfully
 * @throws {TypeError} If the input is not an array
 * @throws {Error} If there is an error during the save operation
 */
async function saveGroups(groups) {
  if (!Array.isArray(groups)) {
    throw new TypeError("Invalid input: groups should be an array");
  }
  try {
    await browser.storage.local.set({ groups: groups });
    console.log("Groups saved successfully");
  } catch (error) {
    console.error("Could not save groups:", error);
    throw error;
  }
}

/**
 * Loads saved theme groups from browser storage
 * Returns plain objects, not ThemeGroup instances
 * @returns {Promise<Array<Object>>} Array of serialized theme group objects (empty if none exist)
 * @throws {Error} If there is an error during the load operation
 */
async function loadGroups() {
  try {
    const result = await browser.storage.local.get("groups");
    return result.groups || [];
  } catch (error) {
    console.error("Could not load groups:", error);
    throw error;
  }
}

/**
 * Saves a single theme group by name, updating if it already exists
 * @param {string} Id - The name of the group to save
 * @param {Array<string>} themeIds - Array of theme extension IDs to associate with the group
 */
async function saveGroup(Id, themeIds) {
  if (typeof Id !== "string" || !Array.isArray(themeIds)) {
    throw new TypeError(
      "Invalid input: Id should be a string and themeIds should be an array",
    );
  }
  try {
    const existingGroups = await loadGroups();
    const groupIndex = existingGroups.findIndex((group) => group.id === Id);
    // If group with the same name exists, update it; otherwise, add a new group
    if (groupIndex === -1) {
      existingGroups.push({
        id: Id,
        themeIds: themeIds,
      });
    } else {
      existingGroups[groupIndex] = {
        ...existingGroups[groupIndex],
        id: Id,
        themeIds: themeIds,
      };
    }
    await saveGroups(existingGroups);
  } catch (error) {
    console.error("Could not save group:", error);
    throw error;
  }
}

async function deleteGroup(Id) {
  if (typeof Id !== "string") {
    throw new TypeError("Invalid input: Id should be a string");
  }
  // To delete a group, we load all groups, filter out the one to delete, and save the updated list
  try {
    const existingGroups = await loadGroups();
    const updatedGroups = existingGroups.filter((group) => group.id !== Id);
    await saveGroups(updatedGroups);
  } catch (error) {
    console.error("Could not delete group:", error);
    throw error;
  }
}

/**
 * Saves which group is currently active (selected)
 * @param {string} id - The ID of the active group to save
 * @returns {Promise<void>} Resolves when the active group ID is saved successfully
 * @throws {TypeError} If the input is not a string
 * @throws {Error} If there is an error during the save operation
 */
async function saveActiveGroupId(id) {
  if (typeof id !== "string") {
    throw new TypeError("Invalid input: active group ID should be a string");
  }
  try {
    await browser.storage.local.set({ activeGroupId: id });
    console.log("Active group ID saved:", id);
  } catch (error) {
    console.error("Could not save active group ID:", error);
    throw error;
  }
}

/**
 * Gets which group is currently active
 * @returns {Promise<string|null>} The active group ID, or null if not set
 * @throws {Error} If there is an error during the load operation
 */
async function loadActiveGroupId() {
  try {
    const result = await browser.storage.local.get("activeGroupId");
    return result.activeGroupId || null;
  } catch (error) {
    console.error("Could not load active group ID:", error);
    throw error;
  }
}

export {
  saveGroups,
  loadGroups,
  saveActiveGroupId,
  loadActiveGroupId,
  saveGroup,
  deleteGroup,
};
