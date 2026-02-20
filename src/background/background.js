/**
 * @fileoverview Background script for Theme Groups extension
 * Handles message routing and delegates to dedicated modules.
 * @module background/background
 */

import { loadGroups, saveGroups, saveGroup, deleteGroup, loadActiveGroupId, saveActiveGroupId } from '../lib/storageServiceWrapper.js';
import { getThemes, getCurrentTheme, enableTheme, disableTheme, getThemeById } from '../lib/themeAPI.js';

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
    console.log('[Background] Theme Groups extension initializing...');

    try {
        const existingGroups = await loadGroups();

        // loadGroups returns an array — empty array means no groups saved yet
        if (!existingGroups || existingGroups.length === 0) {
            console.log('[Background] No existing groups found, initializing empty storage...');
            await saveGroups([]);
            console.log('[Background] Storage initialized');
        } else {
            console.log('[Background] Found existing groups:', existingGroups);
        }
    } catch (error) {
        console.error('[Background] Error during initialization:', error);
    }
}

// ============================================================================
// MESSAGE HANDLERS
// ============================================================================

/**
 * Message handler functions mapped by message type.
 * Each handler receives the message and returns a promise resolving to the response.
 *
 * @type {Object.<string, function>}
 */
const messageHandlers = {
    // -- Storage handlers --

    /**
     * 
     * @param {Object} _message
     * @returns {Promise<{success: boolean, data: Array<Object>}>} - Response containing success status and serialized theme groups data
     */
    'GET_ALL_GROUPS': async (_message) => {
        const groups = await loadGroups();
        return { success: true, data: groups };
    },

    /**
     * 
     * @param {Object} message 
     * @param {string} message.groupId - The ID of the group to save
     * @param {Array<string>} message.themes - Array of theme extension IDs to associate with the group
     * @returns {Promise<{success: boolean}>} - Response containing success status
     */
    'SAVE_GROUP': async (message) => {
        await saveGroup(message.groupId, message.themes);
        return { success: true };
    },

    /**
     * 
     * @param {Object} message 
     * @param {string} message.groupId - The ID of the group to delete
     * @returns {Promise<{success: boolean}>} - Response containing success status
     */
    'DELETE_GROUP': async (message) => {
        await deleteGroup(message.groupId);
        return { success: true };
    },

    /**
     * 
     * @param {Object} message 
     * @param {string} message.groupId - The ID of the group to set as active
     * @returns {Promise<{success: boolean}>} - Response containing success status
     */
    'SET_ACTIVE_GROUP': async (message) => {
        await saveActiveGroupId(message.groupId);
        return { success: true };
    },

    /**
     * 
     * @param {Object} _message 
     * @returns {Promise<{success: boolean, data: string}>} - Response containing success status and active group ID
     */
    'GET_ACTIVE_GROUP': async (_message) => {
        const activeGroup = await loadActiveGroupId();
        return { success: true, data: activeGroup };
    },

    // -- Theme API handlers --

    /**
     * 
     * @param {Object} _message 
     * @returns {Promise<{success: boolean, data: Array<Object>}>} - Response containing success status and array of installed themes
     */
    'GET_INSTALLED_THEMES': async (_message) => {
        const themes = await getThemes();
        return { success: true, data: themes };
    },

    /**
     * 
     * @param {Object} _message 
     * @returns {Promise<{success: boolean, data: Object}>} - Response containing success status and current theme information
     */
    'GET_CURRENT_THEME': async (_message) => {
        const theme = await getCurrentTheme();
        return { success: true, data: theme };
    },

    /**
     * 
     * @param {Object} message 
     * @param {string} message.themeId - The ID of the theme to enable
     * @returns {Promise<{success: boolean}>} - Response containing success status
     */
    'ENABLE_THEME': async (message) => {
        await enableTheme(message.themeId);
        return { success: true };
    },

    /**
     * 
     * @param {Object} message 
     * @param {string} message.themeId - The ID of the theme to disable
     * @returns {Promise<{success: boolean}>} - Response containing success status
     */
    'DISABLE_THEME': async (message) => {
        await disableTheme(message.themeId);
        return { success: true };
    },

    /**
     * 
     * @param {Object} message 
     * @param {string} message.themeId - The ID of the theme to get
     * @returns {Promise<{success: boolean, data: Object}>} - Response containing success status and theme information
     */
    'GET_THEME_BY_ID': async (message) => {
        const theme = await getThemeById(message.themeId);
        return { success: true, data: theme };
    }
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
    console.log('[Background] Received message:', message);

    const handler = messageHandlers[message.type];

    if (!handler) {
        console.warn('[Background] Unknown message type:', message.type);
        sendResponse({
            success: false,
            error: `Unknown message type: ${message.type}`
        });
        return false;
    }

    handler(message)
        .then(response => {
            console.log('[Background] Sending response:', response);
            sendResponse(response);
        })
        .catch(error => {
            console.error('[Background] Handler error:', error);
            sendResponse({
                success: false,
                error: error.message
            });
        });

    return true;
}

// ============================================================================
// EVENT LISTENERS & INITIALIZATION
// ============================================================================

browser.runtime.onMessage.addListener(handleMessage);

initialize();

console.log('[Background] Theme Groups background script loaded successfully!');

export { initialize, handleMessage };