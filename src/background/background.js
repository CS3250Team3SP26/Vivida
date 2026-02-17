/**
 * @fileoverview Background script for Theme Groups extension
 * Handles message routing and delegates storage operations to StorageService
 * @module background/background
 */

// Import the storage service (declared in manifest.json)
// The service is loaded via script tag, so it's available globally

// ============================================================================
// SERVICE INITIALIZATION
// ============================================================================

/**
 * Storage service instance for managing theme group data
 * @type {StorageService}
 */
const storageService = new StorageService();

// ============================================================================
// BUSINESS LOGIC FUNCTIONS
// ============================================================================

/**
 * Get all installed themes using the management API
 * 
 * @returns {Promise<Array>} Array of theme objects from browser.management API
 * 
 * @example
 * const themes = await getInstalledThemes();
 * // Returns: [{ id: "theme1", name: "Dark Theme", type: "theme", ... }]
 */
async function getInstalledThemes() {
    try {
        const allAddons = await browser.management.getAll();
        const themes = allAddons.filter(addon => addon.type === 'theme');
        console.log(`[Background] Found ${themes.length} installed themes`);
        return themes;
    } catch (error) {
        console.error('[Background] Error getting installed themes:', error);
        throw new Error(`Failed to get installed themes: ${error.message}`);
    }
}

/**
 * Initialize the extension with default data if needed
 * This runs when the extension is first installed or updated
 * 
 * @returns {Promise<void>}
 */
async function initialize() {
    console.log('[Background] Theme Groups extension initializing...');
    
    try {
        const existingGroups = await storageService.loadGroups();
        
        if (Object.keys(existingGroups).length === 0) {
            console.log('[Background] No existing groups found, initializing empty storage...');
            await storageService.saveGroups({});
            console.log('[Background] Storage initialized');
        } else {
            console.log('[Background] Found existing groups:', Object.keys(existingGroups));
        }
    } catch (error) {
        console.error('[Background] Error during initialization:', error);
    }
}

// ============================================================================
// MESSAGE HANDLERS
// ============================================================================

/**
 * Message handler functions mapped by message type
 * Each handler receives the message and returns a promise that resolves to the response
 * 
 * @type {Object.<string, function>}
 */
const messageHandlers = {
    /**
     * Handle GET_ALL_GROUPS message
     * @param {Object} message - The message object
     * @returns {Promise<Object>} Response with groups data
     */
    'GET_ALL_GROUPS': async (message) => {
        const groups = await storageService.loadGroups();
        return { success: true, data: groups };
    },

    /**
     * Handle SAVE_GROUP message
     * @param {Object} message - The message object with groupName and themes properties
     * @returns {Promise<Object>} Response indicating success
     */
    'SAVE_GROUP': async (message) => {
        await storageService.saveGroup(message.groupName, message.themes);
        return { success: true };
    },

    /**
     * Handle DELETE_GROUP message
     * @param {Object} message - The message object with groupName property
     * @returns {Promise<Object>} Response indicating success
     */
    'DELETE_GROUP': async (message) => {
        await storageService.deleteGroup(message.groupName);
        return { success: true };
    },

    /**
     * Handle GET_ACTIVE_GROUP message
     * @param {Object} message - The message object
     * @returns {Promise<Object>} Response with active group ID
     */
    'GET_ACTIVE_GROUP': async (message) => {
        const activeGroup = await storageService.loadActiveGroupId();
        return { success: true, data: activeGroup };
    },

    /**
     * Handle SET_ACTIVE_GROUP message
     * @param {Object} message - The message object with groupName property
     * @returns {Promise<Object>} Response indicating success
     */
    'SET_ACTIVE_GROUP': async (message) => {
        await storageService.saveActiveGroupId(message.groupName);
        return { success: true };
    },

    /**
     * Handle GET_INSTALLED_THEMES message
     * @param {Object} message - The message object
     * @returns {Promise<Object>} Response with installed themes data
     */
    'GET_INSTALLED_THEMES': async (message) => {
        const themes = await getInstalledThemes();
        return { success: true, data: themes };
    }
};

/**
 * Main message listener that routes messages to appropriate handlers
 * This is the central message dispatcher for the extension
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
    
    // Execute the handler and send response
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
    
    // Return true to indicate we'll send response asynchronously
    return true;
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

// Register the message listener
browser.runtime.onMessage.addListener(handleMessage);

// ============================================================================
// INITIALIZATION
// ============================================================================

// Initialize the extension when the background script loads
initialize();

console.log('[Background] Theme Groups background script loaded successfully!');

// Keep the background script alive in Firefox
// This prevents Firefox from unloading it too quickly
setInterval(() => {
    // Heartbeat to keep script alive
}, 10000);
// Export for testing (Node.js environment only)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initialize, getInstalledThemes, handleMessage };
}