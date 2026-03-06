/**
 * @fileoverview Background script for Theme Groups extension
 * Handles message routing and delegates to dedicated modules.
 * @module background/background
 */

import { GroupManager } from "../lib/GroupManager.js";
import {
  getThemes,
  getCurrentTheme,
  enableTheme,
  disableTheme,
  getThemeById,
} from "../lib/themeAPI.js";
const manager = new GroupManager();
// ============================================================================
// BUSINESS LOGIC FUNCTIONS
// ============================================================================

/**
 * Initialize the extension with default data if needed.
 * Runs when the extension is first installed or updated.
 *
 * @returns {Promise<void>}
 */
async function initialize() {
  console.log("[Background] Theme Groups extension initializing...");

  try {
    await manager.initialize(); //fixed typo
  } catch (error) {
    console.error("[Background]Error during intilization: ", error);
  }
}

// ============================================================================
// MESSAGE HANDLERS
// ============================================================================

/**
 * Message handler functions mapped by message type.
 * Each handler receives the message and returns a promise resolving to the response.
 *
 * @type {Object.<string, Function>}
 */
const messageHandlers = {
  // -- Storage handlers --

  /**
   * @param {Object} message
   * @param {string} message.name - The name of the group to create
   * @returns {Promise<{success: boolean, id: string}>} 
   */
  CREATE_GROUP: async (message) => {
    const { id, group } = manager.createGroup(message.name);
    await manager.save();
    return { success: true, id, name: group.name, themes: [] };
  },

  /**
   *
   * @param {Object} _message
   * @returns {Promise<{success: boolean, data: Array<Object>}>} - Response containing success status and serialized theme groups data
   */
  GET_ALL_GROUPS: async (_message) => {
    const groups = manager.getAllGroups();
    const allGroups = groups.map(({ id, group }) => ({
      id,
      name: group.name,
      themes: [...group.themes],
    }));
    return { success: true, data: allGroups };
  },

  /**
   *
   * @param {Object} message
   * @param {string} message.groupId - The ID of the group to save
   * @param {Array<string>} message.themes - Array of theme extension IDs to associate with the group
   * @returns {Promise<{success: boolean, error: string}>} - Response containing success status
   */
  SAVE_GROUP: async (message) => {
    const result = manager.updateGroupThemes(message.groupId, message.themes);
    if (!result) {
      return { success: false, error: "Group not found" };
    }
    await manager.save();
    return { success: true };
  },

  /**
   *
   * @param {Object} message
   * @param {string} message.groupId - The ID of the group to rename
   * @param {string} message.newName - The new name for the group
   * @returns {Promise<Object>} - Response containing success status
   */
  RENAME_GROUP: async (message) => {
    const result = manager.renameGroup(message.groupId, message.newName);
    if (!result) {
      return { success: false, error: "Group not found" };
    }
    await manager.save();
    return { success: true };
  },

  /**
   *
   * @param {Object} message
   * @param {string} message.groupId - The ID of the group to delete
   * @returns {Promise<{success: boolean}>} - Response containing success status
   */
  DELETE_GROUP: async (message) => {
    const result = manager.deleteGroup(message.groupId);
    if (!result) {
      return { success: false, error: "Group not found" };
    }
    await manager.save();
    return { success: true };
  },

  /**
   *
   * @param {Object} message
   * @param {string} message.groupId - The ID of the group to set as active
   * @returns {Promise<{success: boolean}>} - Response containing success status
   */
  SET_ACTIVE_GROUP: async (message) => {
    const result = manager.setActiveGroupId(message.groupId);
    if (!result) return { success: false, error: "Group not found" };
    await manager.save();
    return { success: true };
  },

  /**
   *
   * @param {Object} _message
   * @returns {Promise<{success: boolean, data: string}>} - Response containing success status and active group ID
   */
  GET_ACTIVE_GROUP: async (_message) => {
    const activeGroup = manager.getActiveGroup();
    return { success: true, data: activeGroup ? activeGroup.id : null };
  },

  // -- Theme API handlers --

  /**
   *
   * @param {Object} _message
   * @returns {Promise<{success: boolean, data: Array<Object>}>} - Response containing success status and array of installed themes
   */
  GET_INSTALLED_THEMES: async (_message) => {
    const themes = await getThemes();
    return { success: true, data: themes };
  },

  /**
   *
   * @param {Object} _message
   * @returns {Promise<{success: boolean, data: Object}>} - Response containing success status and current theme information
   */
  GET_CURRENT_THEME: async (_message) => {
    const theme = await getCurrentTheme();
    return { success: true, data: theme };
  },

  /**
   *
   * @param {Object} message
   * @param {string} message.themeId - The ID of the theme to enable
   * @returns {Promise<{success: boolean}>} - Response containing success status
   */
  ENABLE_THEME: async (message) => {
    await enableTheme(message.themeId);
    return { success: true };
  },

  /**
   *
   * @param {Object} message
   * @param {string} message.themeId - The ID of the theme to disable
   * @returns {Promise<{success: boolean}>} - Response containing success status
   */
  DISABLE_THEME: async (message) => {
    await disableTheme(message.themeId);
    return { success: true };
  },

  /**
   *
   * @param {Object} message
   * @param {string} message.themeId - The ID of the theme to get
   * @returns {Promise<{success: boolean, data: Object}>} - Response containing success status and theme information
   */
  GET_THEME_BY_ID: async (message) => {
    const theme = await getThemeById(message.themeId);
    return { success: true, data: theme };
  },
};

/**
 * Main message listener that routes messages to appropriate handlers.
 *
 * @param {Object} message - Message object with a 'type' property
 * @param {Object} sender - Sender information
 * @param {function} sendResponse - Function to send response back to sender
 * @returns {boolean} True to indicate async response
 */
function handleMessage(message, sender, sendResponse) {
  console.log("[Background] Received message:", message);

  const handler = messageHandlers[message.type];

  if (!handler) {
    console.warn("[Background] Unknown message type:", message.type);
    sendResponse({
      success: false,
      error: `Unknown message type: ${message.type}`,
    });
    return false;
  }

  handler(message)
    .then((response) => {
      console.log("[Background] Sending response:", response);
      sendResponse(response);
    })
    .catch((error) => {
      console.error("[Background] Handler error:", error);
      sendResponse({
        success: false,
        error: error.message,
      });
    });

  return true;
}

// ============================================================================
// EVENT LISTENERS & INITIALIZATION
// ============================================================================

/**
 * Listens for extension installation events to set up default theme groups.
 * Creates a default group with common themes and sets it as active.
 *
 * @param {Object} details - Details about the installation event
 */
browser.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    const DEFAULT_THEME_IDS = [
      "default-theme@mozilla.org",
      "firefox-compact-light@mozilla.org",
      "firefox-compact-dark@mozilla.org",
      "firefox-alpenglow@mozilla.org",
    ];
    const defaultGroup = manager.createGroup("Default Group", DEFAULT_THEME_IDS);
    manager.setActiveGroupId(defaultGroup.id);
    await manager.save();
  }
});

browser.runtime.onMessage.addListener(handleMessage);

await initialize();

console.log("[Background] Theme Groups background script loaded successfully!");

export { initialize, handleMessage };
